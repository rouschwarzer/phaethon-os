'use server';

import { getDb } from './db';
import { R2Service } from './r2';
import { files, folders, tags, fileTags } from '../db/schema';
import { eq, and, or, ne, sql, isNull, inArray, not, asc, desc, lt } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// --- AUTH ACTIONS ---

/**
 * Timing-safe comparison of two strings.
 * Prevents timing attacks by always comparing all bytes.
 * Uses constant-time XOR comparison, portable across all JS runtimes.
 */
function timingSafeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    const encoder = new TextEncoder();
    const bufA = encoder.encode(a);
    const bufB = encoder.encode(b);
    let result = 0;
    for (let i = 0; i < bufA.length; i++) {
        result |= bufA[i] ^ bufB[i];
    }
    return result === 0;
}

const MIN_KEY_LENGTH = 62;

export async function login(identity: 'Wise' | 'Belle', key: string) {
    const masterKey = identity === 'Wise' ? process.env.WISE_KEY : process.env.BELLE_KEY;

    // Validate key length requirement
    if (!key || key.length < MIN_KEY_LENGTH) {
        return { error: 'Access Denied: Key does not meet minimum length requirement.' };
    }

    if (!masterKey || masterKey.length < MIN_KEY_LENGTH) {
        return { error: 'System Error: Master key not configured.' };
    }

    // Timing-safe comparison
    if (!timingSafeCompare(key, masterKey)) {
        return { error: 'Access Denied: Invalid Master Key' };
    }

    const cookieStore = await cookies();
    cookieStore.set('active_identity', identity, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
    });

    return { success: true };
}


export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('active_identity');
    return { success: true };
}

export async function getSession() {
    const cookieStore = await cookies();
    return cookieStore.get('active_identity')?.value as 'Wise' | 'Belle' | undefined;
}

// --- FILE SYSTEM ACTIONS ---

export async function fetchEntries(owner?: string, parentId: string | null = null, tagId?: string) {
    const db = getDb();

    // If tagId is provided, we only fetch files with that tag
    // Folders are not tagged in this implementation
    const tagFilter = tagId ? (
        tagId === 'untagged'
            ? not(inArray(files.id, db.select({ id: fileTags.fileId }).from(fileTags)))
            : inArray(files.id, db.select({ id: fileTags.fileId }).from(fileTags).where(eq(fileTags.tagId, tagId)))
    ) : undefined;

    const entries = {
        folders: tagId ? [] : await db.query.folders.findMany({
            where: and(
                owner ? eq(folders.owner, owner) : undefined,
                parentId ? eq(folders.parentId, parentId) : isNull(folders.parentId)
            ),
        }),
        files: await db.query.files.findMany({
            where: and(
                owner ? eq(files.owner, owner) : undefined,
                parentId ? eq(files.folderId, parentId) : isNull(files.folderId),
                ne(files.status, 'DELETED'),
                ne(files.category, 'SYSTEM'),
                tagFilter
            ),
            orderBy: (files, { desc }) => [desc(files.createdAt), desc(files.id)],
            with: {
                tags: {
                    with: {
                        tag: true
                    }
                }
            }
        }),
    };

    return entries;
}

/**
 * Fetch all files, optionally filtered by owner.
 * Supports viewing 'active' or 'trashed' files.
 */
export async function fetchAllFiles(owner?: string, view: 'active' | 'trash' | 'tag' = 'active', tagId?: string) {
    const db = getDb();

    const tagFilter = (view === 'tag' && tagId) ? (
        tagId === 'untagged'
            ? not(inArray(files.id, db.select({ id: fileTags.fileId }).from(fileTags)))
            : inArray(files.id, db.select({ id: fileTags.fileId }).from(fileTags).where(eq(fileTags.tagId, tagId)))
    ) : undefined;

    const result = await db.query.files.findMany({
        where: and(
            owner ? eq(files.owner, owner) : undefined,
            view === 'trash' ? eq(files.status, 'DELETED') : ne(files.status, 'DELETED'),
            ne(files.category, 'SYSTEM'),
            tagFilter
        ),
        orderBy: (files, { desc }) => [desc(files.createdAt)],
        with: {
            tags: {
                with: {
                    tag: true
                }
            }
        }
    });

    return result;
}

/**
 * Fetch files with cursor-based pagination.
 */
