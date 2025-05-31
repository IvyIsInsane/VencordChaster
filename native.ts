/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DataStore } from "@api/index";

const CHASTER_CACHE_KEY = "chasterCache";

export async function saveCacheToLocalStorage(cache: Record<string, any>) {
    try {
        await DataStore.set(CHASTER_CACHE_KEY, cache);
    } catch (error) {
        console.error("Failed to save Chaster cache to DataStore:", error);
    }
}

export async function loadCacheFromLocalStorage(): Promise<Record<string, any> | null> {
    try {
        return await DataStore.get(CHASTER_CACHE_KEY) || null;
    } catch (error) {
        console.error("Failed to load Chaster cache from DataStore:", error);
        return {};
    }
}
