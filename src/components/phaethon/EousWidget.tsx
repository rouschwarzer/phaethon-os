'use client';

import React from 'react';
import { Cpu, Zap } from 'lucide-react';

interface EousWidgetProps {
    percentage: number;
}

export function EousWidget({ percentage }: EousWidgetProps) {
    return (
        <div className="p-5 border-b border-zinc-800/50">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-zinc-400 tracking-wider flex items-center gap-2">
                    <Cpu size={14} /> EOUS STORAGE INIT
                </span>
                <span className="w-2 h-2 rounded-full bg-orange-500/80"></span>
            </div>

            <div className="bg-[#15151a] border border-zinc-800 rounded-sm p-4 relative overflow-hidden group cursor-pointer hover:border-zinc-700 transition-colors">
                {/* Decorative scanline on hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent -translate-y-full group-hover:animate-[scan_2s_ease-in-out_infinite] pointer-events-none"></div>

                <div className="flex justify-between text-xs mb-2">
                    <span className="text-zinc-300">Ether Capacity</span>
                    <span className="text-orange-400 font-bold">{percentage.toFixed(1)}%</span>
                </div>

                {/* Segmented Progress Bar */}
                <div className="flex gap-1 h-2 w-full mb-3">
                    {[...Array(20)].map((_, i) => {
                        const threshold = (i / 20) * 100;
                        const isActive = percentage > threshold;
                        return (
                            <div
                                key={i}
                                className={`flex-1 rounded-sm transition-colors duration-500 ${isActive
                                    ? (threshold > 80 ? 'bg-orange-500/80 shadow-[0_0_5px_rgba(249,115,22,0.4)]' : 'bg-yellow-500/80 shadow-[0_0_5px_rgba(234,179,8,0.4)]')
                                    : 'bg-zinc-800'
                                    }`}
                            ></div>
                        );
                    })}
                </div>

                <div className="flex justify-between items-end">
                    <div className="text-[10px] text-zinc-500 leading-tight font-mono">
                        <p>SYS: OPTIMAL</p>
                        <p>TEMP: 32°C</p>
                    </div>
                    <Zap size={16} className="text-yellow-500/70" />
                </div>
            </div>

            <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
        </div>
    );
}
