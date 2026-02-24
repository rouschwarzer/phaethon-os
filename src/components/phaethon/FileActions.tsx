'use client';

import React, { useState } from 'react';
import { Trash2, RefreshCw, AlertTriangle, Loader2, FolderInput, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDeleteFile, useListFolders, useMoveFile } from '@/hooks/useFiles';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FileActionsProps {
    fileId: string;
    status: string;
}

export function FileActions({ fileId, status }: FileActionsProps) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [isMoveOpen, setIsMoveOpen] = useState(false);
    const [searchFolder, setSearchFolder] = useState('');

    const router = useRouter();
    const deleteMutation = useDeleteFile();
    const moveMutation = useMoveFile();
    const { data: allFolders = [], isLoading: foldersLoading } = useListFolders();

    const handleTrash = () => {
        deleteMutation.mutate({ id: fileId, type: 'file', action: 'trash' }, {
            onSuccess: () => router.push('/')
        });
    };

    const handleRestore = () => {
        deleteMutation.mutate({ id: fileId, type: 'file', action: 'restore' }, {
            onSuccess: () => router.refresh()
        });
    };

    const handlePermanentDelete = () => {
        deleteMutation.mutate({ id: fileId, type: 'file', action: 'permanent' }, {
            onSuccess: () => router.push('/')
        });
    };

    const handleMove = async (folderId: string | null) => {
        await moveMutation.mutateAsync({ fileId, folderId });
        setIsMoveOpen(false);
        router.refresh();
    };

    const loading = deleteMutation.isPending || moveMutation.isPending;
    const isDeleted = status === 'DELETED';

    const filteredFolders = allFolders.filter(f =>
        f.name.toLowerCase().includes(searchFolder.toLowerCase())
    );

    if (isDeleted) {
        return (
            <div className="space-y-3">
                <button
                    disabled={loading}
                    onClick={handleRestore}
                    className="w-full h-12 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 border border-zinc-700"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    Restore Archive
                </button>

                {!confirmDelete ? (
                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="w-full h-12 bg-red-950/20 hover:bg-red-950/40 text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 border border-red-900/30"
                    >
                        <Trash2 size={16} /> Delete Permanently
                    </button>
                ) : (
                    <button
                        disabled={loading}
                        onClick={handlePermanentDelete}
                        className="w-full h-12 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.2)] animate-pulse"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
                        Confirm Destruction
                    </button>
                )}

                {confirmDelete && !loading && (
                    <button
                        onClick={() => setConfirmDelete(false)}
                        className="w-full text-center text-[9px] text-zinc-600 uppercase tracking-widest hover:text-zinc-400 mt-1"
                    >
                        Abort Protocol
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <button
                onClick={() => setIsMoveOpen(true)}
                className="w-full h-12 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 border border-zinc-700/50"
            >
                <FolderInput size={16} /> Move Object
            </button>

            <button
                disabled={loading}
                onClick={handleTrash}
                className="w-full h-12 bg-black/40 hover:bg-red-950/20 hover:text-red-500 hover:border-red-900/30 text-zinc-500 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 border border-zinc-800 group"
            >
                {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <Trash2 size={16} className="group-hover:text-red-500" />
                )}
                Move to Trash
            </button>

            <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
                <DialogContent className="bg-[#0f0f13] border-zinc-800 text-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="text-sm uppercase tracking-widest font-bold">Relocate System Object</DialogTitle>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                            <Input
                                value={searchFolder}
                                onChange={(e) => setSearchFolder(e.target.value)}
                                className="bg-black/40 border-zinc-800 focus:border-orange-500 text-zinc-200 pl-9 text-xs"
                                placeholder="Search directories..."
                            />
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2 scrollbar-hide">
                            <button
                                onClick={() => handleMove(null)}
                                className="w-full text-left p-3 rounded-sm border border-transparent hover:border-orange-500/30 hover:bg-orange-500/5 transition-all group flex items-center justify-between"
                            >
                                <span className="text-xs font-bold text-zinc-400 group-hover:text-orange-500 uppercase tracking-widest">Root Directory</span>
                                <FolderInput size={14} className="text-zinc-600 group-hover:text-orange-500" />
                            </button>

                            {filteredFolders.map(folder => (
                                <button
                                    key={folder.id}
                                    onClick={() => handleMove(folder.id)}
                                    className="w-full text-left p-3 rounded-sm border border-transparent hover:border-orange-500/30 hover:bg-orange-500/5 transition-all group flex items-center justify-between"
                                >
                                    <span className="text-xs font-bold text-zinc-300 group-hover:text-orange-400 truncate uppercase">{folder.name}</span>
                                    <span className="text-[9px] text-zinc-600 group-hover:text-orange-500 uppercase tracking-tighter shrink-0">{folder.owner}</span>
                                </button>
                            ))}

                            {filteredFolders.length === 0 && !foldersLoading && (
                                <div className="py-8 text-center text-[10px] text-zinc-600 uppercase tracking-widest">No compatible directories found</div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsMoveOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-[10px] font-bold tracking-widest">CANCEL</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
