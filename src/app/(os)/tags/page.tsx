'use client';

import React, { useState } from 'react';
import {
    Tag,
    Plus,
    Search,
    MoreHorizontal,
    Edit2,
    Trash2,
    RotateCcw,
    Trash,
    ArrowLeft,
    Loader2,
    Hash,
    Palette,
    Check
} from 'lucide-react';
import Link from 'next/link';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '@/hooks/useFiles';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TagsPage() {
    const [view, setView] = useState<'ACTIVE' | 'DELETED'>('ACTIVE');
    const [search, setSearch] = useState('');

    const { data: tags = [], isLoading } = useTags(view);

    // Mutations
    const createMutation = useCreateTag();
    const updateMutation = useUpdateTag();
    const deleteMutation = useDeleteTag();

    // Dialog States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [tagName, setTagName] = useState('');
    const [tagColor, setTagColor] = useState('#F97316');
    const [selectedTag, setSelectedTag] = useState<any>(null);

    const filteredTags = tags.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = async () => {
        if (!tagName.trim()) return;
        await createMutation.mutateAsync({ name: tagName.trim(), color: tagColor });
        setIsCreateOpen(false);
        setTagName('');
        setTagColor('#F97316');
    };

    const handleUpdate = async () => {
        if (!selectedTag || !tagName.trim()) return;
        await updateMutation.mutateAsync({
            id: selectedTag.id,
            updates: { name: tagName.trim(), color: tagColor }
        });
        setIsEditOpen(false);
        setSelectedTag(null);
        setTagName('');
    };

    const handleDelete = async (tag: any, action: 'trash' | 'restore' | 'permanent') => {
        if (action === 'permanent' && !confirm(`Permanently delete tag "${tag.name}"? This will remove it from all files.`)) {
            return;
        }
        await deleteMutation.mutateAsync({ id: tag.id, action });
    };

    const colors = [
        '#F97316', // Orange
        '#EF4444', // Red
        '#EAB308', // Yellow
        '#22C55E', // Green
        '#3B82F6', // Blue
        '#A855F7', // Purple
        '#EC4899', // Pink
        '#71717A', // Zinc
    ];

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
            {/* Header */}
            <div className="p-4 lg:p-6 pb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-zinc-800/30 bg-[#0f0f13]/20">
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="w-10 h-10 flex items-center justify-center rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all active:scale-90"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <Tag size={18} className="text-orange-500" />
                            Metadata Node Controller
                        </h1>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                            System Registry / Tag Management Protocol
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-black/40 p-1 rounded-sm border border-zinc-800/50 mr-2">
                        <button
                            onClick={() => setView('ACTIVE')}
                            className={cn(
                                "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all",
                                view === 'ACTIVE' ? "bg-zinc-800 text-orange-500" : "text-zinc-600 hover:text-zinc-400"
                            )}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setView('DELETED')}
                            className={cn(
                                "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all",
                                view === 'DELETED' ? "bg-zinc-800 text-orange-500" : "text-zinc-600 hover:text-zinc-400"
                            )}
                        >
                            Trashed
                        </button>
                    </div>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-orange-500 hover:bg-orange-400 text-black h-10 font-bold uppercase tracking-widest text-[10px]"
                    >
                        <Plus size={14} className="mr-2 stroke-[3]" /> Create Node
                    </Button>
                </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 lg:p-6 border-b border-zinc-800/30">
                <div className="relative w-full max-w-md group">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-orange-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search metadata nodes..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#15151a] border border-zinc-800 focus:border-orange-500/50 rounded-sm py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-24">
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4 py-20">
                        <Loader2 size={32} className="animate-spin text-orange-500/50" />
                        <p className="text-[10px] uppercase tracking-widest">Accessing Registry...</p>
                    </div>
                ) : filteredTags.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4 py-20 opacity-40">
                        <Hash size={48} />
                        <p className="text-sm uppercase tracking-[0.3em] font-bold">No Metadata Nodes Found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredTags.map((tag) => (
                            <div
                                key={tag.id}
                                className="bg-[#121216] border border-zinc-800/80 rounded-sm p-4 hover:border-zinc-500/40 transition-all group relative overflow-hidden"
                            >
                                {/* Color accent */}
                                <div
                                    className="absolute top-0 left-0 w-full h-[2px] opacity-60"
                                    style={{ backgroundColor: tag.color }}
                                />

                                <div className="flex justify-between items-start mb-4">
                                    <div
                                        className="w-8 h-8 rounded-sm flex items-center justify-center border border-zinc-800/50"
                                        style={{ backgroundColor: `${tag.color}10`, color: tag.color }}
                                    >
                                        <Hash size={16} />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="text-zinc-600 hover:text-white p-1">
                                                <MoreHorizontal size={16} />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-[#0f0f13] border-zinc-800 text-zinc-300">
                                            {view === 'ACTIVE' ? (
                                                <>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedTag(tag);
                                                            setTagName(tag.name);
                                                            setTagColor(tag.color);
                                                            setIsEditOpen(true);
                                                        }}
                                                        className="text-xs uppercase tracking-wider font-bold cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800"
                                                    >
                                                        <Edit2 size={14} className="mr-2" /> Rename
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(tag, 'trash')}
                                                        className="text-xs uppercase tracking-wider font-bold text-orange-600 cursor-pointer hover:bg-orange-500/10 focus:bg-orange-500/10"
                                                    >
                                                        <Trash2 size={14} className="mr-2" /> Move to Trash
                                                    </DropdownMenuItem>
                                                </>
                                            ) : (
                                                <>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(tag, 'restore')}
                                                        className="text-xs uppercase tracking-wider font-bold text-green-500 cursor-pointer hover:bg-green-500/10 focus:bg-green-500/10"
                                                    >
                                                        <RotateCcw size={14} className="mr-2" /> Restore Node
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDelete(tag, 'permanent')}
                                                        className="text-xs uppercase tracking-wider font-bold text-red-500 cursor-pointer hover:bg-red-500/10 focus:bg-red-500/10"
                                                    >
                                                        <Trash size={14} className="mr-2" /> Delete Forever
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <h3 className="font-bold text-zinc-100 uppercase tracking-wide truncate mb-1">
                                    {tag.name}
                                </h3>

                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] text-zinc-600 uppercase font-black tracking-tighter">Usage Index</span>
                                        <span className="text-xs font-mono font-bold text-orange-500/80">{tag.usageCount || 0}</span>
                                    </div>
                                    <div className="text-[9px] text-zinc-600 uppercase font-black text-right">
                                        Status: <span className={cn(tag.status === 'ACTIVE' ? "text-green-500/50" : "text-orange-500/50")}>{tag.status}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Tag Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="bg-[#0f0f13] border-zinc-800 text-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="text-sm uppercase tracking-widest font-bold">Initialize Metadata Node</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Node Designation</label>
                            <Input
                                value={tagName}
                                onChange={(e) => setTagName(e.target.value)}
                                className="bg-black/40 border-zinc-800 focus:border-orange-500 text-zinc-200"
                                placeholder="NODE_NAME"
                                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Palette size={12} /> Visual Signature
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {colors.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setTagColor(color)}
                                        className={cn(
                                            "w-8 h-8 rounded-sm border-2 transition-all flex items-center justify-center",
                                            tagColor === color ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                                        )}
                                        style={{ backgroundColor: color }}
                                    >
                                        {tagColor === color && <Check size={14} className="text-white drop-shadow-md" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="text-zinc-500 hover:text-zinc-300">CANCEL</Button>
                        <Button onClick={handleCreate} className="bg-orange-500 hover:bg-orange-400 text-black font-bold uppercase tracking-widest text-[10px]">REGISTER NODE</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Tag Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="bg-[#0f0f13] border-zinc-800 text-zinc-200">
                    <DialogHeader>
                        <DialogTitle className="text-sm uppercase tracking-widest font-bold">Modify Metadata Node</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">New Designation</label>
                            <Input
                                value={tagName}
                                onChange={(e) => setTagName(e.target.value)}
                                className="bg-black/40 border-zinc-800 focus:border-orange-500 text-zinc-200"
                                placeholder="NODE_NAME"
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Palette size={12} /> Visual Signature
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {colors.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setTagColor(color)}
                                        className={cn(
                                            "w-8 h-8 rounded-sm border-2 transition-all flex items-center justify-center",
                                            tagColor === color ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                                        )}
                                        style={{ backgroundColor: color }}
                                    >
                                        {tagColor === color && <Check size={14} className="text-white drop-shadow-md" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => { setIsEditOpen(false); setSelectedTag(null); }} className="text-zinc-500 hover:text-zinc-300">CANCEL</Button>
                        <Button onClick={handleUpdate} className="bg-orange-500 hover:bg-orange-400 text-black font-bold uppercase tracking-widest text-[10px]">UPDATE REGISTRY</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
