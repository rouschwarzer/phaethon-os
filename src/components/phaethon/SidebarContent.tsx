'use client';

import React from 'react';
import { Database, Film, FolderLock, Terminal as TerminalIcon, Tag, Lock, Trash2, Cpu, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useView } from '@/context/ViewContext';
import { useTags } from '@/hooks/useFiles';
import { EousWidget } from './EousWidget';
import { Terminal } from './Terminal';

interface SidebarContentProps {
    showTabs?: boolean;
    onClose?: () => void;
}

export function SidebarContent({ showTabs = false, onClose }: SidebarContentProps) {
    const { activeView, setActiveView, selectedTagId, setSelectedTagId, storage, time } = useView();
    const { data: tags = [] } = useTags();
    const router = useRouter();
    const tabs = ['all', 'wise', 'belle', 'phaethon', 'trash'];

    const handleTabClick = (tab: string) => {
        setActiveView(tab);
        if (onClose) onClose();
    };

    const handleTagClick = (tagId: string | 'untagged', tagName?: string) => {
        if (selectedTagId === tagId) {
            setSelectedTagId(null);
            setActiveView('all');
            router.push('/');
        } else {
            setSelectedTagId(tagId);
            setActiveView('tag');
            router.push(tagId === 'untagged' ? '/?q=untagged' : `/?q=${encodeURIComponent(tagName || '')}`);
        }
        if (onClose) onClose();
    };

    return (
        <div className="flex flex-col h-full bg-[#0f0f13]/50">
            <EousWidget percentage={storage.Percentage} />

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                {/* Data Source Tabs - Primarily for Mobile Sidebar sync */}
                {showTabs && (
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase mb-3 block px-2">Data Source</span>
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold uppercase tracking-widest rounded-sm transition-all ${activeView === tab
                                    ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
                                    }`}
                            >
                                <span className="flex items-center">
                                    {tab === 'phaethon' && <Lock size={12} className="mr-2" />}
                                    {tab === 'trash' && <Trash2 size={12} className="mr-2" />}
                                    {tab}
                                </span>
                                {activeView === tab && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />}
                            </button>
                        ))}
                    </div>
                )}

                {/* Data Categories */}
                <div>
                    <span className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase mb-3 block px-2">Data Categories</span>
                    <div className="space-y-1">
                        {[
                            { label: 'Recent Hollow Data', icon: Database, color: 'text-orange-400' },
                            { label: 'Video Archives (VHS)', icon: Film, color: 'text-yellow-400' },
                            { label: 'Proxy Encrypted', icon: FolderLock, color: 'text-purple-400' },
                            { label: 'System Logs', icon: TerminalIcon, color: 'text-zinc-400' }
                        ].map((item, idx) => (
                            <button key={idx} className="w-full flex items-center gap-3 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 rounded-sm transition-colors group">
                                <item.icon size={14} className={`${item.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                                <span className="truncate">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Metadata Nodes (Tags) */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase block">Metadata Nodes</span>
                        <div className="flex items-center gap-2">
                            <Link href="/tags" onClick={() => onClose?.()} className="p-1 text-zinc-600 hover:text-orange-500 transition-colors" title="Manage Metadata Nodes">
                                <Tag size={12} />
                            </Link>
                            <span className="text-[9px] font-bold text-zinc-700 tabular-nums">{tags.length} TOTAL</span>
                        </div>
                    </div>

                    {tags.length > 0 ? (
                        <>
                            <div className="relative group px-2">
                                <input
                                    type="text"
                                    placeholder="SEARCH_NODES..."
                                    className="w-full bg-black/40 border border-zinc-800 rounded-sm py-1.5 px-3 text-[10px] font-mono tracking-tighter text-zinc-400 focus:border-orange-500/50 outline-none transition-all"
                                    onChange={(e) => {
                                        const val = e.target.value.toLowerCase();
                                        const buttons = document.querySelectorAll('[data-tag-name-sidebar]');
                                        buttons.forEach((btn: any) => {
                                            const name = btn.getAttribute('data-tag-name-sidebar').toLowerCase();
                                            if (name.includes(val) || val === '') {
                                                btn.style.display = 'flex';
                                            } else {
                                                btn.style.display = 'none';
                                            }
                                        });
                                    }}
                                />
                            </div>

                            <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto custom-scrollbar pr-2 px-2">
                                <button
                                    onClick={() => handleTagClick('untagged')}
                                    data-tag-name-sidebar="untagged"
                                    className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest border transition-all rounded-sm flex items-center gap-1.5 ${selectedTagId === 'untagged'
                                        ? 'bg-zinc-100/10 border-zinc-100/50 text-zinc-100 shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                                        }`}
                                >
                                    <Tag size={10} className={selectedTagId === 'untagged' ? 'text-zinc-100' : 'text-zinc-600'} />
                                    Untagged
                                </button>
                                {tags.map((tag: any) => (
                                    <button
                                        key={tag.id}
                                        data-tag-name-sidebar={tag.name}
                                        onClick={() => handleTagClick(tag.id, tag.name)}
                                        className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest border transition-all rounded-sm flex items-center gap-1.5 ${selectedTagId === tag.id
                                            ? 'bg-orange-500/10 border-orange-500/50 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.1)]'
                                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                                            }`}
                                    >
                                        <Tag size={10} className={selectedTagId === tag.id ? 'text-orange-500' : 'text-zinc-600'} />
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-[9px] text-zinc-700 italic px-3 font-bold">Registry currently empty.</div>
                    )}
                </div>
            </div>

            {/* Mobile-only System Info (from Navigation.tsx) - shown if Terminal is not visible or just always for mobile */}
            {showTabs && (
                <div className="p-4 bg-zinc-900/40 border-t border-zinc-800/80">
                    <div className="px-3 py-3 bg-black/40 rounded-sm border border-zinc-800/50 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-zinc-600 tracking-widest uppercase">Network</span>
                            <span className="text-orange-500">CONNECTED</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-zinc-600 tracking-widest uppercase">System</span>
                            <span className="text-zinc-400">PHAETHON.OS</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] pt-1">
                            <span className="text-zinc-600 font-mono italic">v2.0.4 - SECURE</span>
                            <span className="text-zinc-500 font-mono">{time}</span>
                        </div>
                    </div>
                </div>
            )}

            {!showTabs && <Terminal />}
        </div>
    );
}