export async function fetchFilesPaged(
    owner?: string,
    view: 'active' | 'trash' | 'tag' = 'active',
    tagId?: string,
    parentId?: string | null,
    cursor?: { timestamp: Date; id: string },
    limit = 20
) {
    const db = getDb();

    const tagFilter = (view === 'tag' && tagId) ? (
        tagId === 'untagged'
            ? not(inArray(files.id, db.select({ id: fileTags.fileId }).from(fileTags)))
            : inArray(files.id, db.select({ id: fileTags.fileId }).from(fileTags).where(eq(fileTags.tagId, tagId)))
    ) : undefined;

    const cursorCondition = cursor ? or(
        lt(files.createdAt, cursor.timestamp),
        and(
            eq(files.createdAt, cursor.timestamp),
            lt(files.id, cursor.id)
        )
    ) : undefined;

    const result = await db.query.files.findMany({
        where: and(
            owner ? eq(files.owner, owner) : undefined,
            parentId !== undefined ? (parentId ? eq(files.folderId, parentId) : isNull(files.folderId)) : undefined,
            view === 'trash' ? eq(files.status, 'DELETED') : ne(files.status, 'DELETED'),
            ne(files.category, 'SYSTEM'),
            tagFilter,
            cursorCondition
        ),
        orderBy: [desc(files.createdAt), desc(files.id)],
        limit: limit + 1,
        with: {
            tags: {
                with: {
                    tag: true
                }
            }
        }
    });

    const hasNextPage = result.length > limit;
    const items = hasNextPage ? result.slice(0, limit) : result;
    const nextCursor = hasNextPage ? {
        timestamp: items[items.length - 1].createdAt,
        id: items[items.length - 1].id
    } : null;

    return { items, nextCursor };
}


export async function getStorageStats() {
    const db = getDb();

    const result = await db.select({
        totalSize: sql<number>`sum(${files.sizeBytes})`
    }).from(files);

    const usedBytes = Number(result[0]?.totalSize || 0);
    const totalCapacity = parseInt(process.env.SYSTEM_CAPACITY_BYTES || '107374182400'); // Default 100GB

    return {
        usedBytes,
        totalCapacity,
        percentage: Math.min(100, (usedBytes * 100) / totalCapacity),
    };
}

export async function createFolder(name: string, owner: string, parentId: string | null = null) {
    const db = getDb();
    const id = crypto.randomUUID();

    await db.insert(folders).values({
        id,
        name,
        owner,
        parentId,
    });

    revalidatePath('/');
    return { success: true, id };
}

export async function uploadFile(
    fileData: { name: string; type: string; size: number; content: ArrayBuffer },
    folderId: string | null,
    owner: string,
    category: string = 'LOG',
    originalName?: string,
    thumbnailId?: string
) {
    const db = getDb();
    const id = crypto.randomUUID(); // This is the R2 object key

    // 1. Upload to R2
    await R2Service.put(id, fileData.content, {
        httpMetadata: { contentType: fileData.type }
    });

    // 2. Size verification (Bit-perfect check)
    const head = await R2Service.head(id);
    if (!head || head.size !== fileData.size) {
        // Rollback R2 if possible
        await R2Service.delete(id);
        throw new Error('Upload Integrity Verification Failed: Size mismatch.');
    }

    // 3. Create D1 record
    await db.insert(files).values({
        id,
        name: fileData.name,
        folderId,
        category,
        status: 'ACTIVE',
        mimeType: fileData.type,
        sizeBytes: fileData.size,
        owner,
        originalName: originalName || fileData.name,
        thumbnailId,
    });

    revalidatePath('/', 'layout');
    return { success: true, id };
}

/**
 * Step 1 of Large Upload: Generate a signed PUT URL.
 */
export async function generateUploadUrl(fileName: string, fileType: string) {
    const id = crypto.randomUUID();
    const uploadUrl = await R2Service.getPresignedUploadUrl(id, fileType);

    return { id, uploadUrl };
}

/**
 * Step 2 of Large Upload: Create the database record after the client uploads to R2.
 */
