/**
 * SEED DATA: Phaethon OS (ZZZ Theme)
 * 
 * This file serves as the source of truth for mock data during development
 * and will be used as the base for D1 database seeding.
 * 
 * Data strictly follows the Drizzle schema in src/db/schema.ts.
 */

export interface MockFolder {
    id: string;
    name: string;
    parentId: string | null;
    owner: 'Wise' | 'Belle' | 'Phaethon';
    createdAt: Date;
}

export interface MockFile {
    id: string;
    name: string;
    folderId: string;
    category: 'ENCRYPTED' | 'MEDIA' | 'LOG' | 'AUDIO' | 'ADMIN' | 'SYSTEM' | 'PROXY LOG';
    status: 'ACTIVE' | 'WARNING' | 'SYNCED' | 'ARCHIVED' | 'ENCRYPTED';
    mimeType: string;
    sizeBytes: number;
    sizeDisplay: string; // Helper for UI display
    owner: 'Wise' | 'Belle' | 'Phaethon';
    isPinned: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const FEB_20_2026 = new Date('2026-02-20T10:00:00Z');
const FEB_21_2026 = new Date('2026-02-21T14:30:00Z');

export const mockFolders: MockFolder[] = [
    { id: 'f1', name: 'HOLLOW_ROOT', parentId: null, owner: 'Phaethon', createdAt: FEB_20_2026 },
    { id: 'f2', name: 'MEDIA_ARCHIVES', parentId: null, owner: 'Belle', createdAt: FEB_20_2026 },
    { id: 'f3', name: 'SYSTEM_LOGS', parentId: null, owner: 'Wise', createdAt: FEB_20_2026 },
];

export const mockFiles: MockFile[] = [
    {
        id: '1',
        name: 'Hollow_Zero_Topology_v4.dat',
        folderId: 'f1',
        category: 'ENCRYPTED',
        status: 'SYNCED',
        mimeType: 'application/octet-stream',
        sizeBytes: 15247133081,
        sizeDisplay: '14.2 GB',
        owner: 'Phaethon',
        isPinned: true,
        createdAt: FEB_20_2026,
        updatedAt: FEB_20_2026
    },
    {
        id: '2',
        name: 'Starlight_Knight_S01_Master.mkv',
        folderId: 'f2',
        category: 'MEDIA',
        status: 'ARCHIVED',
        mimeType: 'video/x-matroska',
        sizeBytes: 4509715660,
        sizeDisplay: '4.2 GB',
        owner: 'Belle',
        isPinned: true,
        createdAt: FEB_20_2026,
        updatedAt: FEB_20_2026
    },
    {
        id: '3',
        name: 'Monthly_Accounting_Feb.xls',
        folderId: 'f3',
        category: 'ADMIN',
        status: 'SYNCED',
        mimeType: 'application/vnd.ms-excel',
        sizeBytes: 14336,
        sizeDisplay: '14 KB',
        owner: 'Wise',
        isPinned: false,
        createdAt: FEB_21_2026,
        updatedAt: FEB_21_2026
    },
    {
        id: '4',
        name: 'Dead_End_Butcher_Trace.log',
        folderId: 'f1',
        category: 'PROXY LOG',
        status: 'ACTIVE',
        mimeType: 'text/plain',
        sizeBytes: 9019431321,
        sizeDisplay: '8.4 GB',
        owner: 'Phaethon',
        isPinned: true,
        createdAt: FEB_21_2026,
        updatedAt: FEB_21_2026
    },
    {
        id: '5',
        name: 'Eous_Diagnostic_ERR.txt',
        folderId: 'f3',
        category: 'SYSTEM',
        status: 'WARNING',
        mimeType: 'text/plain',
        sizeBytes: 46080,
        sizeDisplay: '45 KB',
        owner: 'Wise',
        isPinned: false,
        createdAt: FEB_21_2026,
        updatedAt: FEB_21_2026
    },
    {
        id: '6',
        name: 'Random_Play_Restock.txt',
        folderId: 'f2',
        category: 'ADMIN',
        status: 'SYNCED',
        mimeType: 'text/plain',
        sizeBytes: 2048,
        sizeDisplay: '2 KB',
        owner: 'Belle',
        isPinned: false,
        createdAt: FEB_21_2026,
        updatedAt: FEB_21_2026
    },
    {
        id: '7',
        name: 'Cunning_Hares_Comm.wav',
        folderId: 'f1',
        category: 'AUDIO',
        status: 'ENCRYPTED',
        mimeType: 'audio/wav',
        sizeBytes: 1181116006,
        sizeDisplay: '1.1 GB',
        owner: 'Phaethon',
        isPinned: false,
        createdAt: FEB_21_2026,
        updatedAt: FEB_21_2026
    },
    {
        id: '8',
        name: 'Midnight_Rider_Ep04_Dub.mp4',
        folderId: 'f2',
        category: 'MEDIA',
        status: 'SYNCED',
        mimeType: 'video/mp4',
        sizeBytes: 880803840,
        sizeDisplay: '840 MB',
        owner: 'Belle',
        isPinned: false,
        createdAt: FEB_21_2026,
        updatedAt: FEB_21_2026
    },
];
