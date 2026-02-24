import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { fileService } from '@/services/fileService';
import { uploadFile } from '@/lib/actions';

export const useFiles = (owner?: string, view: 'active' | 'trash' | 'tag' = 'active', tagId?: string) => {
    return useQuery({
        queryKey: ['files', { owner, view, tagId }],
        queryFn: () => fileService.getAll(owner, view, tagId),
    });
};

export const useInfiniteFiles = (
    owner?: string,
    view: 'active' | 'trash' | 'tag' = 'active',
    tagId?: string,
    parentId?: string | null,
    limit = 20
) => {
    return useInfiniteQuery({
        queryKey: ['files-paged', { owner, view, tagId, parentId }],
        queryFn: ({ pageParam }) => fileService.getFilesPaged(
            owner,
            view,
            tagId,
            parentId,
            pageParam as { timestamp: Date; id: string } | undefined,
            limit
        ),
        initialPageParam: undefined as { timestamp: Date; id: string } | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
    });
};

export const useEntries = (owner?: string, parentId: string | null = null, tagId?: string) => {
    return useQuery({
        queryKey: ['entries', { owner, parentId, tagId }],
        queryFn: () => fileService.getEntries(owner, parentId, tagId),
    });
};

export const useFile = (id: string) => {
    return useQuery({
        queryKey: ['file', id],
        queryFn: () => fileService.getById(id),
        enabled: !!id,
    });
};

export const useCreateFolder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ name, owner, parentId }: { name: string, owner: string, parentId: string | null }) =>
            fileService.createFolder(name, owner, parentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['entries'] });
        }
    });
};

export const useRenameEntry = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ type, id, newName }: { type: 'file' | 'folder', id: string, newName: string }) =>
            fileService.rename(type, id, newName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['entries'] });
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['file'] });
        }
    });
};

export const useUploadFile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ fileData, folderId, owner, category }: {
            fileData: { name: string; type: string; size: number; content: ArrayBuffer },
            folderId: string | null,
            owner: string,
            category?: string
        }) => uploadFile(fileData, folderId, owner, category, fileData.name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
        }
    });
};

export const useDeleteFile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, type, action }: { id: string, type: 'file' | 'folder', action?: 'trash' | 'permanent' | 'restore' }) =>
            fileService.delete(id, type, action),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['file'] });
            queryClient.invalidateQueries({ queryKey: ['entries'] });
        }
    });
};

export const useListFolders = () => {
    return useQuery({
        queryKey: ['all-folders'],
        queryFn: () => fileService.listFolders(),
    });
};

export const useMoveFile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ fileId, folderId }: { fileId: string, folderId: string | null }) =>
            fileService.move(fileId, folderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['file'] });
            queryClient.invalidateQueries({ queryKey: ['entries'] });
        }
    });
};

export const useTags = (status: 'ACTIVE' | 'DELETED' | 'ALL' = 'ACTIVE') => {
    return useQuery({
        queryKey: ['tags', { status }],
        queryFn: () => fileService.getTags(status),
    });
};

export const useCreateTag = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ name, color }: { name: string, color?: string }) =>
            fileService.createTag(name, color),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
        }
    });
};

export const useUpdateTag = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string, updates: { name?: string; color?: string } }) =>
            fileService.updateTag(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['entries'] });
        }
    });
};

export const useDeleteTag = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, action }: { id: string, action?: 'trash' | 'permanent' | 'restore' }) =>
            fileService.deleteTag(id, action),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['entries'] });
        }
    });
};

export const useAddTag = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ fileId, tagName }: { fileId: string, tagName: string }) =>
            fileService.addTag(fileId, tagName),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['file'] });
            queryClient.invalidateQueries({ queryKey: ['entries'] });
            queryClient.invalidateQueries({ queryKey: ['tags'] });
        }
    });
};

export const useRemoveTag = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ fileId, tagId }: { fileId: string, tagId: string }) =>
            fileService.removeTag(fileId, tagId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            queryClient.invalidateQueries({ queryKey: ['file'] });
            queryClient.invalidateQueries({ queryKey: ['entries'] });
            queryClient.invalidateQueries({ queryKey: ['tags'] });
        }
    });
};