export async function registerUploadRecord(
    fileId: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    folderId: string | null,
    owner: string,
    category: string = 'LOG',
    originalName?: string,
    thumbnailId?: string
) {
    const db = getDb();

    // Verify R2 object exists (Integrity check)
    const head = await R2Service.head(fileId);
    if (!head || head.size !== fileSize) {
        throw new Error('Upload Verification Failed: Object not found in storage or size mismatch.');
    }

    await db.insert(files).values({
        id: fileId,
        name: fileName,
        folderId,
        category,
        status: 'ACTIVE',
        mimeType: fileType,
        sizeBytes: fileSize,
        owner,
        originalName: originalName || fileName,
        thumbnailId,
    });

    revalidatePath('/', 'layout');
    return { success: true };
}

export type BatchUploadRecord = {
    fileId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    folderId: string | null;
    owner: string;
    category: string;
    originalName?: string;
    tags?: string[]; // Array of tag names
};

/**
 * Optimized batch registration for multiple uploads.
 * Uses parallel verification and D1 batching to prevent Worker CPU limits (Error 1102).
 */
export async function registerUploadBatch(records: BatchUploadRecord[]) {
    const db = getDb();

    // 1. Chunked R2 Integrity Verification (Save Worker CPU on Free Plan)
    const verificationResults: { id: string; valid: boolean }[] = [];
    const CHUNK_SIZE = 5;

    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
        const chunk = records.slice(i, i + CHUNK_SIZE);
        const chunkResults = await Promise.all(
            chunk.map(async (record) => {
                try {
                    const head = await R2Service.head(record.fileId);
                    return { id: record.fileId, valid: !!head && head.size === record.fileSize };
                } catch (e) {
                    return { id: record.fileId, valid: false };
                }
            })
        );
        verificationResults.push(...chunkResults);
    }

    const validRecords = records.filter(r => verificationResults.find(v => v.id === r.fileId)?.valid);
    if (validRecords.length === 0) return { success: false, error: 'All verifications failed' };

    // 2. Pre-fetch and create tags in batch
    const allTagNames = Array.from(new Set(validRecords.flatMap(r => r.tags || [])));
    const existingTags = allTagNames.length > 0
        ? await db.select().from(tags).where(inArray(tags.name, allTagNames))
        : [];

    const existingTagMap = new Map(existingTags.map(t => [t.name, t]));
    const newTagInserts = [];

    for (const tagName of allTagNames) {
        if (!existingTagMap.has(tagName)) {
            const tagId = crypto.randomUUID();
            const now = new Date();
            const newTag = {
                id: tagId,
                name: tagName,
                color: '#F97316',
                status: 'ACTIVE',
                createdAt: now,
                updatedAt: now
            };
            newTagInserts.push(db.insert(tags).values(newTag));
            existingTagMap.set(tagName, newTag as any);
        }
    }

    // 3. Prepare Batch Statements
    const batchStatements: any[] = [...newTagInserts];

    for (const record of validRecords) {
        batchStatements.push(
            db.insert(files).values({
                id: record.fileId,
                name: record.fileName,
                folderId: record.folderId,
                category: record.category,
                status: 'ACTIVE',
                mimeType: record.fileType,
                sizeBytes: record.fileSize,
                owner: record.owner,
                originalName: record.originalName || record.fileName,
            })
        );

        if (record.tags && record.tags.length > 0) {
            for (const tagName of record.tags) {
                const tag = existingTagMap.get(tagName);
                if (tag) {
                    batchStatements.push(
                        db.insert(fileTags).values({
                            fileId: record.fileId,
                            tagId: tag.id
                        }).onConflictDoNothing()
                    );
                }
            }
        }
    }

    // 4. Single Batch Execution
    if (batchStatements.length > 0) {
        await db.batch(batchStatements as any);
    }

    revalidatePath('/', 'layout');
    return { success: true };
}

export async function trashFile(fileId: string) {
    const db = getDb();
    const file = await getFileById(fileId);

    const batch: any[] = [
        db.update(files)
            .set({ status: 'DELETED', updatedAt: new Date() })
            .where(eq(files.id, fileId))
    ];

    if (file?.thumbnailId) {
        batch.push(
            db.update(files)
                .set({ status: 'DELETED', updatedAt: new Date() })
                .where(eq(files.id, file.thumbnailId))
        );
    }

    await db.batch(batch as any);
    revalidatePath('/', 'layout');
    return { success: true };
}

