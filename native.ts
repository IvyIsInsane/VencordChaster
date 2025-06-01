/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Define data storage directory
const STORAGE_DIR = join(process.env.DATA_DIR || process.cwd(), "vencordChaster");
const DATA_FILE = join(STORAGE_DIR, "data.json");
const STORAGE_KEY = "vencordChaster_data";

const isBrowser = typeof window !== "undefined" && typeof localStorage !== "undefined";

function ensureStorageDirectory() {
    if (!isBrowser && !existsSync(STORAGE_DIR)) {
        mkdirSync(STORAGE_DIR, { recursive: true });
    }
}

/**
 * Save data to JSON file or localStorage
 * @param data Any serializable data to save
 */
export function saveData<T>(_, data: T): void {
    try {
        if (isBrowser) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } else {
            ensureStorageDirectory();
            writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
        }
    } catch (error) {
        console.error("Failed to save data:", error);
    }
}

/**
 * Load data from JSON file or localStorage
 * @param defaultValue Default value to return if file/storage doesn't exist
 * @returns The parsed data or defaultValue if file/storage doesn't exist
 */
export function loadData<T>(defaultValue: T): T {
    try {
        if (isBrowser) {
            const storedData = localStorage.getItem(STORAGE_KEY);
            return storedData ? JSON.parse(storedData) as T : defaultValue;
        } else {
            ensureStorageDirectory();
            if (existsSync(DATA_FILE)) {
                const fileContent = readFileSync(DATA_FILE, "utf8");
                return JSON.parse(fileContent) as T;
            }
            return defaultValue;
        }
    } catch (error) {
        console.error("Failed to load data:", error);
        return defaultValue;
    }
}
