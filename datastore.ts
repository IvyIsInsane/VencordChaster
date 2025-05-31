/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { PluginNative } from "@utils/types";
const Native = VencordNative.pluginHelpers.vencordChaster as PluginNative<typeof import("./native")>;


export async function saveCacheToLocalStorage(cache: Record<string, any>) {
    try {
        await Native.saveData(cache);
    } catch (error) {
        console.error("Failed to save Chaster cache to DataStore:", error);
    }
}

export async function loadCacheFromLocalStorage(): Promise<Record<string, any> | null> {
    try {
        const data = await Native.loadData();
        return data && typeof data === "string" ? JSON.parse(data) : null;
    } catch (error) {
        console.error("Failed to load Chaster cache from DataStore:", error);
        return {};
    }
}
