#!/usr/bin/env bun

/**
 * Phaethon OS - Ingest Utility (Neon Edition)
 *
 * Bun-powered script for bulk-importing local files into R2 + Neon.
 */

import { readdir, stat } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { parseArgs } from 'node:util';
import { $ } from 'bun';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../src/db/schema';
import { config } from 'dotenv';

config({ path: '.env.local' });

// ---- Configuration ----
const R2_BUCKET = 'phaethon-r2';
const pgSql = neon(process.env.DATABASE_URL!);
const db = drizzle(pgSql, { schema });

// ---- MIME type mapping ----
const MIME_MAP: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.mkv': 'video/x-matroska',
    '.avi': 'video/x-msvideo',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.flac': 'audio/flac',
    '.ogg': 'audio/ogg',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.log': 'text/plain',
    '.json': 'application/json',
    '.csv': 'text/csv',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.zip': 'application/zip',
    '.dat': 'application/octet-stream',
};

function getMimeType(filename: string): string {
    const ext = extname(filename).toLowerCase();
    return MIME_MAP[ext] || 'application/octet-stream';
}

function getCategoryFromMime(mime: string): string {
    if (mime.startsWith('video/')) return 'MEDIA';
    if (mime.startsWith('audio/')) return 'AUDIO';
    if (mime.startsWith('image/')) return 'MEDIA';
    if (mime === 'text/plain') return 'LOG';
    return 'ADMIN';
}

// ---- CLI Argument Parsing ----

const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
        dir: { type: 'string' },
        owner: { type: 'string', default: 'Phaethon' },
        'folder-id': { type: 'string' },
        category: { type: 'string' },
        'dry-run': { type: 'boolean', default: false },
    },
    strict: true,
});

if (!values.dir) {
    console.error('[ERROR] --dir is required.');
    process.exit(1);
}

const SOURCE_DIR = values.dir;
const OWNER = values.owner || 'Phaethon';
const FOLDER_ID = values['folder-id'];
const CATEGORY_OVERRIDE = values.category;
const DRY_RUN = values['dry-run'] || false;

// ---- Main ----

interface IngestTask {
    filePath: string;
    folderId: string | null;
}

/**
 * Inserts a folder record into Neon.
 */
async function insertFolder(name: string, parentId: string | null, owner: string): Promise<string> {
    const id = crypto.randomUUID();
    await db.insert(schema.folders).values({
        id,
        name,
        parentId,
        owner,
    });
    return id;
}

async function walkDirectory(dirPath: string, parentId: string | null): Promise<IngestTask[]> {
    const entries = await readdir(dirPath, { withFileTypes: true });
    let tasks: IngestTask[] = [];

    for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
            console.log(`[DIR]    Processing: ${entry.name}`);
            let newFolderId = parentId;
            if (!DRY_RUN) {
                newFolderId = await insertFolder(entry.name, parentId, OWNER);
                console.log(`         [CREATED] Folder: ${entry.name} -> ${newFolderId}`);
            } else {
                newFolderId = `DRY_RUN_${crypto.randomUUID()}`;
                console.log(`         [DRY RUN] Would create folder: ${entry.name}`);
            }
            const subTasks = await walkDirectory(fullPath, newFolderId);
            tasks = tasks.concat(subTasks);
        } else if (entry.isFile()) {
            tasks.push({ filePath: fullPath, folderId: parentId });
        }
    }

    return tasks;
}

async function uploadToR2(uuid: string, filePath: string): Promise<boolean> {
    try {
        const result = await $`rclone copyto ${filePath} r2-general:${R2_BUCKET}/${uuid} -P`;
        return result.exitCode === 0;
    } catch (err) {
        console.error(`         [UPLOAD EXCEPTION] ${err}`);
        return false;
    }
}

async function generateThumbnailSnippet(videoPath: string, thumbnailPath: string): Promise<boolean> {
    try {
        const result = await $`ffmpeg -i ${videoPath} -ss 00:00:01 -vframes 1 -q:v 2 ${thumbnailPath} -y`.quiet();
        return result.exitCode === 0;
    } catch {
        return false;
    }
}

async function insertFile(record: {
    id: string;
    name: string;
    folderId: string | null;
    category: string;
    status: string;
    mimeType: string;
    sizeBytes: number;
    owner: string;
    originalName: string;
    thumbnailId?: string;
}): Promise<boolean> {
    try {
        await db.insert(schema.files).values({
            id: record.id,
            name: record.name,
            folderId: record.folderId,
            category: record.category,
            status: record.status,
            mimeType: record.mimeType,
            sizeBytes: record.sizeBytes,
            owner: record.owner,
            originalName: record.originalName,
            thumbnailId: record.thumbnailId,
        });
        return true;
    } catch (e) {
        console.error('         [DB ERROR]', e);
        return false;
    }
}

async function main() {
    console.log('\n  PHAETHON OS - INGEST UTILITY (NEON)\n');
    const tasks = await walkDirectory(SOURCE_DIR, FOLDER_ID || null);

    if (tasks.length === 0) {
        process.exit(0);
    }

    console.log(`\n[INFO] Found ${tasks.length} file(s) to process.\n`);

    let successCount = 0;
    let failCount = 0;

    for (const task of tasks) {
        const { filePath, folderId } = task;
        const uuid = crypto.randomUUID();
        const fileName = basename(filePath);
        const mimeType = getMimeType(fileName);
        const category = CATEGORY_OVERRIDE || getCategoryFromMime(mimeType);
        const fileInfo = await stat(filePath);

        console.log(`[INGEST] ${fileName} (UUID: ${uuid})`);

        if (DRY_RUN) {
            successCount++;
            continue;
        }

        let thumbnailId: string | undefined = undefined;
        if (mimeType.startsWith('video/')) {
            const tId = crypto.randomUUID();
            const tempThumb = `/tmp/phaethon_thumb_${tId}.jpg`;
            if (await generateThumbnailSnippet(filePath, tempThumb)) {
                if (await uploadToR2(tId, tempThumb)) {
                    const thumbFileInfo = await stat(tempThumb);
                    if (await insertFile({
                        id: tId,
                        name: `thumb_${fileName}.jpg`,
                        folderId,
                        category: 'SYSTEM',
                        status: 'SYNCED',
                        mimeType: 'image/jpeg',
                        sizeBytes: thumbFileInfo.size,
                        owner: OWNER,
                        originalName: `thumb_${fileName}.jpg`,
                    })) {
                        thumbnailId = tId;
                    }
                }
                await $`rm ${tempThumb}`.quiet();
            }
        }

        if (await uploadToR2(uuid, filePath)) {
            if (await insertFile({
                id: uuid,
                name: fileName,
                folderId,
                category,
                status: 'SYNCED',
                mimeType,
                sizeBytes: fileInfo.size,
                owner: OWNER,
                originalName: fileName,
                thumbnailId,
            })) {
                successCount++;
            } else {
                failCount++;
            }
        } else {
            failCount++;
        }
        console.log('');
    }

    console.log(`\n  RESULTS: ${successCount} success, ${failCount} failed.`);
}

main().catch(console.error);
