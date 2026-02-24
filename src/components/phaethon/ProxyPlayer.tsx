'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    MediaPlayer,
    MediaProvider,
    Poster,
} from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';

import 'vidstack/player/styles/default/theme.css';
import 'vidstack/player/styles/default/layouts/video.css';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

interface ProxyPlayerProps {
    /** R2 stream URL for the media file. */
    src?: string;
    /** Optional poster image URL. */
    poster?: string;
    /** Display title for HUD overlay. */
    title?: string;
    /** MIME type for provider selection. */
    type?: string;
}

/**
 * ProxyPlayer: VHS-styled video player using Vidstack's Default Layout.
 * Combines robust modern controls with a retro CRT/HUD overlay.
 */
export function ProxyPlayer({ src, poster, title, type }: ProxyPlayerProps) {
    const [timestamp, setTimestamp] = useState('00:00:00:00');

    useEffect(() => {
        const interval = setInterval(() => {
            const d = new Date();
            setTimestamp(
                `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}:${Math.floor(d.getMilliseconds() / 40).toString().padStart(2, '0')}`
            );
        }, 40);
        return () => clearInterval(interval);
    }, []);

    if (!src) {
        return (
            <div className="proxy-player-container relative w-full aspect-video bg-black overflow-hidden">
                {/* HUD: No signal */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div className="vhs-no-signal-grid" />
                    <div className="flex flex-col items-center gap-4 relative z-20">
                        <div className="w-16 h-12 border border-zinc-700/50 flex flex-col items-center justify-center gap-1.5">
                            <div className="w-10 h-0.5 bg-zinc-800"></div>
                            <div className="w-10 h-0.5 bg-zinc-800"></div>
                            <div className="w-10 h-0.5 bg-zinc-700/80"></div>
                        </div>
                        <div className="text-center space-y-1.5">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.4em] font-bold vhs-text-glitch">
                                Signal Lost
                            </p>
                            <p className="text-[8px] text-zinc-700 uppercase tracking-wider">
                                Awaiting R2_Presigned_Uplink
                            </p>
                        </div>
                    </div>
                </div>

                {/* Scanlines + CRT */}
                <div className="vhs-scanlines" />
                <div className="vhs-crt-curvature" />
            </div>
        );
    }

    return (
        <div className="proxy-player-container relative w-full aspect-video bg-black overflow-hidden group">
            {/* ---- VIDSTACK PLAYER ---- */}
            <MediaPlayer
                title={title || ''}
                src={{ src: src || '', type: type as any || 'video/mp4' }}
                className="vhs-media-player w-full h-full relative"
                crossOrigin="anonymous"
                playsInline
            >
                <MediaProvider>
                    <Poster
                        src={poster}
                        alt={title}
                        className="vhs-poster absolute inset-0 w-full h-full object-cover opacity-0 data-[visible]:opacity-100 transition-opacity"
                    />
                </MediaProvider>

                {/* Standard robust controls */}
                <DefaultVideoLayout icons={defaultLayoutIcons} />

                {/* ---- PHAETHON VHS HUD OVERLAY (Visual only) ---- */}
                <div className="absolute inset-x-0 top-0 z-10 pointer-events-none p-3 sm:p-4 flex items-start justify-between opacity-0 group-hover:opacity-100 media-paused:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-bold text-red-500/90 tracking-widest">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_6px_rgba(220,38,38,0.5)]" />
                        REC
                        <span className="text-zinc-600 ml-1">|</span>
                        <span className="text-orange-500/70 font-mono">ARCHIVE_SRC.VHS</span>
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-bold text-zinc-600 tracking-widest font-mono leading-none">
                        {timestamp}
                    </div>
                </div>

                <div className="absolute inset-x-0 bottom-20 z-10 pointer-events-none px-3 sm:px-4 pb-1 flex items-end justify-between opacity-0 group-hover:opacity-100 media-paused:opacity-100 transition-opacity duration-300">
                    <div className="text-[9px] sm:text-[10px] font-bold text-zinc-500/80 tracking-widest font-mono truncate max-w-[60%]">
                        {title || 'UNNAMED_ARCHIVE'}
                    </div>
                    <div className="text-[9px] sm:text-[10px] font-bold text-zinc-600/60 tracking-widest font-mono">
                        PHAETHON_OS_SIGHT
                    </div>
                </div>
            </MediaPlayer>

            {/* ---- CRT EFFECTS ---- */}
            <div className="vhs-scanlines z-20 pointer-events-none" />
            <div className="vhs-crt-curvature z-20 pointer-events-none" />
            <div className="vhs-noise z-10 pointer-events-none opacity-[0.03]" />
        </div>
    );
}
