'use client';

import React from 'react';
import { Navigation } from '@/components/phaethon/Navigation';
import { SidebarContent } from '@/components/phaethon/SidebarContent';
import { DeskNotes } from '@/components/phaethon/DeskNotes';
import { ViewProvider, useView } from '@/context/ViewContext';

function OSLayoutContent({ children }: { children: React.ReactNode }) {
    const { activeView, setActiveView, time } = useView();

    return (
        <div className="h-screen bg-[#0a0a0c] text-zinc-300 font-mono flex flex-col relative overflow-hidden selection:bg-orange-500/30 selection:text-orange-200">
            {/* SYSTEM BACKGROUND GRID */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
            </div>

            <Navigation activeView={activeView} setActiveView={setActiveView} time={time} />

            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10 transition-all duration-500">
                {/* LEFT PANEL - Hidden on mobile, shown on LG */}
                <aside className="hidden lg:flex w-72 border-r border-zinc-800/80 bg-[#0f0f13]/50 flex-col flex-shrink-0">
                    <SidebarContent />
                </aside>

                {/* CENTER PANEL (DYNAMIC) */}
                <main className="flex-1 flex flex-col bg-[#0a0a0c] relative overflow-hidden min-w-0">
                    {children}
                </main>

                {/* RIGHT PANEL - Hidden on mobile, shown on LG */}
                <div className="hidden lg:block">
                    <DeskNotes />
                </div>
            </div>
        </div>
    );
}

export default function OSLayout({ children }: { children: React.ReactNode }) {
    return (
        <ViewProvider>
            <OSLayoutContent>{children}</OSLayoutContent>
        </ViewProvider>
    );
}
