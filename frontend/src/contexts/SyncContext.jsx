import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import api from '../services/api';

const SyncContext = createContext();

export function useSync() {
    return useContext(SyncContext);
}

export function SyncProvider({ children }) {
    const isOnline = useNetworkStatus();
    const [queue, setQueue] = useState(() => {
        // Load initial queue from localStorage
        const saved = localStorage.getItem('offline_order_queue');
        return saved ? JSON.parse(saved) : [];
    });
    const [isSyncing, setIsSyncing] = useState(false);

    // Save queue to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('offline_order_queue', JSON.stringify(queue));
    }, [queue]);

    // Attempt sync when online and queue has items
    useEffect(() => {
        if (isOnline && queue.length > 0 && !isSyncing) {
            syncOrders();
        }
    }, [isOnline, queue, isSyncing]);

    const addToQueue = (orderData) => {
        const newItem = { ...orderData, tempId: Date.now(), timestamp: new Date().toISOString() };
        setQueue(prev => [...prev, newItem]);
        // If online, try to sync immediately (handled by useEffect, but we can trigger stricter check later)
    };

    const syncOrders = async () => {
        setIsSyncing(true);
        console.log("Starting Sync...", queue.length, "items");

        // Process queue sequentially
        let newQueue = [...queue];

        for (const item of newQueue) {
            try {
                await api.post("/orders", item);
                // On success, notify user (optional toast)
                console.log("Synced Order:", item.tempId);
                // Remove from local queue
                setQueue(prev => prev.filter(q => q.tempId !== item.tempId));
            } catch (err) {
                console.error("Sync failed for item", item.tempId, err);
                // Keep in queue to retry later
                // Break loop to preserve order or continue? Continue is better for independent orders.
            }
        }

        setIsSyncing(false);
    };

    const value = {
        isOnline,
        queue,
        addToQueue,
        isSyncing
    };

    return (
        <SyncContext.Provider value={value}>
            {children}
        </SyncContext.Provider>
    );
}
