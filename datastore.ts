/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { PluginNative } from "@utils/types";
const Native = VencordNative.pluginHelpers.VencordChaster as PluginNative<typeof import("./native")>;

// Define the essential data structure that needs to be saved
export interface ChasterUserData {
    timestamp: number;
    data: {
        _id: string;
        username?: string;
    } | null;
    lockData: {
        _id: string;
        status: string;
        endDate?: string;
        displayRemainingTime?: boolean;
        canBeUnlocked?: boolean;
        keyholder?: {
            username: string;
        };
    }[] | null;
}

export type ChasterCache = Record<string, ChasterUserData>;

/**
 * Extracts only the essential data needed for the plugin functionality
 */
function extractEssentialData(cache: Record<string, any>): ChasterCache {
    const essentialCache: ChasterCache = {};

    for (const userId in cache) {
        const userData = cache[userId];
        if (!userData) continue;

        essentialCache[userId] = {
            timestamp: userData.timestamp,
            data: userData.data ? {
                _id: userData.data._id,
                username: userData.data.username
            } : null,
            lockData: userData.lockData ? userData.lockData.map(lock => ({
                _id: lock._id,
                status: lock.status,
                endDate: lock.endDate,
                displayRemainingTime: lock.displayRemainingTime,
                canBeUnlocked: lock.canBeUnlocked,
                keyholder: lock.keyholder ? {
                    username: lock.keyholder.username
                } : undefined
            })) : null
        };
    }

    return essentialCache;
}

export async function saveCacheToLocalStorage(cache: Record<string, any>) {
    try {
        // Only save essential data to reduce storage size
        const essentialData = extractEssentialData(cache);
        await Native.saveData(essentialData);
    } catch (error) {
        console.error("Failed to save Chaster cache to DataStore:", error);
    }
}

export async function loadCacheFromLocalStorage(): Promise<Record<string, any> | null> {
    try {
        const data = await Native.loadData();

        // Handle both string data and object data formats
        if (typeof data === "string") {
            try {
                return JSON.parse(data);
            } catch (parseError) {
                console.error("Failed to parse Chaster cache data:", parseError);
                return {};
            }
        }

        return data || {};
    } catch (error) {
        console.error("Failed to load Chaster cache from DataStore:", error);
        return {};
    }
}
