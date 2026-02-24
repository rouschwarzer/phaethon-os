'use client';

import React, { useState } from 'react';
import {
    Search,
    Plus,
    Database,
    Film,
    FolderLock,
    MoreHorizontal,
    Zap,
    Loader2,
    Folder,
    ChevronRight,
    Edit2,
    Trash2,
    ArrowLeft,
    LayoutGrid,
    List,
    Copy,
    CheckSquare,
    Square,
    X,
    Move,
    RotateCcw,
    Trash,
    Tag
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useView } from '@/context/ViewContext';
import { useFiles, useEntries, useRenameEntry, useCreateFolder, useDeleteFile, useListFolders, useTags, useInfiniteFiles } from '@/hooks/useFiles';
import { useInView } from 'react-intersection-observer';
import { formatSizeBytes, cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trashEntries, restoreEntries, permanentDeleteEntries, moveEntries } from '@/lib/actions';

interface Breadcrumb {
    id: string | null;
    name: string;
}

interface SelectionItem {
    id: string;
    type: 'file' | 'folder';
}

export default function DashboardClient() {
    const { activeView, setActiveView, selectedTagId, setSelectedTagId } = useView();
    const params = useParams();
    const router = useRouter();
    const { data: allTags = [] } = useTags();
    const parentId = (params?.id as string) || null;

    const searchParams = useSearchParams();
    const qValue = searchParams.get('q') || '';
    const [search, setSearch] = useState(qValue);

    // Sync search state when URL param changes
    React.useEffect(() => {
        setSearch(qValue);
    }, [qValue]);

    // Update URL when search changes (debounced would be better, but let's start simple)
    const updateSearchQuery = (val: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (val) {
            params.set('q', val);
        } else {
            params.delete('q');
        }
        router.push(`/?${params.toString()}`);
    };

    // Sync sidebar selection when searching
    React.useEffect(() => {
        if (!search) {
            setSelectedTagId(null);
            // Don't auto-reset activeView to 'all' here as it might break folder browsing
            return;
        }

        if (search.toLowerCase() === 'untagged') {
            setSelectedTagId('untagged');
            setActiveView('tag');
        } else {
            const matchingTag = allTags.find(t => t.name.toLowerCase() === search.toLowerCase());
            if (matchingTag) {
                setSelectedTagId(matchingTag.id);
                setActiveView('tag');
            } else {
                setSelectedTagId(null);
                setActiveView('all');
            }
        }
    }, [search, allTags, setSelectedTagId, setActiveView]);

    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [renameItem, setRenameItem] = useState<{ id: string, name: string, type: 'file' | 'folder' } | null>(null);
    const [newName, setNewName] = useState('');

    const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
    const [folderName, setFolderName] = useState('');

    const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');

    // Selection State
    const [selectedItems, setSelectedItems] = useState<SelectionItem[]>([]);
    const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const isTrashView = activeView === 'trash';
    const ownerFilter = (activeView === 'all' || isTrashView || activeView === 'tag') ? undefined :
        activeView.charAt(0).toUpperCase() + activeView.slice(1);

    // If searching or in trash, we show all files (flat)
    const {
        data: infiniteFilesNormal,
        fetchNextPage: fetchNextNormal,
        hasNextPage: hasNextNormal,
        isFetchingNextPage: isFetchingNormal,
        isLoading: filesLoading
    } = useInfiniteFiles(
        ownerFilter,
        isTrashView ? 'trash' : (activeView === 'tag' ? 'tag' : 'active'),
        selectedTagId || undefined,
        (search || isTrashView || activeView === 'tag') ? undefined : parentId
    );

    const allFiles = React.useMemo(() =>
        infiniteFilesNormal?.pages.flatMap((page: any) => page.items) || [],
        [infiniteFilesNormal]
    );

    // For normal navigation, we show entries (folders + files)
    const { data: entries = { folders: [], files: [] }, isLoading: entriesLoading } = useEntries(ownerFilter, parentId, selectedTagId || undefined);

    // Infinite scroll observer
    const { ref: sentinelRef, inView } = useInView();

    React.useEffect(() => {
        if (inView && hasNextNormal && !isFetchingNormal) {
            fetchNextNormal();
        }
    }, [inView, hasNextNormal, isFetchingNormal, fetchNextNormal]);

    const renameMutation = useRenameEntry();
    const createFolderMutation = useCreateFolder();
    const deleteMutation = useDeleteFile();

    const { data: allFoldersData = [] } = useListFolders();

    const breadcrumbs: Breadcrumb[] = React.useMemo(() => {
        const trail: Breadcrumb[] = [{ id: null, name: 'Root' }];
        if (!parentId) return trail;

        let currentId: string | null = parentId;
        const path = [];
        let iters = 0;
        while (currentId && iters < 50) {
            const folder = allFoldersData.find((f: any) => f.id === currentId);
            if (!folder) break;
            path.unshift({ id: folder.id, name: folder.name });
            currentId = folder.parentId;
            iters++;
        }
        return [...trail, ...path];
    }, [parentId, allFoldersData]);

    const handleNavigate = (folder: { id: string, name: string }) => {
        router.push(`/folders/${folder.id}${search ? `?q=${search}` : ''}`);
    };

    const handleBreadcrumbClick = (id: string | null, index: number) => {
        const query = search ? `?q=${search}` : '';
        if (id) {
            router.push(`/folders/${id}${query}`);
        } else {
            router.push(`/${query}`);
        }
    };

    const handleRename = async () => {
        if (renameItem && newName) {
            await renameMutation.mutateAsync({ type: renameItem.type, id: renameItem.id, newName });
            setIsRenameOpen(false);
            setRenameItem(null);
            setNewName('');
        }
    };

    const handleCreateFolder = async () => {
        if (folderName) {
            await createFolderMutation.mutateAsync({ name: folderName, owner: ownerFilter || 'Phaethon', parentId });
            setIsNewFolderOpen(false);
            setFolderName('');
        }
    };

    // Selection Handlers
    const toggleSelection = (id: string, type: 'file' | 'folder', e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        setSelectedItems(prev => {
            const exists = prev.find(item => item.id === id);
            if (exists) {
                return prev.filter(item => item.id !== id);
            } else {
                return [...prev, { id, type }];
            }
        });
    };

    const isSelected = (id: string) => selectedItems.some(item => item.id === id);

    const clearSelection = () => setSelectedItems([]);

    const handleBatchTrash = async () => {
        if (selectedItems.length === 0) return;
        setIsProcessing(true);
        try {
            await trashEntries(selectedItems);
            clearSelection();
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBatchRestore = async () => {
        if (selectedItems.length === 0) return;
        setIsProcessing(true);
        try {
            await restoreEntries(selectedItems);
            clearSelection();
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBatchDelete = async () => {
        if (selectedItems.length === 0) return;
        if (!confirm(`Permanently delete ${selectedItems.length} items? This cannot be undone.`)) return;

        setIsProcessing(true);
        try {
            await permanentDeleteEntries(selectedItems);
            clearSelection();
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBatchMove = async (targetFolderId: string | null) => {
        if (selectedItems.length === 0) return;
        setIsProcessing(true);
        try {
            await moveEntries(selectedItems, targetFolderId);
            clearSelection();
            setIsMoveDialogOpen(false);
        } finally {
            setIsProcessing(false);
        }
    };

    const getOwnerColor = (owner: string) => {
        if (owner === 'Wise') return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        if (owner === 'Belle') return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.1)]';
    };

    const getStatusDot = (status: string) => {
        if (status === 'ACTIVE') return 'bg-orange-500 animate-pulse';
        if (status === 'WARNING') return 'bg-yellow-500 animate-pulse';
        if (status === 'ENCRYPTED') return 'bg-purple-500';
        return 'bg-zinc-600';
    };

    const loading = search ? filesLoading : (activeView === 'tag' || activeView === 'trash' ? filesLoading : entriesLoading);

    const displayedFolders = (search || isTrashView || activeView === 'tag') ? [] : entries.folders;
    const displayedFiles = allFiles.filter(f => {
        if (!search) return true;
        if (search.toLowerCase() === 'untagged') {
            return !(f.tags as any[])?.length;
        }
        const searchTokens = search.toLowerCase().split(' ').filter(t => t.length > 0);
        return searchTokens.every(token =>
            f.name.toLowerCase().includes(token) ||
            (f.tags as any[])?.some(tagRel => tagRel.tag.name.toLowerCase().includes(token))
        );
    });

    const allCurrentVisibleItems: SelectionItem[] = [
        ...displayedFolders.map(f => ({ id: f.id, type: 'folder' as const })),
        ...displayedFiles.map(f => ({ id: f.id, type: 'file' as const }))
    ];

    const isAllSelected = allCurrentVisibleItems.length > 0 &&
        allCurrentVisibleItems.every(item => isSelected(item.id));

    const handleSelectAll = () => {
        if (isAllSelected) {
            clearSelection();
        } else {
            setSelectedItems(allCurrentVisibleItems);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-500 relative">
            {/* Action Bar */}
            <div className="p-4 lg:p-6 pb-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-zinc-800/30 bg-[#0f0f13]/20">
                <div className="flex flex-col gap-3 flex-1">
                    {/* Breadcrumbs */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-zinc-500 overflow-x-auto whitespace-nowrap scrollbar-hide">
                            {breadcrumbs.map((crumb: Breadcrumb, idx: number) => (
                                <React.Fragment key={idx}>
                                    {idx > 0 && <ChevronRight size={10} className="text-zinc-700 shrink-0" />}
                                    <button
                                        onClick={() => handleBreadcrumbClick(crumb.id, idx)}
                                        className={`hover:text-orange-500 transition-colors ${idx === breadcrumbs.length - 1 ? 'text-zinc-300' : ''}`}
                                    >
                                        {crumb.name}
                                    </button>
                                </React.Fragment>
                            ))}
                        </div>

                        {allCurrentVisibleItems.length > 0 && (
                            <button
                                onClick={handleSelectAll}
                                className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-yellow-500 transition-colors bg-zinc-900/50 px-3 py-1.5 rounded-sm border border-zinc-800/50"
                            >
                                {isAllSelected ? <CheckSquare size={12} className="text-yellow-500" /> : <Square size={12} />}
                                {isAllSelected ? 'DESELECT ALL' : 'SELECT ALL'}
                            </button>
                        )}
                    </div>

                    <div className="relative w-full max-w-none sm:max-w-md group">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-yellow-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Query system directories..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                // For real-time URL sync, though debounce is safer
                                const val = e.target.value;
                                const params = new URLSearchParams(window.location.search);
                                if (val) params.set('q', val);
                                else params.delete('q');
                                router.replace(`${window.location.pathname}?${params.toString()}`, { scroll: false });
                            }}
                            className="w-full bg-[#15151a] border border-zinc-800 focus:border-yellow-500/50 rounded-sm py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all focus:shadow-[0_0_15px_rgba(234,179,8,0.05)]"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isTrashView && (
                        <button
                            onClick={() => setIsNewFolderOpen(true)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-sm text-xs font-bold tracking-wider items-center gap-2 transition-transform active:scale-95 border border-zinc-700 flex"
                        >
                            <Plus size={14} /> FOLDER
                        </button>
                    )}
                    <Link
                        href={`/uplink${parentId ? `?folderId=${parentId}` : ''}`}
                        className="flex justify-center bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2.5 rounded-sm text-xs font-bold tracking-wider items-center gap-2 transition-transform active:scale-95"
                    >
                        <Plus size={14} strokeWidth={3} /> NEW UPLINK
                    </Link>
                </div>

                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-sm border border-zinc-800/50">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-sm transition-colors ${viewMode === 'list' ? 'bg-zinc-800 text-yellow-500' : 'text-zinc-600 hover:text-zinc-400'}`}
                        title="List View"
                    >
                        <List size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('gallery')}
                        className={`p-1.5 rounded-sm transition-colors ${viewMode === 'gallery' ? 'bg-zinc-800 text-yellow-500' : 'text-zinc-600 hover:text-zinc-400'}`}
                        title="Gallery View"
                    >
                        <LayoutGrid size={16} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-6 pt-4 pb-24">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4 py-20">
                        <Loader2 size={32} className="animate-spin text-orange-500/50" />
                        <p className="text-[10px] uppercase tracking-widest">Querying D1 Database...</p>
                    </div>
                ) : (
                    <>
                        <div className={viewMode === 'gallery'
                            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                            : "grid grid-cols-1 xl:grid-cols-2 gap-3"
                        }>
                            {/* Folders */}
                            {displayedFolders.map(folder => {
                                const active = isSelected(folder.id);
                                return (
                                    <div
                                        key={folder.id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border bg-[#121216] transition-all cursor-pointer group relative",
                                            active ? "border-yellow-500/50 bg-yellow-500/5 shadow-[0_0_15px_rgba(234,179,8,0.05)]" : "border-zinc-800/80 hover:border-zinc-500/40 hover:bg-[#1a1a20]",
                                            viewMode === 'gallery' ? "flex-col text-center p-4 aspect-square justify-center shadow-lg" : ""
                                        )}
                                        onClick={() => handleNavigate(folder)}
                                    >
                                        <div
                                            onClick={(e) => toggleSelection(folder.id, 'folder', e)}
                                            className={cn(
                                                "transition-all shrink-0 z-30",
                                                viewMode === 'gallery'
                                                    ? "absolute top-2 right-2 p-1.5 rounded-sm bg-black/60 border border-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100"
                                                    : "opacity-100",
                                                active && "opacity-100 text-yellow-500"
                                            )}
                                        >
                                            {active ? <CheckSquare size={viewMode === 'gallery' ? 16 : 18} /> : <Square size={viewMode === 'gallery' ? 16 : 18} className="text-zinc-700" />}
                                        </div>

                                        <div className={cn(
                                            viewMode === 'gallery' ? 'w-16 h-16 mb-2' : 'w-10 h-10',
                                            "rounded-md flex items-center justify-center shrink-0 border bg-black/40",
                                            getOwnerColor(folder.owner)
                                        )}>
                                            <Folder size={viewMode === 'gallery' ? 24 : 18} />
                                        </div>
                                        <div className="flex-1 min-w-0 w-full">
                                            <h3 className={cn(
                                                "text-sm font-bold truncate transition-colors uppercase",
                                                active ? "text-white" : "text-zinc-200 group-hover:text-white"
                                            )}>
                                                {folder.name}
                                            </h3>
                                            <div className="flex items-center mt-1">
                                                <p className="text-[9px] text-zinc-600 tracking-widest uppercase py-1">Directory</p>
                                                <span className="text-[9px] text-zinc-700 mx-1.5">•</span>
                                                <button
                                                    className="flex flex-1 min-w-0 items-center gap-1.5 text-[9px] text-zinc-500 font-mono truncate hover:text-orange-500 hover:bg-zinc-800/50 p-1 -ml-1 rounded transition-colors active:scale-95"
                                                    title="Click to copy UUID"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(folder.id || '');
                                                    }}
                                                >
                                                    <span className="truncate">{folder.id?.split('-')[0]}...</span>
                                                    <Copy size={10} className="shrink-0" />
                                                </button>
                                            </div>
                                        </div>
                                        {viewMode !== 'gallery' && (
                                            <div className="flex items-center gap-2 pr-2">
                                                <button
                                                    className="text-zinc-600 hover:text-orange-500 transition-colors p-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRenameItem({ id: folder.id, name: folder.name, type: 'folder' });
                                                        setNewName(folder.name);
                                                        setIsRenameOpen(true);
                                                    }}
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    className="text-zinc-600 hover:text-red-500 transition-colors p-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm('Permanently delete this directory and all its contents?')) {
                                                            deleteMutation.mutate({ id: folder.id, type: 'folder' });
                                                        }
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Files */}
                            {displayedFiles.map((file, idx) => {
                                const active = isSelected(file.id);
                                return (
                                    <div
                                        key={file.id}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border bg-[#121216] transition-all cursor-pointer group relative",
                                            active ? "border-yellow-500/50 bg-yellow-500/5 shadow-[0_0_15px_rgba(234,179,8,0.05)]" : (file.owner === 'Phaethon' ? 'border-orange-900/30 hover:border-orange-500/40' : 'border-zinc-800/80 hover:border-zinc-600'),
                                            viewMode === 'gallery' ? "flex-col text-center p-0 overflow-hidden aspect-square items-stretch" : ""
                                        )}
                                        onClick={(e) => {
                                            if (e.ctrlKey || e.metaKey) {
                                                toggleSelection(file.id, 'file', e);
                                            } else {
                                                const query = new URLSearchParams();
                                                if (activeView === 'trash') query.set('view', 'trash');
                                                if (activeView === 'tag' && selectedTagId) {
                                                    query.set('view', 'tag');
                                                    query.set('tagId', selectedTagId);
                                                }
                                                const queryString = query.toString();
                                                router.push(`/files/${file.id}${queryString ? `?${queryString}` : ''}`);
                                            }
                                        }}
                                    >
                                        <div
                                            onClick={(e) => toggleSelection(file.id, 'file', e)}
                                            className={cn(
                                                "transition-all shrink-0 z-30",
                                                viewMode === 'gallery'
                                                    ? "absolute top-2 right-2 p-1.5 rounded-sm bg-black/60 border border-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 shadow-xl"
                                                    : "opacity-100",
                                                active && "opacity-100 text-yellow-500"
                                            )}
                                        >
                                            {active ? <CheckSquare size={viewMode === 'gallery' ? 16 : 18} /> : <Square size={viewMode === 'gallery' ? 16 : 18} className="text-zinc-700 font-bold" />}
                                        </div>

                                        <div className={cn(
                                            viewMode === 'gallery' ? 'flex-1 w-full bg-black/40' : 'w-10 h-10',
                                            "rounded-sm flex items-center justify-center shrink-0 border overflow-hidden border-none relative",
                                            getOwnerColor(file.owner)
                                        )}>
                                            {file.mimeType.startsWith('image/') ? (
                                                <img
                                                    src={`/api/media/${file.id}`}
                                                    alt=""
                                                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-zinc-900/50">
                                                    {file.thumbnailId ? (
                                                        <img
                                                            src={`/api/media/${file.thumbnailId}`}
                                                            alt={file.name}
                                                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                                        />
                                                    ) : (
                                                        file.category === 'MEDIA' || file.mimeType.startsWith('video/') ? <Film size={viewMode === 'gallery' ? 32 : 18} /> :
                                                            file.category === 'ENCRYPTED' ? <FolderLock size={viewMode === 'gallery' ? 32 : 18} /> :
                                                                file.category === 'AUDIO' || file.mimeType.startsWith('audio/') ? <Zap size={viewMode === 'gallery' ? 32 : 18} /> :
                                                                    <Database size={viewMode === 'gallery' ? 32 : 18} />
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className={cn(
                                            "flex-1 min-w-0",
                                            viewMode === 'gallery' && "p-3 w-full bg-[#0a0a0d] border-t border-zinc-800/50"
                                        )}>
                                            <div className={cn("flex items-center gap-2 mb-0.5", viewMode === 'gallery' && "justify-start")}>
                                                {viewMode === 'gallery' && (
                                                    <div className={cn("w-2 h-2 rounded-full shrink-0", getStatusDot(file.status))}></div>
                                                )}
                                                <h3 className={cn(
                                                    "text-sm font-bold truncate transition-colors",
                                                    active ? "text-white" : "text-zinc-200 group-hover:text-white"
                                                )}>
                                                    {file.name}
                                                </h3>
                                                {(file.tags as any[])?.length > 0 && viewMode === 'gallery' && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {(file.tags as any[]).slice(0, 2).map((tagRel: any) => (
                                                            <span key={tagRel.tag.id} className="px-1 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-500 rounded-px text-[7px] font-black uppercase tracking-tighter shrink-0">
                                                                {tagRel.tag.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={cn("flex items-center gap-2 text-[9px] text-zinc-500 tracking-wider", viewMode === 'gallery' && "justify-start")}>
                                                <span className="uppercase">{file.category}</span>
                                                <span className="opacity-30">•</span>
                                                <span className="shrink-0">{formatSizeBytes(file.sizeBytes)}</span>
                                                {viewMode !== 'gallery' && (
                                                    <>
                                                        <span className="opacity-30">•</span>
                                                        <span className={cn(
                                                            "uppercase font-bold truncate",
                                                            file.owner === 'Wise' ? 'text-blue-500/70' : file.owner === 'Belle' ? 'text-yellow-400/70' : 'text-orange-500/70'
                                                        )}>
                                                            {file.owner}
                                                        </span>
                                                        {(file.tags as any[])?.length > 0 && (
                                                            <>
                                                                <span className="opacity-30">•</span>
                                                                <div className="flex items-center gap-1.5 overflow-hidden">
                                                                    {(file.tags as any[]).slice(0, 3).map((tagRel: any) => (
                                                                        <span key={tagRel.tag.id} className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-px text-[8px] font-bold flex items-center gap-1 shrink-0">
                                                                            <Tag size={8} />
                                                                            {tagRel.tag.name}
                                                                        </span>
                                                                    ))}
                                                                    {(file.tags as any[]).length > 3 && <span className="text-[8px] text-zinc-600">+{(file.tags as any[]).length - 3}</span>}
                                                                </div>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {viewMode !== 'gallery' && (
                                            <div className="flex items-center gap-2 sm:gap-4 pl-3 sm:pl-4 border-l border-zinc-800/50 h-full">
                                                <div className="flex items-center gap-1.5 w-auto sm:w-20 justify-end shrink-0">
                                                    <span className="hidden xs:inline text-[9px] uppercase tracking-widest text-zinc-500">{file.status}</span>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.3)]", getStatusDot(file.status))}></div>
                                                </div>
                                                <button
                                                    className="text-zinc-600 hover:text-orange-500 transition-colors p-1"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setRenameItem({ id: file.id, name: file.name, type: 'file' });
                                                        setNewName(file.name);
                                                        setIsRenameOpen(true);
                                                    }}
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination Sentinel */}
                        {(hasNextNormal || isFetchingNormal) && (
                            <div ref={sentinelRef} className="py-10 flex justify-center w-full">
                                <Loader2 size={24} className="animate-spin text-orange-500/50" />
                            </div>
                        )}

                        {displayedFolders.length === 0 && displayedFiles.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4 py-20">
                                {activeView === 'trash' ? (
                                    <>
                                        <Database size={48} className="opacity-20 translate-y-2" />
                                        <p className="text-sm uppercase tracking-[0.3em] text-center px-4 font-bold opacity-40">Recycle Bin Cleared</p>
                                        <p className="text-[10px] uppercase tracking-widest text-zinc-700">No objects flagged for disposal</p>
                                    </>
                                ) : (
                                    <>
                                        <img src="/eous-running.webp" alt="Eous Running" className="w-24 h-24 object-contain animate-bounce" />
                                        <p className="text-sm uppercase tracking-widest text-center px-4">No matching directories found by Eous</p>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Selection Toolbar */}
            {selectedItems.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-300">
                    <div className="bg-[#0f0f13] border border-yellow-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center gap-4 px-6 py-4 rounded-sm backdrop-blur-xl">
                        <div className="flex items-center gap-4 pr-6 border-r border-zinc-800">
                            <button onClick={clearSelection} className="text-zinc-500 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black text-white uppercase tracking-widest">{selectedItems.length} OBJECTS SELECTED</span>
                                <span className="text-[8px] text-zinc-500 uppercase font-bold">Protocol Batch Active</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {isTrashView ? (
                                <>
                                    <button
                                        disabled={isProcessing}
                                        onClick={handleBatchRestore}
                                        className="h-10 px-4 bg-green-500/10 border border-green-500/30 text-green-500 hover:bg-green-500/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                                        Restore
                                    </button>
                                    <button
                                        disabled={isProcessing}
                                        onClick={handleBatchDelete}
                                        className="h-10 px-4 bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Trash size={14} />}
                                        Delete Forever
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        disabled={isProcessing}
                                        onClick={() => setIsMoveDialogOpen(true)}
                                        className="h-10 px-4 bg-blue-500/10 border border-blue-500/30 text-blue-500 hover:bg-blue-500/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Move size={14} />}
                                        Move
                                    </button>
                                    <button
                                        disabled={isProcessing}
                                        onClick={handleBatchTrash}
                                        className="h-10 px-4 bg-orange-500/10 border border-orange-500/30 text-orange-500 hover:bg-orange-500/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        Trash
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Rename Dialog */}
            <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                <DialogContent className="bg-[#0f0f13] border-zinc-800 text-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="text-sm uppercase tracking-widest font-bold">Rename System Object</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="bg-black/40 border-zinc-800 focus:border-orange-500 text-zinc-200"
                            placeholder="Enter new designation..."
                            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsRenameOpen(false)} className="text-zinc-500 hover:text-zinc-300">CANCEL</Button>
                        <Button onClick={handleRename} className="bg-orange-500 hover:bg-orange-400 text-black">CONFIRM RENAME</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* New Folder Dialog */}
            <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
                <DialogContent className="bg-[#0f0f13] border-zinc-800 text-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="text-sm uppercase tracking-widest font-bold">Initialize New Directory</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            className="bg-black/40 border-zinc-800 focus:border-orange-500 text-zinc-200"
                            placeholder="DIRECTORY_NAME"
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsNewFolderOpen(false)} className="text-zinc-500 hover:text-zinc-300">CANCEL</Button>
                        <Button onClick={handleCreateFolder} className="bg-orange-500 hover:bg-orange-400 text-black">CREATE DIR</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Move Dialog */}
            <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
                <DialogContent className="bg-[#0f0f13] border-zinc-800 text-zinc-200 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-sm uppercase tracking-widest font-bold">Relocate Protocol Nodes</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 max-h-[400px] overflow-y-auto custom-scrollbar space-y-2">
                        <button
                            onClick={() => handleBatchMove(null)}
                            className="w-full flex items-center gap-3 p-3 rounded border border-zinc-800 bg-black/40 hover:bg-zinc-800/50 hover:border-yellow-500/30 transition-all text-left group"
                        >
                            <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-500 group-hover:text-yellow-500">
                                <Plus size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Root Directory</span>
                                <span className="text-[8px] text-zinc-600 uppercase font-black tracking-tighter">PRIMARY_NODE</span>
                            </div>
                        </button>

                        {allFoldersData
                            .filter((f: any) => !selectedItems.some(item => item.id === f.id && item.type === 'folder'))
                            .map((folder: any) => (
                                <button
                                    key={folder.id}
                                    onClick={() => handleBatchMove(folder.id)}
                                    className="w-full flex items-center gap-3 p-3 rounded border border-zinc-800 bg-black/40 hover:bg-zinc-800/50 hover:border-blue-500/30 transition-all text-left group"
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded flex items-center justify-center border",
                                        getOwnerColor(folder.owner)
                                    )}>
                                        <Folder size={14} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">{folder.name}</span>
                                        <span className="text-[8px] text-zinc-600 uppercase font-black tracking-tighter">{folder.owner.toUpperCase()} • NODE_{folder.id.split('-')[0]}</span>
                                    </div>
                                </button>
                            ))}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsMoveDialogOpen(false)} className="text-zinc-500 hover:text-zinc-300">CANCEL</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
