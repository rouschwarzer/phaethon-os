'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldAlert, Cpu, ArrowRight, User } from 'lucide-react';
import { login } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginClient() {
    const [identity, setIdentity] = useState<'Wise' | 'Belle'>('Wise');
    const [masterKey, setMasterKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const result = await login(identity, masterKey);

        if (result.success) {
            router.push('/');
        } else {
            setError(result.error || 'Identity Verification Failed');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050507] text-zinc-300 font-mono flex items-center justify-center p-4 relative overflow-hidden">

            {/* Background HUD Decor */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-10 left-10 border-l border-t border-orange-500/30 w-32 h-32"></div>
                <div className="absolute bottom-10 right-10 border-r border-b border-orange-500/30 w-32 h-32"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-orange-500/5 animate-[spin_20s_linear_infinite]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Top Header Label */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-orange-500 tracking-[0.3em]">
                        <ShieldAlert size={14} /> SECURITY CHECKPOINT
                    </div>
                    <div className="text-[10px] text-zinc-600">v2.4.6_INIT</div>
                </div>

                <div className="bg-[#0f0f13] border border-zinc-800 p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
                    {/* Internal Border Decorative */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>

                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <img src="/zzz-logo.webp" alt="ZZZ Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                            <div className="h-10 w-[1px] bg-zinc-800"></div>
                            <div>
                                <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-3 italic">
                                    PROXY_UPLINK <Lock className="text-orange-500" size={20} />
                                </h1>
                                <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-[0.2em] font-bold">Secure Access Protocol Initiated</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Identity Switcher */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block">Select Identity</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['Wise', 'Belle'] as const).map((id) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setIdentity(id)}
                                        className={`h-24 border flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden ${identity === id
                                            ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                                            : 'border-zinc-800 bg-zinc-900/50 text-zinc-600 hover:border-zinc-700'
                                            }`}
                                    >
                                        <div className="relative w-12 h-12 grayscale group-hover:grayscale-0 transition-all">
                                            <Image
                                                src={id === 'Wise' ? '/wise.webp' : '/belle.webp'}
                                                alt={id}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{id}</span>
                                        {identity === id && (
                                            <motion.div layoutId="activeInd" className="absolute -bottom-1 -right-1 w-2 h-2 bg-orange-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Master Key Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block">Master Key</label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••••••••••"
                                    value={masterKey}
                                    onChange={(e) => setMasterKey(e.target.value)}
                                    className="w-full bg-black border border-zinc-800 p-4 text-orange-400 font-mono tracking-[0.5em] outline-none focus:border-orange-500/50 transition-colors"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700">
                                    <Cpu size={18} />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-3 bg-red-950/20 border border-red-500/30 text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
                            >
                                <ShieldAlert size={14} /> {error}
                            </motion.div>
                        )}

                        <button
                            disabled={loading}
                            className={`w-full h-14 bg-orange-500 hover:bg-orange-400 text-black font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${loading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {loading ? 'Decrypting...' : 'Initiate Session'} <ArrowRight size={18} strokeWidth={3} />
                        </button>
                    </form>

                    {/* Bottom HUD Labels */}
                    <div className="mt-8 pt-6 border-t border-zinc-900 flex justify-between">
                        <div className="text-[9px] text-zinc-700 flex flex-col gap-1">
                            <span>CRYPTO_LEVEL: HIGH_ENTROPY</span>
                            <span>TIMING_SAFE: ENABLED</span>
                        </div>
                        <div className="text-[9px] text-zinc-700 text-right flex flex-col gap-1">
                            <span>PHAETHON NETWORK BIND</span>
                            <span>AUTH_V_1.0.4</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Global Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%]"></div>
        </div>
    );
}
