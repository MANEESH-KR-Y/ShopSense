import React from 'react';
import { useSync } from '../contexts/SyncContext';

export default function NetworkStatus() {
    const { isOnline, isSyncing, queue } = useSync();

    if (isOnline && queue.length === 0) return null; // Hide if all good

    return (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-full font-bold shadow-lg z-50 flex items-center gap-2 transition-all
      ${isOnline
                ? "bg-yellow-500 text-black border border-yellow-600" // Online but syncing/queued
                : "bg-red-600 text-white border border-red-800" // Offline
            }
    `}>
            {!isOnline && (
                <>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    <span>OFFLINE ({queue.length} Saved)</span>
                </>
            )}

            {isOnline && queue.length > 0 && (
                <>
                    <span className="w-2 h-2 rounded-full bg-black animate-ping"></span>
                    <span>{isSyncing ? "SYNCING..." : "PENDING SYNC"} ({queue.length})</span>
                </>
            )}
        </div>
    );
}
