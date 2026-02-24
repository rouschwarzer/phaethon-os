import { fetchAllFiles, getFileById, uploadFile, deleteEntry, fetchEntries, createFolder, renameEntry, moveFile, getAllFolders, fetchTags, addTagToFile, removeTagFromFile } from '@/lib/actions';

export const fileService = {
    getAll: async (owner?: string, view: 'active' | 'trash' | 'tag' = 'active', tagId?: string) => {
        return await fetchAllFiles(owner, view, tagId);
    },

    getFilesPaged: async (
        owner?: string,
        view: 'active' | 'trash' | 'tag' = 'active',
        tagId?: string,
        parentId?: string | null,
        cursor?: { timestamp: Date; id: string },
        limit = 20
    ) => {
        const { fetchFilesPaged } = await import('@/lib/actions');
        return await fetchFilesPaged(owner, view, tagId, parentId, cursor, limit);
    },

    getEntries: async (owner?: string, parentId: string | null = null, tagId?: string) => {
        return await fetchEntries(owner, parentId, tagId);
    },

    getById: async (id: string) => {
        return await getFileById(id);
    },

    createFolder: async (name: string, owner: string, parentId: string | null = null) => {
        return await createFolder(name, owner, parentId);
    },

    rename: async (type: 'file' | 'folder', id: string, newName: string) => {
        return await renameEntry(type, id, newName);
    },

    delete: async (id: string, type: 'file' | 'folder', action: 'trash' | 'permanent' | 'restore' = 'trash') => {
        return await deleteEntry(type, id, action);
    },

    move: async (fileId: string, folderId: string | null) => {
        return await moveFile(fileId, folderId);
    },

    listFolders: async () => {
        return await getAllFolders();
    },

    // Tags
    getTags: async (status: 'ACTIVE' | 'DELETED' | 'ALL' = 'ACTIVE') => {
        return await fetchTags(status);
    },

    createTag: async (name: string, color?: string) => {
        const { createTag } = await import('@/lib/actions');
        return await createTag(name, color);
    },

    updateTag: async (id: string, updates: { name?: string; color?: string }) => {
        const { updateTag } = await import('@/lib/actions');
        return await updateTag(id, updates);
    },

    deleteTag: async (id: string, action: 'trash' | 'restore' | 'permanent' = 'trash') => {
        const { deleteTag } = await import('@/lib/actions');
        return await deleteTag(id, action);
    },

    addTag: async (fileId: string, tagName: string) => {
        return await addTagToFile(fileId, tagName);
    },

    removeTag: async (fileId: string, tagId: string) => {
        return await removeTagFromFile(fileId, tagId);
    }
};
