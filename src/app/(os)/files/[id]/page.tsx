export const dynamic = 'force-dynamic';

import React from 'react';
import {
    Film,
    FolderLock,
    Database,
    Download,
    HardDrive,
    ArrowRight,
    ArrowLeft,
    Zap,
    ChevronLeft
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { ProxyPlayer } from '@/components/phaethon/ProxyPlayer';
import { FileActions } from '@/components/phaethon/FileActions';
import { CopyUuidButton } from '@/components/phaethon/CopyUuidButton';
import { TagManager } from '@/components/phaethon/TagManager';
import { getFileById, getMediaUrl, getDownloadUrl, getNavigationIds } from '@/lib/actions';

/**
 * Formats bytes into human-readable display string.
 */
function formatSize(bytes: number): string {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
}

export default async function FileDetailsPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ view?: string; tagId?: string }>
}) {
    const { id } = await params;
    const { view, tagId } = await searchParams;
    const file = await getFileById(id);

    if (!file) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-6">
                <img src="/eous-dead.webp" alt="Eous Dead" className="w-24 h-24 object-contain opacity-50 grayscale" />
                <div className="text-center">
                    <p className="uppercase tracking-[0.3em] font-bold text-zinc-400">Object Not Found</p>
                    <p className="text-[10px] uppercase tracking-widest mt-1 text-zinc-600">Eous could not locate requested hash</p>
                </div>
                <Link href="/" className="text-xs text-orange-500 hover:underline flex items-center gap-2">
                    <ArrowLeft size={14} /> Return to Dashboard
                </Link>
            </div>
        );
    }

    const isImage = file.mimeType.startsWith('image/');
    const isVideo = file.mimeType.startsWith('video/') || (file.category === 'MEDIA' && !isImage);
    const isAudio = file.mimeType.startsWith('audio/') || file.category === 'AUDIO';
    const isMedia = isVideo || isAudio;

    const navView = (view === 'trash' || view === 'tag') ? view as any : 'active';
    const { prevId, nextId } = await getNavigationIds(file.id, navView, tagId);

    // Helper to preserve context in links
    const getNavUrl = (targetId: string) => {
        const query = new URLSearchParams();
        if (view) query.set('view', view);
        if (tagId) query.set('tagId', tagId);
        const qs = query.toString();
        return `/files/${targetId}${qs ? `?${qs}` : ''}`;
    };

    const mediaUrl = (isMedia || isImage) ? await getMediaUrl(file.id) : undefined;
    const downloadUrl = await getDownloadUrl(file.id, file.name);
    const sizeDisplay = formatSize(file.sizeBytes);

    const getFileIcon = () => {
        if (file.category === 'MEDIA' || file.mimeType.startsWith('video/')) return <Film size={32} className="sm:w-10 sm:h-10" />;
        if (file.category === 'ENCRYPTED') return <FolderLock size={32} className="sm:w-10 sm:h-10" />;
        if (file.category === 'AUDIO' || file.mimeType.startsWith('audio/')) return <Zap size={32} className="sm:w-10 sm:h-10" />;
        if (isImage) return <Database size={32} className="sm:w-10 sm:h-10" />; // Fallback icon for now
        return <Database size={32} className="sm:w-10 sm:h-10" />;
    };

    const getOwnerStyle = () => {
        if (file.owner === 'Wise') return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
        if (file.owner === 'Belle') return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400';
        return 'border-orange-500/30 bg-orange-500/10 text-orange-400';
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-500">
            {/* Header */}
            <div className="p-4 lg:p-6 pb-2 border-b border-zinc-800/50 bg-[#0f0f13]/40 flex items-center gap-4">
                <Link
                    href="/"
                    className="w-10 h-10 flex items-center justify-center rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all active:scale-90"
                >
                    <ArrowLeft size={18} />
                </Link>
                <div className="min-w-0 flex-1">
                    <h1 className="text-lg font-bold text-white uppercase tracking-wider truncate">{file.name}</h1>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold truncate">
                        Phaethon Directory / Object ID: {file.id.substring(0, 8)}...
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto w-full">
                    {/* Video Player - Only for MEDIA / video files */}
                    {isVideo && (
                        <div className="w-full border-b border-zinc-800">
                            <ProxyPlayer
                                src={mediaUrl}
                                poster={file.thumbnailId ? `/api/media/${file.thumbnailId}` : undefined}
                                title={file.name}
                                type={file.mimeType}
                            />
                        </div>
                    )}

                    {/* Image Viewer */}
                    {isImage && mediaUrl && (
                        <div className="w-full border-b border-zinc-800 bg-black relative group overflow-hidden flex items-center justify-center min-h-[400px]">
                            {/* HUD: Metadata Overlay */}
                            <div className="absolute inset-x-0 top-0 z-20 pointer-events-none p-4 flex justify-between">
                                <div className="text-[10px] font-bold text-zinc-500 font-mono tracking-widest">
                                    IMG_ARCHIVE_INSPECTOR.SYS
                                </div>
                                <div className="text-[10px] font-bold text-orange-500/80 font-mono tracking-widest uppercase">
                                    {file.name.split('.').pop()}_STREAM
                                </div>
                            </div>

                            {/* Navigation Overlays */}
                            <div className="absolute inset-y-0 left-0 z-30 flex items-center px-4">
                                {prevId && (
                                    <Link
                                        href={getNavUrl(prevId)}
                                        className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 border border-white/10 text-white/40 hover:text-white hover:bg-black/60 hover:scale-110 transition-all backdrop-blur-md"
                                        title="Previous Slide"
                                    >
                                        <ChevronLeft size={24} />
                                    </Link>
                                )}
                            </div>
                            <div className="absolute inset-y-0 right-0 z-30 flex items-center px-4">
                                {nextId && (
                                    <Link
                                        href={getNavUrl(nextId)}
                                        className="w-12 h-12 flex items-center justify-center rounded-full bg-black/40 border border-white/10 text-white/40 hover:text-white hover:bg-black/60 hover:scale-110 transition-all backdrop-blur-md"
                                        title="Next Slide"
                                    >
                                        <ArrowRight size={24} />
                                    </Link>
                                )}
                            </div>

                            <img
                                src={mediaUrl}
                                alt={file.name}
                                className="max-w-full max-h-[80vh] object-contain relative z-10 p-4"
                            />

                            {/* VHS Effects */}
                            <div className="vhs-scanlines pointer-events-none" />
                            <div className="vhs-crt-curvature pointer-events-none" />
                            <div className="vhs-noise pointer-events-none opacity-20" />
                        </div>
                    )}

                    {/* Navigation Bar for Video/Audio */}
                    {isMedia && (prevId || nextId) && (
                        <div className="flex items-center justify-between p-4 bg-black border-b border-zinc-800/50">
                            {prevId ? (
                                <Link
                                    href={getNavUrl(prevId)}
                                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-orange-500 transition-colors"
                                >
                                    <ChevronLeft size={16} /> Previous Protocol
                                </Link>
                            ) : <div />}

                            <div className="text-[9px] font-bold text-zinc-700 tracking-[0.4em] uppercase">Folder Stream</div>

                            {nextId ? (
                                <Link
                                    href={getNavUrl(nextId)}
                                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-orange-500 transition-colors"
                                >
                                    Next Protocol <ArrowRight size={16} />
                                </Link>
                            ) : <div />}
                        </div>
                    )}

                    {/* File Hero Section */}
                    <div className="p-4 sm:p-8 bg-[#0c0c10] flex items-center border-b border-zinc-800/50 relative overflow-hidden">
                        {/* Subtle background accent */}
                        <div className={`absolute inset-0 opacity-5 ${file.owner === 'Wise' ? 'bg-blue-500' : file.owner === 'Belle' ? 'bg-yellow-500' : 'bg-orange-500'}`} style={{ maskImage: 'linear-gradient(to right, black, transparent)' }} />

                        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-sm border flex items-center justify-center relative z-10 shrink-0 ${getOwnerStyle()}`}>
                            {getFileIcon()}
                        </div>
                        <div className="ml-4 sm:ml-8 min-w-0 relative z-10">
                            <div className="flex flex-wrap gap-2 sm:gap-4 mb-2">
                                <span className="px-2 py-0.5 bg-zinc-800 text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400 border border-zinc-700 whitespace-nowrap">
                                    {file.category} OBJECT
                                </span>
                                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-bold text-orange-500 flex items-center gap-2 whitespace-nowrap">
                                    <div className={`w-1.5 h-1.5 rounded-full ${file.status === 'ACTIVE' ? 'bg-orange-500 animate-pulse' : file.status === 'WARNING' ? 'bg-yellow-500 animate-pulse' : 'bg-zinc-500'}`} />
                                    {file.status}
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{file.name}</h2>
                        </div>
                    </div>

                    {/* Metadata + Actions */}
                    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-zinc-800/50">
                        {/* Metadata Panel */}
                        <div className="flex-1 p-6 sm:p-8 space-y-6 sm:space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                <div className="space-y-1.5">
                                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block">Owner Identity</span>
                                    <div className="flex items-center gap-3 text-xs font-bold text-zinc-300">
                                        <div className="relative w-6 h-6 rounded border border-zinc-800 overflow-hidden">
                                            <Image
                                                src={file.owner === 'Wise' ? '/wise.webp' : file.owner === 'Belle' ? '/belle.webp' : '/phaethon.webp'}
                                                alt={file.owner}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        {file.owner}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block">Data Volume</span>
                                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                                        <HardDrive size={16} className="text-zinc-500" /> {sizeDisplay}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block">MIME Type</span>
                                    <div className="text-xs font-mono text-zinc-400">{file.mimeType}</div>
                                </div>
                                <div className="space-y-1.5">
                                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block">Pinned</span>
                                    <div className="text-xs font-bold text-zinc-400">{file.isPinned ? 'Yes' : 'No'}</div>
                                </div>
                            </div>

                            {/* UUID Hash Block */}
                            <div className="p-4 sm:p-5 bg-black/40 border border-zinc-800/50 rounded-sm relative group overflow-hidden">
                                <CopyUuidButton uuid={file.id} />
                                <span className="text-[10px] font-bold text-orange-500/80 uppercase tracking-[0.3em] block mb-3">System Key Hash (UUID)</span>
                                <code className="text-[10px] sm:text-[11px] text-zinc-400 break-all leading-relaxed font-mono tracking-tighter uppercase pr-10">
                                    {file.id}
                                </code>
                            </div>

                            {/* Tags Section */}
                            <div className="space-y-4">
                                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block">Metadata Nodes (Tags)</span>
                                <TagManager fileId={file.id} initialTags={(file as any).tags || []} />
                            </div>
                        </div>

                        {/* Action Buttons Panel */}
                        <div className="w-full md:w-64 bg-black/10 p-6 sm:p-8 flex flex-col gap-3">
                            <a
                                href={downloadUrl}
                                download={file.name}
                                className="w-full h-12 bg-orange-500 hover:bg-orange-400 text-black text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_4px_20px_rgba(249,115,22,0.15)]"
                            >
                                <Download size={16} /> Download Data <ArrowRight size={16} strokeWidth={3} />
                            </a>

                            <div className="mt-4 pt-4 border-t border-zinc-900">
                                <FileActions fileId={file.id} status={file.status} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