export async function restoreFile(fileId: string) {
    const db = getDb();
    const file = await getFileById(fileId);

    const batch: any[] = [
        db.update(files)
            .set({ status: 'ACTIVE', updatedAt: new Date() })
            .where(eq(files.id, fileId))
    ];

    if (file?.thumbnailId) {
        batch.push(
            db.update(files)
                .set({ status: 'ACTIVE', updatedAt: new Date() })
                .where(eq(files.id, file.thumbnailId))
        );
    }

    await (db as any).batch(batch);
    revalidatePath('/', 'layout');
    return { success: true };
}

export async function permanentDeleteFile(fileId: string, skipRevalidate = false) {
    const db = getDb();
    const file = await getFileById(fileId);

    // 1. Delete from R2
    await R2Service.delete(fileId);

    const batch: any[] = [db.delete(files).where(eq(files.id, fileId))];

    // 2. Cascade to Thumbnail if exists
    if (file?.thumbnailId) {
        await R2Service.delete(file.thumbnailId);
        batch.push(db.delete(files).where(eq(files.id, file.thumbnailId)));
    }

    // 3. Delete from Neon
    await db.batch(batch as any);

    if (!skipRevalidate) revalidatePath('/', 'layout');
    return { success: true };
}

export async function deleteFolder(folderId: string, skipRevalidate = false) {
    const db = getDb();

    // 1. Gather all sub-items recursively
    const allFilesToDelete: string[] = [];
    const allFoldersToDelete: string[] = [folderId];

    async function collect(fid: string) {
        const subfolders = await db.query.folders.findMany({ where: eq(folders.parentId, fid) });
        const subfiles = await db.query.files.findMany({ where: eq(files.folderId, fid) });

        for (const f of subfiles) {
            allFilesToDelete.push(f.id);
            if (f.thumbnailId) allFilesToDelete.push(f.thumbnailId);
        }

        for (const sf of subfolders) {
            allFoldersToDelete.push(sf.id);
            await collect(sf.id);
        }
    }

    await collect(folderId);

    // 2. Delete from R2 in parallel
    if (allFilesToDelete.length > 0) {
        await Promise.all(allFilesToDelete.map(id => R2Service.delete(id)));
    }

    // 3. Batch delete from D1
    const batch: any[] = [
        db.delete(folders).where(inArray(folders.id, allFoldersToDelete))
    ];

    if (allFilesToDelete.length > 0) {
        batch.unshift(db.delete(files).where(inArray(files.id, allFilesToDelete)));
    }

    await (db as any).batch(batch);

    if (!skipRevalidate) revalidatePath('/', 'layout');
    return { success: true };
}

export async function deleteEntry(type: 'file' | 'folder', id: string, action: 'trash' | 'permanent' | 'restore' = 'trash') {
    if (type === 'folder') {
        return await deleteFolder(id);
    }

    if (action === 'trash') {
        return await trashFile(id);
    } else if (action === 'restore') {
        return await restoreFile(id);
    } else {
        return await permanentDeleteFile(id);
    }
}

export async function renameEntry(type: 'file' | 'folder', id: string, newName: string) {
    const db = getDb();

    if (type === 'folder') {
        await db.update(folders)
            .set({ name: newName })
            .where(eq(folders.id, id));
    } else {
        await db.update(files)
            .set({ name: newName, updatedAt: new Date() })
            .where(eq(files.id, id));
    }

    revalidatePath('/', 'layout');
    return { success: true };
}

/**
 * Batch Trash operation for multiple entries.
 */
export async function trashEntries(items: { id: string, type: 'file' | 'folder' }[]) {
    const db = getDb();
    const batch: any[] = [];

    for (const item of items) {
        if (item.type === 'file') {
            const file = await getFileById(item.id);
            batch.push(
                db.update(files)
                    .set({ status: 'DELETED', updatedAt: new Date() })
                    .where(eq(files.id, item.id))
            );
            if (file?.thumbnailId) {
                batch.push(
                    db.update(files)
                        .set({ status: 'DELETED', updatedAt: new Date() })
                        .where(eq(files.id, file.thumbnailId))
                );
            }
        } else {
            // For folders, we perform optimized delete (permanent as folders don't have status)
            // Ideally we'd collect all items across all folders first, but for now
            // we call deleteFolder which is itself now optimized.
            await deleteFolder(item.id, true);
        }
    }

    if (batch.length > 0) {
        await (db as any).batch(batch);
    }

    revalidatePath('/', 'layout');
    return { success: true };
}

