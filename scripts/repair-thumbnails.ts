#!/usr/bin/env bun

/**
 * Phaethon OS - Thumbnail Repair Utility
 * 
 * Scans the database for videos missing thumbnails and generates/uploads them.
 */

import { join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { $ } from 'bun';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../src/db/schema';
import { config } from 'dotenv';
import { isNull, and, sql, eq } from 'drizzle-orm';
import { R2Service } from '../src/lib/r2';
import { createReadStream } from 'node:fs';
import { stat, mkdir } from 'node:fs/promises';
import { parseArgs } from 'node:util';

config({ path: '.env.local' });

const TEMP_DIR = join(process.cwd(), '.tmp');
const pgSql = neon(process.env.DATABASE_URL!);
const db = drizzle(pgSql, { schema });

const { values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
        dir: { type: 'string' },
        owner: { type: 'string', default: 'Phaethon' },
    },
    strict: true,
});

if (!values.dir) {
    console.error('[ERROR] --dir is required (path to your local video library).');
    process.exit(1);
}

const SOURCE_DIR = values.dir;

async function getVideoDuration(videoPath: string): Promise<number> {
    try {
        const result = await $`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${videoPath}`.text();
        const duration = parseFloat(result.trim());
        return isNaN(duration) ? 0 : duration;
    } catch {
        return 0;
    }
}

async function generateThumbnail(videoPath: string, thumbnailPath: string): Promise<boolean> {
    try {
        const duration = await getVideoDuration(videoPath);
        let seekTime = '00:00:01';
        if (duration > 60) {
            const start = duration * 0.15;
            const end = duration * 0.85;
            seekTime = (start + (Math.random() * (end - start))).toFixed(3);
        } else if (duration > 0) {
            seekTime = (duration / 2).toFixed(3);
        }

        const result = await $`ffmpeg -ss ${seekTime} -i ${videoPath} -vf "thumbnail=100" -vframes 1 -q:v 2 ${thumbnailPath} -y`.quiet();
        return result.exitCode === 0;
    } catch {
        return false;
    }
}

async function uploadToR2(uuid: string, filePath: string): Promise<boolean> {
    try {
        const s = await stat(filePath);
        const stream = createReadStream(filePath);
        await R2Service.put(uuid, stream, {
            httpMetadata: { contentType: 'image/jpeg' },
            contentLength: s.size
        });
        return true;
    } catch (err) {
        console.error(`         [UPLOAD ERROR] ${err}`);
        return false;
    }
}

async function main() {
    console.log('\n  PHAETHON OS - THUMBNAIL REPAIR TOOL\n');
    await mkdir(TEMP_DIR, { recursive: true });

    // 1. Find videos in DB missing thumbnails
    const videosMissingThumbs = await db.select().from(schema.files).where(
        and(
            sql`${schema.files.mimeType} LIKE 'video/%'`,
            isNull(schema.files.thumbnailId)
        )
    );

    console.log(`[INFO] Found ${videosMissingThumbs.length} videos in database missing thumbnails.`);

    if (videosMissingThumbs.length === 0) {
        console.log('✅ Nothing to repair.');
        return;
    }

    let repairedCount = 0;
    const CONCURRENCY = 4;

    /**
     * Worker function to process a single video thumbnail repair.
     */
    const processVideo = async (video: any) => {
        console.log(`\n[REPAIR] checking: ${video.originalName || video.name}`);

        // 2. Try to find the local file using Bun's native Glob for reliability
        try {
            const pattern = `**/${video.originalName || video.name}`;
            const scanner = new Bun.Glob(pattern);
            const matches = Array.from(scanner.scanSync({ cwd: SOURCE_DIR, onlyFiles: true }));
            const firstMatch = matches[0];

            if (!firstMatch) {
                console.warn(`         [SKIP] Local file not found in ${SOURCE_DIR}`);
                return;
            }

            const firstPath = join(SOURCE_DIR, firstMatch);
            console.log(`         [FOUND] Local path: ${firstPath}`);

            const tId = crypto.randomUUID();
            const tempThumb = join(TEMP_DIR, `repair_thumb_${tId}.jpg`);

            if (await generateThumbnail(firstPath, tempThumb)) {
                if (await uploadToR2(tId, tempThumb)) {
                    const thumbStat = await stat(tempThumb);

                    // Insert thumbnail SYSTEM file
                    await db.insert(schema.files).values({
                        id: tId,
                        name: `thumb_${video.name}.jpg`,
                        folderId: video.folderId,
                        category: 'SYSTEM',
                        status: 'SYNCED',
                        mimeType: 'image/jpeg',
                        sizeBytes: thumbStat.size,
                        owner: video.owner,
                        originalName: `thumb_${video.name}.jpg`,
                    });

                    // Update original video
                    await db.update(schema.files)
                        .set({ thumbnailId: tId })
                        .where(eq(schema.files.id, video.id));

                    repairedCount++;
                    console.log(`         [DONE] Thumbnail generated and linked.`);
                }
                await $`rm -f ${tempThumb}`.quiet();
            } else {
                console.error(`         [FAIL] FFmpeg failed for this file.`);
            }

        } catch (e) {
            console.error(`         [ERROR] Failed to process ${video.name}:`, e);
        }
    };

    // Process videos using a simple pool
    const pool = new Set<Promise<void>>();
    for (const video of videosMissingThumbs) {
        if (pool.size >= CONCURRENCY) {
            await Promise.race(pool);
        }
        const promise = processVideo(video).finally(() => pool.delete(promise));
        pool.add(promise);
    }
    await Promise.all(pool);

    console.log(`\n✅ Repair complete! ${repairedCount} thumbnails backfilled.`);
}

main().catch(console.error);
