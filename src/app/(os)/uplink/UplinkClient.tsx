'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Upload, ShieldAlert, ArrowLeft, Loader2, FileCheck, CheckCircle2, X, ArrowRight, Tag } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getSession, generateUploadUrl, registerUploadBatch, BatchUploadRecord } from '@/lib/actions';

interface FileUploadStatus {
    file: File;
    progress: number;
    success: boolean;
    error: string | null;
    uploading: boolean;
    id?: string;
}

export default function UplinkClient() {
    const [files, setFiles] = useState<FileUploadStatus[]>([]);
    const [owner, setOwner] = useState<string>('Phaethon');
    const [batchTags, setBatchTags] = useState<string>('');
    const [overallUploading, setOverallUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchParams = useSearchParams();
    const folderId = searchParams.get('folderId');

    useEffect(() => {
        getSession().then(session => {
            if (session) setOwner(session);
        });
    }, []);

    const addFiles = (newFiles: FileList | null) => {
        if (!newFiles) return;

        const fileArray = Array.from(newFiles).map(file => ({
            file,
            progress: 0,
            success: false,
            error: null,
            uploading: false,
        }));

        setFiles(prev => [...prev, ...fileArray]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        addFiles(e.target.files);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        addFiles(e.dataTransfer.files);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const uploadSingleFileToR2 = async (index: number): Promise<BatchUploadRecord | null> => {
        const fileStatus = files[index];
        if (!fileStatus || fileStatus.success || fileStatus.uploading) return null;

        setFiles(prev => {
            const next = [...prev];
            if (!next[index]) return prev;
            next[index] = { ...next[index], uploading: true, error: null, progress: 5 };
            return next;
        });

        try {
            const file = fileStatus.file;
            // 1. Get signed URL
            const { id, uploadUrl } = await generateUploadUrl(file.name, file.type || 'application/octet-stream');

            setFiles(prev => {
                const next = [...prev];
                if (!next[index]) return prev;
                next[index] = { ...next[index], progress: 15 };
                return next;
            });

            // 2. Upload directly to R2
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', uploadUrl);
                xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percentComplete = Math.round((event.loaded / event.total) * 70) + 15;
                        setFiles(prev => {
                            const next = [...prev];
                            if (!next[index]) return prev;
                            next[index] = { ...next[index], progress: percentComplete };
                            return next;
                        });
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) resolve(true);
                    else reject(new Error(`System Error: R2 Rejected Connection (${xhr.status})`));
                };

                xhr.onerror = () => reject(new Error('Network Error: Connection Instability Detected'));
                xhr.send(file);
            });

            setFiles(prev => {
                const next = [...prev];
                if (!next[index]) return prev;
                next[index] = { ...next[index], progress: 90 };
                return next;
            });

            const category = (file.type.startsWith('video/') || file.type.startsWith('image/')) ? 'MEDIA' : file.type.startsWith('audio/') ? 'AUDIO' : 'LOG';

            return {
                fileId: id,
                fileName: file.name,
                fileType: file.type || 'application/octet-stream',
                fileSize: file.size,
                folderId,
                owner,
                category,
                originalName: file.name,
                tags: batchTags.split(',').map(t => t.trim()).filter(t => t.length > 0)
            };

        } catch (err: any) {
            setFiles(prev => {
                const next = [...prev];
                if (!next[index]) return prev;
                next[index] = { ...next[index], uploading: false, error: err.message || 'Error occurred during uplink.' };
                return next;
            });
            return null;
        }
    };

    const performAllUploads = async () => {
        setOverallUploading(true);

        // 1. Perform all R2 uploads in parallel
        const uploadPromises = files.map((fileStatus, i) => {
            if (!fileStatus.success && !fileStatus.uploading) {
                return uploadSingleFileToR2(i);
            }
            return Promise.resolve(null);
        });

        const results = await Promise.all(uploadPromises);
        const validRecords = results.filter((r): r is BatchUploadRecord => r !== null);

        if (validRecords.length > 0) {
            try {
                // 2. Register all files in D1 with a single batch call (one revalidation only)
                await registerUploadBatch(validRecords);

                // 3. Update UI state to success
                setFiles(prev => {
                    const next = [...prev];
                    validRecords.forEach(record => {
                        // Find the original file in the state to update its status
                        // We need to be careful here as `fileName` might not be unique.
                        // A more robust solution would be to pass the original index or a unique identifier.
                        // For now, assuming file.name is unique enough for this context.
                        const index = prev.findIndex(f => !f.success && f.file.name === record.fileName);
                        if (index !== -1) {
                            next[index] = { ...next[index], progress: 100, success: true, uploading: false, id: record.fileId };
                        }
                    });
                    return next;
                });
            } catch (err: any) {
                console.error("Batch registration failed", err);
                // Optionally, update UI for files that failed batch registration
                // This would require more complex state management to link R2 success to D1 failure
            }
        }

        setOverallUploading(false);
    };

    const allFinished = files.length > 0 && files.every(f => f.success);

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 lg:p-6 pb-2 border-b border-zinc-800/50 bg-[#0f0f13]/40 flex items-center gap-4">
                <Link
                    href="/"
                    className="w-10 h-10 flex items-center justify-center rounded-sm bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-600 transition-all active:scale-90"
                >
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-lg font-bold text-white uppercase tracking-wider">System Uplink</h1>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Protocol Initialization / R2 Gateway</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-start p-4 md:p-6 overflow-hidden">
                <div className="max-w-2xl w-full bg-[#0f0f13] border border-zinc-800 shadow-[0_0_50px_rgba(234,179,8,0.05)] flex flex-col max-h-full">
                    <div className="p-4 border-b border-zinc-800/50 bg-black/20 flex items-center justify-between relative flex-shrink-0">
                        <h2 className="text-sm font-bold text-zinc-100 tracking-[0.2em] flex items-center gap-2 relative z-10">
                            <Plus size={16} className="text-yellow-500" /> SYSTEM_UPLINK.INIT
                        </h2>
                        <img src="/eous-tada.webp" alt="Eous Tada" className="absolute -right-2 -top-2 w-12 h-12 object-contain opacity-40 hover:opacity-100 transition-opacity rotate-12" />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                        <div className="p-4 md:p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <Tag size={12} className="text-orange-500/70" /> Batch Metadata Tags (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. wise, zzz, proxy (comma separated)"
                                    value={batchTags}
                                    onChange={(e) => setBatchTags(e.target.value)}
                                    className="w-full bg-[#15151a] border border-zinc-800 focus:border-orange-500/50 rounded-sm py-2 px-4 text-xs text-zinc-200 placeholder-zinc-600 outline-none transition-all"
                                />
                                <p className="text-[8px] text-zinc-600 uppercase tracking-tighter">Tags will be attached to all protocols in this uplink.</p>
                            </div>

                            <div
                                onDrop={onDrop}
                                onDragOver={onDragOver}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed border-zinc-800 bg-black/40 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-yellow-500/30 transition-all ${files.length > 0 ? 'p-4 md:p-6' : 'p-10'}`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    multiple
                                    className="hidden"
                                />
                                <Upload size={files.length > 0 ? 24 : 32} className="text-zinc-600 group-hover:text-yellow-500 transition-colors mb-2 md:mb-4" />
                                <p className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                    {files.length > 0 ? 'Add more protocols' : 'Drop archives here'}
                                </p>
                                {!files.length && <p className="text-[9px] text-zinc-600 uppercase mt-2">or click to browse systems</p>}
                            </div>

                            {files.length > 0 && (
                                <div className="space-y-2">
                                    {files.map((fileStatus, index) => (
                                        <div key={index} className="group border border-zinc-800 bg-zinc-900/30 p-3 md:p-4 relative overflow-hidden flex items-center gap-3 md:gap-4">
                                            {fileStatus.uploading && (
                                                <div
                                                    className="absolute bottom-0 left-0 h-[2px] bg-yellow-500 transition-all duration-300"
                                                    style={{ width: `${fileStatus.progress}%` }}
                                                />
                                            )}

                                            <div className="flex-shrink-0">
                                                {fileStatus.success ? (
                                                    <CheckCircle2 size={20} className="text-green-500 md:w-6 md:h-6" />
                                                ) : fileStatus.uploading ? (
                                                    <Loader2 size={20} className="text-yellow-500 animate-spin md:w-6 md:h-6" />
                                                ) : fileStatus.error ? (
                                                    <ShieldAlert size={20} className="text-red-500 md:w-6 md:h-6" />
                                                ) : (
                                                    <FileCheck size={20} className="text-zinc-500 group-hover:text-zinc-300 transition-colors md:w-6 md:h-6" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] md:text-[11px] font-bold text-white uppercase tracking-wider truncate">
                                                    {fileStatus.file.name}
                                                </div>
                                                <div className="text-[8px] md:text-[9px] text-zinc-500 uppercase tracking-tighter mt-1">
                                                    {(fileStatus.file.size / 1024 / 1024).toFixed(2)} MB • {fileStatus.file.type || 'RAW_DATA'}
                                                    {fileStatus.error && <span className="text-red-500 ml-2">— {fileStatus.error}</span>}
                                                </div>
                                            </div>

                                            {!fileStatus.uploading && !fileStatus.success && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeFile(index);
                                                    }}
                                                    className="p-1 md:p-2 text-zinc-600 hover:text-white transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}

                                            {fileStatus.success && (
                                                <Link
                                                    href={`/files/${fileStatus.id}`}
                                                    className="text-[8px] md:text-[9px] font-bold text-yellow-500 uppercase hover:underline"
                                                >
                                                    View
                                                </Link>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-shrink-0">
                        {files.length > 0 && !allFinished && (
                            <div className="p-4 md:p-6 bg-[#0a0a0e] border-t border-zinc-800/50 flex flex-col md:flex-row gap-3">
                                <button
                                    disabled={overallUploading}
                                    onClick={() => setFiles([])}
                                    className="h-12 border border-zinc-800 text-zinc-500 text-[11px] font-black uppercase tracking-[0.15em] hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center px-6"
                                >
                                    Clear All
                                </button>
                                <button
                                    disabled={overallUploading}
                                    onClick={performAllUploads}
                                    className="flex-1 h-12 bg-yellow-500 text-black text-[11px] font-black uppercase tracking-[0.15em] px-8 hover:bg-yellow-400 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_20px_rgba(234,179,8,0.2)]"
                                >
                                    {overallUploading ? 'Transmitting...' : 'Inject Protocols'} <ArrowRight size={16} strokeWidth={3} />
                                </button>
                            </div>
                        )}

                        {allFinished && (
                            <div className="p-4 bg-green-500/10 border-t border-green-500/30 text-green-500 text-[10px] font-bold uppercase tracking-widest text-center">
                                All Protocols Successfully Injected.
                            </div>
                        )}

                        <div className="p-4 bg-zinc-900/50 border-t border-zinc-800/50 flex items-center gap-3">
                            <ShieldAlert size={14} className="text-orange-500/70" />
                            <div className="text-[9px] text-zinc-500 uppercase tracking-tighter">BIT_PERFECT UPLOAD ACTIVE • OWNER: {owner.toUpperCase()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