/**
 * Batch Restore operation for multiple entries.
 */
export async function restoreEntries(items: { id: string, type: 'file' | 'folder' }[]) {
    const db = getDb();
    const batch: any[] = [];

    for (const item of items) {
        if (item.type === 'file') {
            const file = await getFileById(item.id);
            batch.push(
                db.update(files)
                    .set({ status: 'ACTIVE', updatedAt: new Date() })
                    .where(eq(files.id, item.id))
            );
            if (file?.thumbnailId) {
                batch.push(
                    db.update(files)
                        .set({ status: 'ACTIVE', updatedAt: new Date() })
                        .where(eq(files.id, file.thumbnailId))
                );
            }
        }
    }

    if (batch.length > 0) {
        await (db as any).batch(batch);
    }

    revalidatePath('/', 'layout');
    return { success: true };
}

/**
 * Batch Permanent Delete operation for multiple entries.
 */
export async function permanentDeleteEntries(items: { id: string, type: 'file' | 'folder' }[]) {
    for (const item of items) {
        if (item.type === 'file') {
            await permanentDeleteFile(item.id, true);
        } else {
            await deleteFolder(item.id, true);
        }
    }

    revalidatePath('/', 'layout');
    return { success: true };
}

/**
 * Batch Move operation for multiple entries.
 */
export async function moveEntries(items: { id: string, type: 'file' | 'folder' }[], targetFolderId: string | null) {
    const db = getDb();
    const batch: any[] = [];

    for (const item of items) {
        if (item.type === 'file') {
            batch.push(
                db.update(files)
                    .set({ folderId: targetFolderId, updatedAt: new Date() })
                    .where(eq(files.id, item.id))
            );
        } else {
            if (item.id === targetFolderId) continue;
            batch.push(
                db.update(folders)
                    .set({ parentId: targetFolderId })
                    .where(eq(folders.id, item.id))
            );
        }
    }

    if (batch.length > 0) {
        await (db as any).batch(batch);
    }

    revalidatePath('/', 'layout');
    return { success: true };
}

export async function moveFile(fileId: string, folderId: string | null) {
    const db = getDb();
    await db.update(files)
        .set({ folderId, updatedAt: new Date() })
        .where(eq(files.id, fileId));
    revalidatePath('/', 'layout');
    return { success: true };
}

export async function getAllFolders() {
    const db = getDb();
    return await db.query.folders.findMany({
        orderBy: (folders, { asc }) => [asc(folders.name)]
    });
}

// --- SINGLE FILE LOOKUP ---

export async function getFileById(id: string) {
    const db = getDb();
    return await db.query.files.findFirst({
        where: eq(files.id, id),
        with: {
            tags: {
                with: {
                    tag: true
                }
            }
        }
    }) || null;
}


// --- FOLDER LOOKUP ---

export async function getFolderById(id: string) {
    const db = getDb();
    const [folderRecord] = await db
        .select()
        .from(folders)
        .where(eq(folders.id, id))
        .limit(1);

    return folderRecord || null;
}

// --- MEDIA URL ---

/**
 * Returns the IDs of the previous and next files in the same folder/cluster.
 * Used for the in-line detail slideshow navigation.
 */
/**
 * Returns the IDs of the previous and next files in the same folder/cluster.
 * Used for the in-line detail slideshow navigation.
 * Now supports context-aware filtering (tags, views).
 */
export async function getNavigationIds(fileId: string, view: 'active' | 'trash' | 'tag' = 'active', tagId?: string) {
    const db = getDb();

    // Get current file to find its folderId
    const currentFile = await db.query.files.findFirst({
        where: eq(files.id, fileId)
    });

    if (!currentFile) return { prevId: null, nextId: null };

    const tagFilter = (view === 'tag' && tagId) ? (
        tagId === 'untagged'
            ? not(inArray(files.id, db.select({ id: fileTags.fileId }).from(fileTags)))
            : inArray(files.id, db.select({ id: fileTags.fileId }).from(fileTags).where(eq(fileTags.tagId, tagId)))
    ) : undefined;

    // Must match the same filtering and ordering as fetchAllFiles for consistency
    const siblings = await db.query.files.findMany({
        where: and(
            currentFile.folderId ? eq(files.folderId, currentFile.folderId) : isNull(files.folderId),
            view === 'trash' ? eq(files.status, 'DELETED') : ne(files.status, 'DELETED'),
            ne(files.category, 'SYSTEM'),
            tagFilter
        ),
        orderBy: (files, { desc }) => [desc(files.createdAt), desc(files.id)],
    });

    const currentIndex = siblings.findIndex(f => f.id === fileId);

    return {
        prevId: currentIndex > 0 ? siblings[currentIndex - 1].id : null,
        nextId: currentIndex < siblings.length - 1 ? siblings[currentIndex + 1].id : null,
    };
}


