'use client';

import React from 'react';
import { Wifi, Menu, Lock, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarContent } from './SidebarContent';
import { useView } from '@/context/ViewContext';

interface NavigationProps {
    activeView: string;
    setActiveView: (view: any) => void;
    time: string;
}

export function Navigation({ activeView, setActiveView, time }: NavigationProps) {
    const tabs = ['all', 'wise', 'belle', 'phaethon', 'trash'];
    const { storage } = useView();
    const pathname = usePathname();
    const isDetailPage = pathname.includes('/files/');

    return (
        <header className="h-14 border-b border-zinc-800/80 bg-[#0f0f13]/90 backdrop-blur-md flex items-center justify-between px-4 z-20 relative">
            <div className="flex items-center gap-4 lg:gap-6">
                <div className="flex items-center gap-3">
                    {/* Mobile Menu Trigger */}
                    {!isDetailPage && (
                        <div className="lg:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <button className="p-2 text-zinc-400 hover:text-orange-500 transition-colors">
                                        <Menu size={20} />
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="left" className="bg-[#0a0a0c] border-zinc-800 p-0 w-72 flex flex-col">
                                    <SheetHeader className="p-5 border-b border-zinc-800/50">
                                        <SheetTitle className="text-zinc-500 text-[10px] tracking-[0.3em] uppercase font-mono text-left">System Navigation</SheetTitle>
                                    </SheetHeader>

                                    <SidebarContent showTabs={true} />
                                </SheetContent>
                            </Sheet>
                        </div>
                    )}

                    <Link
                        href="/"
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => setActiveView('all')}
                    >
                        <div className="relative w-8 h-8 bg-[#F97316] border border-zinc-700 flex items-center justify-center rounded-sm overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <img src="/zzz-logo.webp" alt="ZZZ" className="w-6 h-6 object-contain relative z-10" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-zinc-100 tracking-widest leading-none group-hover:text-orange-500 transition-colors">RANDOM_PLAY</span>
                            <span className="text-[9px] text-orange-500 font-bold tracking-[0.2em] mt-0.5">SYS.PHAETHON</span>
                        </div>
                    </Link>
                </div>

                {!isDetailPage && (
                    <nav className="hidden md:flex items-center gap-1 bg-zinc-900/50 p-1 rounded-sm border border-zinc-800">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveView(tab)}
                                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-all ${activeView === tab
                                    ? tab === 'phaethon' || tab === 'trash'
                                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                                        : 'bg-zinc-800 text-zinc-100'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                                    }`}
                            >
                                {tab === 'phaethon' && <Lock size={10} className="inline mr-1.5 -mt-0.5" />}
                                {tab === 'trash' && <Trash2 size={10} className="inline mr-1.5 -mt-0.5" />}
                                {tab}
                            </button>
                        ))}
                    </nav>
                )}
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden lg:flex items-center gap-3 text-xs text-zinc-500 border-r border-zinc-800 pr-4">
                    <Wifi size={14} className="text-orange-500/70" />
                    <span>INTER-KNOT SECURE</span>
                    <span className="text-zinc-400 ml-2">{time}</span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative w-8 h-8 rounded bg-blue-500/10 border border-blue-500/30 overflow-hidden cursor-pointer hover:border-blue-400/50 transition-colors">
                        <Image src="/wise.webp" alt="Wise" width={32} height={32} className="object-cover" />
                    </div>
                    <div className="relative w-8 h-8 rounded bg-yellow-500/10 border border-yellow-500/30 overflow-hidden cursor-pointer hover:border-yellow-400/50 transition-colors">
                        <Image src="/belle.webp" alt="Belle" width={32} height={32} className="object-cover" />
                    </div>
                </div>
            </div>
        </header>
    );
}
