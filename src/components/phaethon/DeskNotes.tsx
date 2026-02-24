'use client';

import React from 'react';
import { MessageSquare, ArrowRight } from 'lucide-react';

const stickyNotes = [
    { id: 1, author: 'Wise', text: "Belle, please stop putting your personal anime rips in the main Proxy encrypted folder.", bg: "bg-amber-100", pin: "bg-red-500", rotation: "-rotate-2" },
    { id: 2, author: 'Belle', text: "I ran out of space! Besides, Starlight Knight IS essential data. 😤", bg: "bg-orange-100", pin: "bg-blue-500", rotation: "rotate-3" },
    { id: 3, author: 'Wise', text: "Also, Eous needs a recharge, don't forget to plug him in.", bg: "bg-yellow-100", pin: "bg-red-500", rotation: "-rotate-1" },
    { id: 4, author: 'Belle', text: "LOOK AT HIM. HE'S SO RELAXED. I caught him sleeping when he was supposed to be indexing logs. 😂", bg: "bg-orange-100", pin: "bg-red-500", rotation: "-rotate-2" },
    { id: 5, author: 'Wise', text: "Belle, the photo is cute, but we're still missing the Hollow Zero data indices. Focus!", bg: "bg-amber-100", pin: "bg-blue-500", rotation: "rotate-3" },
    { id: 6, author: 'Belle', text: "Wise, don't be such a buzzkill. Even legendary Bangboos need power naps! 🔋💤", bg: "bg-yellow-100", pin: "bg-red-500", rotation: "-rotate-1" },
    { id: 7, author: 'Belle', text: "Wise, I found a hidden VHS labeled 'TOP_SECRET_RESEARCH'. Why is it locked with a Level 5 Proxy Key? Suspicious... 🤨", bg: "bg-orange-100", pin: "bg-blue-500", rotation: "rotate-2" },
    { id: 8, author: 'Wise', text: "It's just a corrupted file from the Hollow! The headers are smashed, it's essentially garbage data. Stop trying to 'restore' it.", bg: "bg-amber-100", pin: "bg-red-500", rotation: "-rotate-3" }
];

export function DeskNotes() {
    return (
        <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-zinc-800/80 bg-[#161414] relative flex flex-col z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
            {/* Subtle noise texture */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

            <div className="p-5 border-b border-zinc-800/50 bg-[#1a1818] flex justify-between items-center relative z-10">
                <h3 className="font-bold text-zinc-200 flex items-center gap-2 text-sm tracking-wide">
                    <MessageSquare size={16} className="text-zinc-500" /> Desk Notes
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono">PHYSICAL_LAYER</span>
            </div>

            <div className="flex-1 p-5 overflow-y-auto overscroll-contain space-y-5 relative z-10 pb-10">
                {/* Topic 1: Storage */}
                <div className="flex items-center gap-4 py-2 opacity-40">
                    <div className="h-[1px] flex-1 bg-zinc-700"></div>
                    <span className="text-[10px] font-bold tracking-[0.3em] text-zinc-400">FEB 18 / TUE</span>
                    <div className="h-[1px] flex-1 bg-zinc-700"></div>
                </div>

                {stickyNotes.slice(0, 3).map(note => (
                    <div
                        key={note.id}
                        className={`p-4 shadow-lg ${note.bg} ${note.rotation} transition-transform hover:rotate-0 hover:scale-[1.02] cursor-pointer relative group rounded-sm`}
                    >
                        <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full ${note.pin} shadow-md border border-black/20 z-10`}>
                            <div className="absolute top-[2px] left-[2px] w-1 h-1 rounded-full bg-white/40"></div>
                        </div>
                        <p className="text-zinc-900 font-medium text-sm leading-relaxed mt-1" style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', sans-serif" }}>
                            {note.text}
                        </p>
                        <div className="flex justify-end mt-3 border-t border-black/10 pt-2">
                            <p className="text-xs font-bold text-black/60 uppercase tracking-widest">
                                - {note.author}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Topic 2: Eous Photo */}
                <div className="flex items-center gap-4 py-2 opacity-40">
                    <div className="h-[1px] flex-1 bg-zinc-700"></div>
                    <span className="text-[10px] font-bold tracking-[0.3em] text-zinc-400">FEB 19 / WED</span>
                    <div className="h-[1px] flex-1 bg-zinc-700"></div>
                </div>

                <div className="p-2 shadow-lg bg-zinc-100 rotate-2 transition-transform hover:rotate-0 hover:scale-[1.02] cursor-pointer relative group rounded-sm border-2 border-zinc-200">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-md border border-black/20 z-10">
                        <div className="absolute top-[2px] left-[2px] w-1 h-1 rounded-full bg-white/40"></div>
                    </div>
                    <div className="bg-white p-1 shadow-inner border border-zinc-200 aspect-square flex flex-col items-center justify-center overflow-hidden">
                        <img src="/eous-relaxed.webp" alt="Eous Relaxed" className="w-full h-full object-contain" />
                    </div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2 text-center opacity-70">SUBJECT: EOUS_RELAXED</p>
                </div>

                {stickyNotes.slice(3, 6).map(note => (
                    <div
                        key={note.id}
                        className={`p-4 shadow-lg ${note.bg} ${note.rotation} transition-transform hover:rotate-0 hover:scale-[1.02] cursor-pointer relative group rounded-sm`}
                    >
                        <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full ${note.pin} shadow-md border border-black/20 z-10`}>
                            <div className="absolute top-[2px] left-[2px] w-1 h-1 rounded-full bg-white/40"></div>
                        </div>
                        <p className="text-zinc-900 font-medium text-sm leading-relaxed mt-1" style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', sans-serif" }}>
                            {note.text}
                        </p>
                        <div className="flex justify-end mt-3 border-t border-black/10 pt-2">
                            <p className="text-xs font-bold text-black/60 uppercase tracking-widest">
                                - {note.author}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Topic 3: Mysterious VHS */}
                <div className="flex items-center gap-4 py-2 opacity-40">
                    <div className="h-[1px] flex-1 bg-zinc-700"></div>
                    <span className="text-[10px] font-bold tracking-[0.3em] text-zinc-400">FEB 20 / THU</span>
                    <div className="h-[1px] flex-1 bg-zinc-700"></div>
                </div>

                {stickyNotes.slice(6).map(note => (
                    <div
                        key={note.id}
                        className={`p-4 shadow-lg ${note.bg} ${note.rotation} transition-transform hover:rotate-0 hover:scale-[1.02] cursor-pointer relative group rounded-sm`}
                    >
                        <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full ${note.pin} shadow-md border border-black/20 z-10`}>
                            <div className="absolute top-[2px] left-[2px] w-1 h-1 rounded-full bg-white/40"></div>
                        </div>
                        <p className="text-zinc-900 font-medium text-sm leading-relaxed mt-1" style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', sans-serif" }}>
                            {note.text}
                        </p>
                        <div className="flex justify-end mt-3 border-t border-black/10 pt-2">
                            <p className="text-xs font-bold text-black/60 uppercase tracking-widest">
                                - {note.author}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

        </aside>
    );
}