/**
 * Returns a direct presigned stream URL for a given R2 file.
 * Bypasses Worker CPU/Memory limits by offloading to Cloudflare's storage network.
 */
export async function getMediaUrl(fileId: string): Promise<string> {
    return await R2Service.getPresignedDownloadUrl(fileId);
}

/**
 * Returns a direct presigned download URL for a given file.
 */
export async function getDownloadUrl(fileId: string, fileName?: string): Promise<string> {
    return await R2Service.getPresignedDownloadUrl(fileId, fileName);
}

// --- TAG ACTIONS ---

export async function fetchTags(status: 'ACTIVE' | 'DELETED' | 'ALL' = 'ACTIVE') {
    const db = getDb();

    // We use a manual select to get usage counts
    const result = await db.select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
        status: tags.status,
        createdAt: tags.createdAt,
        updatedAt: tags.updatedAt,
        usageCount: sql<number>`(SELECT COUNT(*) FROM ${fileTags} WHERE ${fileTags.tagId} = ${tags.id})`
    })
        .from(tags)
        .where(status === 'ALL' ? undefined : (
            status === 'ACTIVE'
                ? or(eq(tags.status, 'ACTIVE'), isNull(tags.status))
                : eq(tags.status, status)
        ))
        .orderBy(asc(tags.name));

    return result;
}

export async function createTag(name: string, color: string = '#F97316') {
    const db = getDb();
    const id = crypto.randomUUID();
    await db.insert(tags).values({
        id,
        name,
        color,
        status: 'ACTIVE',
    });
    revalidatePath('/', 'layout');
    return { success: true, id };
}

export async function updateTag(id: string, updates: { name?: string; color?: string }) {
    const db = getDb();
    await db.update(tags)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(tags.id, id));
    revalidatePath('/', 'layout');
    return { success: true };
}

export async function deleteTag(id: string, action: 'trash' | 'restore' | 'permanent' = 'trash') {
    const db = getDb();
    if (action === 'trash') {
        await db.update(tags).set({ status: 'DELETED', updatedAt: new Date() }).where(eq(tags.id, id));
    } else if (action === 'restore') {
        await db.update(tags).set({ status: 'ACTIVE', updatedAt: new Date() }).where(eq(tags.id, id));
    } else {
        await db.delete(tags).where(eq(tags.id, id));
    }
    revalidatePath('/', 'layout');
    return { success: true };
}

export async function addTagToFile(fileId: string, tagName: string) {
    const db = getDb();

    // 1. Get or create tag
    let [tagRecord] = await db.select().from(tags).where(eq(tags.name, tagName)).limit(1);
    const now = new Date();
    if (!tagRecord) {
        const tagId = crypto.randomUUID();
        const newTag = {
            id: tagId,
            name: tagName,
            color: '#F97316',
            status: 'ACTIVE',
            createdAt: now,
            updatedAt: now
        };
        await db.insert(tags).values(newTag);
        tagRecord = newTag as any;
    } else if (tagRecord.status === 'DELETED') {
        // If it was trashed, restore it when re-added to a file
        await db.update(tags).set({ status: 'ACTIVE', updatedAt: now }).where(eq(tags.id, tagRecord.id));
    }

    // 2. Link tag
    await db.insert(fileTags).values({
        fileId,
        tagId: tagRecord.id
    }).onConflictDoNothing();

    revalidatePath('/', 'layout');
    return { success: true };
}

export async function removeTagFromFile(fileId: string, tagId: string) {
    const db = getDb();
    await db.delete(fileTags).where(and(eq(fileTags.fileId, fileId), eq(fileTags.tagId, tagId)));
    revalidatePath('/', 'layout');
    return { success: true };
}
