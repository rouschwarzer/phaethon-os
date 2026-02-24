import { pgTable, text, timestamp, boolean, bigint, primaryKey, AnyPgColumn, unique } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

export const folders = pgTable('folders', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    parentId: text('parent_id').references((): AnyPgColumn => folders.id),
    owner: text('owner').notNull(), // 'Wise', 'Belle', 'Phaethon'
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const files = pgTable('files', {
    id: text('id').primaryKey(), // Using ID as the R2 object key (UUID)
    name: text('name').notNull(),
    folderId: text('folder_id').references(() => folders.id),
    category: text('category').notNull(), // 'ENCRYPTED', 'MEDIA', 'LOG', etc.
    status: text('status').notNull(), // 'ACTIVE', 'WARNING', 'SYNCED', 'ARCHIVED'
    mimeType: text('mime_type').notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    owner: text('owner').notNull(),
    isPinned: boolean('is_pinned').notNull().default(false),
    originalName: text('original_name'),
    thumbnailId: text('thumbnail_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const tags = pgTable('tags', {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
    color: text('color').notNull().default('#F97316'), // Default Phaethon Orange
    status: text('status').notNull().default('ACTIVE'), // 'ACTIVE', 'DELETED'
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const fileTags = pgTable('file_tags', {
    fileId: text('file_id').notNull().references(() => files.id, { onDelete: 'cascade' }),
    tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => ({
    pk: primaryKey({ columns: [t.fileId, t.tagId] }),
}));

// Relations
export const filesRelations = relations(files, ({ many }) => ({
    tags: many(fileTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
    files: many(fileTags),
}));

export const fileTagsRelations = relations(fileTags, ({ one }) => ({
    file: one(files, {
        fields: [fileTags.fileId],
        references: [files.id],
    }),
    tag: one(tags, {
        fields: [fileTags.tagId],
        references: [tags.id],
    }),
}));
