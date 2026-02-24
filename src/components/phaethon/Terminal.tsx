'use client';

import React, { useState, useEffect } from 'react';

export function Terminal() {
    const [terminalText, setTerminalText] = useState('');
    const fullText = "> Eous system nominal.\n> Proxy routing active.\n> Awaiting input...";

    useEffect(() => {
        let i = 0;
        const typing = setInterval(() => {
            setTerminalText(fullText.slice(0, i));
            i++;
            if (i > fullText.length) clearInterval(typing);
        }, 50);
        return () => clearInterval(typing);
    }, []);

    return (
        <div className="h-40 bg-black border-t border-zinc-800/80 p-4 font-mono text-[10px] overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-gradient-to-b from-transparent to-orange-900/10"></div>
            <p className="text-orange-500/50 mb-2 font-bold tracking-tighter uppercase">Phaethon OS v2.4.6</p>
            <p className="text-orange-400 whitespace-pre-line leading-relaxed">{terminalText}</p>
            <span className="w-1.5 h-3 bg-orange-400 inline-block animate-pulse ml-1 align-middle"></span>
        </div>
    );
}
