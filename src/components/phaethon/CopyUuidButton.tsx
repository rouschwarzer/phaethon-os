'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyUuidButtonProps {
    uuid: string;
}

export function CopyUuidButton({ uuid }: CopyUuidButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(uuid);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black border border-zinc-800 rounded transition-colors group/copy z-10"
            title="Copy UUID to clipboard"
        >
            {copied ? (
                <Check size={16} className="text-green-500" />
            ) : (
                <Copy size={16} className="text-zinc-500 group-hover/copy:text-zinc-300" />
            )}
        </button>
    );
}
