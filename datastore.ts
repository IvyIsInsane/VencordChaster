/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { PluginNative } from "@utils/types";
const Native = VencordNative?.pluginHelpers?.VencordChaster as PluginNative<typeof import("./native")>;
const isInBrowser = typeof window !== "undefined" && !VencordNative;
const STORAGE_KEY = "VencordChasterCache";
const { localStorage } = window;
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
        const essentialData = extractEssentialData(cache);

        if (isInBrowser) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(essentialData));
        } else {
            await Native.saveData(essentialData);
        }
    } catch (error) {
        console.error("Failed to save Chaster cache to storage:", error);
    }
}

export async function loadCacheFromLocalStorage(): Promise<Record<string, any> | null> {
    try {
        let data;

        if (isInBrowser) {
            data = localStorage.getItem(STORAGE_KEY);
        } else {
            data = await Native.loadData();
        }

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
        console.error("Failed to load Chaster cache from storage:", error);
        return {};
    }
}
