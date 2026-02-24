export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import UplinkClient from './UplinkClient';

export default function UplinkPage() {
    return (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-zinc-600 text-[10px] uppercase tracking-widest font-bold">Synchronizing Protocols...</div>}>
            <UplinkClient />
        </Suspense>
    );
}
