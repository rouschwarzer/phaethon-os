'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStorageStats } from '@/lib/actions';
import { useQueryClient } from '@tanstack/react-query';

interface ViewContextType {
    activeView: string;
    setActiveView: (view: string) => void;
    selectedTagId: string | null;
    setSelectedTagId: (tagId: string | null) => void;
    storage: { Percentage: number };
    time: string;
    refreshSystem: () => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: React.ReactNode }) {
    const queryClient = useQueryClient();
    const [activeView, setActiveView] = useState('all');
    const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
    const [time, setTime] = useState('');
    const [storage, setStorage] = useState({ Percentage: 64.2 });

    useEffect(() => {
        setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        getStorageStats().then(stats => {
            if (stats.percentage !== undefined) {
                setStorage({ Percentage: stats.percentage });
            }
        }).catch(() => { });
    }, [activeView]);

    const refreshSystem = () => {
        queryClient.invalidateQueries({ queryKey: ['files'] });
        queryClient.invalidateQueries({ queryKey: ['file'] });
        queryClient.invalidateQueries({ queryKey: ['tags'] });
    };

    return (
        <ViewContext.Provider value={{
            activeView,
            setActiveView,
            selectedTagId,
            setSelectedTagId,
            storage,
            time,
            refreshSystem
        }}>
            {children}
        </ViewContext.Provider>
    );
}

export function useView() {
    const context = useContext(ViewContext);
    if (context === undefined) {
        throw new Error('useView must be used within a ViewProvider');
    }
    return context;
}
