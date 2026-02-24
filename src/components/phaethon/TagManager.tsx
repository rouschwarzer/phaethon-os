'use client';

import React, { useState } from 'react';
import { Tag, Plus, X, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { useAddTag, useRemoveTag, useTags } from '@/hooks/useFiles';
import { useView } from '@/context/ViewContext';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface TagManagerProps {
    fileId: string;
    initialTags: Array<{
        tag: {
            id: string;
            name: string;
            color: string;
        };
    }>;
}

export function TagManager({ fileId, initialTags }: TagManagerProps) {
    const [open, setOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const { setActiveView, setSelectedTagId } = useView();
    const router = useRouter();

    const addTagMutation = useAddTag();
    const removeTagMutation = useRemoveTag();
    const { data: allTags = [] } = useTags();

    const handleAddTag = async (tagName: string) => {
        if (!tagName.trim()) return;
        await addTagMutation.mutateAsync({ fileId, tagName: tagName.trim() });
        setOpen(false);
        setInputValue('');
    };

    const handleRemoveTag = async (e: React.MouseEvent, tagId: string) => {
        e.stopPropagation();
        await removeTagMutation.mutateAsync({ fileId, tagId });
    };

    const handleTagClick = (tagName: string, tagId: string) => {
        setSelectedTagId(tagId);
        setActiveView('tag');
        router.push(`/?q=${encodeURIComponent(tagName)}`);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                {initialTags.map((tagRel) => (
                    <button
                        key={tagRel.tag.id}
                        onClick={() => handleTagClick(tagRel.tag.name, tagRel.tag.id)}
                        className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-sm text-[10px] font-bold uppercase tracking-wider text-zinc-400 group hover:border-orange-500/50 hover:text-orange-400 transition-all"
                    >
                        <Tag size={10} className="text-zinc-600 group-hover:text-orange-500" />
                        {tagRel.tag.name}
                        <div
                            onClick={(e) => handleRemoveTag(e, tagRel.tag.id)}
                            className="ml-1 text-zinc-600 hover:text-red-500 transition-colors p-0.5"
                        >
                            <X size={10} />
                        </div>
                    </button>
                ))}
                {initialTags.length === 0 && (
                    <div className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                        No metadata nodes attached
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="flex-1 justify-between bg-black/40 border-zinc-800 hover:bg-black/60 hover:border-orange-500/50 text-[11px] font-mono tracking-tighter h-9 px-3"
                        >
                            <div className="flex items-center gap-2 text-zinc-500">
                                <Tag size={14} className="text-zinc-600" />
                                <span>{inputValue || "SELECT_OR_CREATE_NODE..."}</span>
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-[#0f0f13] border-zinc-800" align="start">
                        <Command className="bg-transparent">
                            <CommandInput
                                placeholder="Search metadata..."
                                value={inputValue}
                                onValueChange={setInputValue}
                                className="h-9 font-mono text-xs"
                            />
                            <CommandList className="max-h-[200px] custom-scrollbar">
                                <CommandEmpty>No metadata found.</CommandEmpty>
                                {inputValue && !allTags.some(tag => tag.name.toLowerCase() === inputValue.toLowerCase()) && (
                                    <CommandGroup heading="New Node">
                                        <CommandItem
                                            value={inputValue}
                                            onSelect={() => handleAddTag(inputValue)}
                                            className="text-xs font-mono uppercase tracking-wider py-2 cursor-pointer text-orange-400 aria-selected:bg-orange-500/10"
                                        >
                                            <Plus size={12} className="mr-2 outline-none" />
                                            Create "{inputValue}"
                                        </CommandItem>
                                    </CommandGroup>
                                )}
                                <CommandGroup heading="Existing Nodes">
                                    {allTags.map((tag) => (
                                        <CommandItem
                                            key={tag.id}
                                            value={tag.name}
                                            onSelect={(currentValue) => {
                                                handleAddTag(currentValue);
                                            }}
                                            className="text-xs font-mono uppercase tracking-wider py-2 cursor-pointer hover:bg-orange-500/10"
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-3 w-3",
                                                    initialTags.some(t => t.tag.id === tag.id) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {tag.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
}
