/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addProfileBadge, BadgePosition, BadgeUserArgs, ProfileBadge, removeProfileBadge } from "@api/Badges";
import { addMemberListDecorator, removeMemberListDecorator } from "@api/MemberListDecorators";
import { addMessageDecoration, removeMessageDecoration } from "@api/MessageDecorations";
import { Settings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import definePlugin, { OptionType } from "@utils/types";
import { React } from "@webpack/common";

import { loadCacheFromLocalStorage, saveCacheToLocalStorage } from "./datastore";

const Devs = {
    Ivy: {
        name: "IvyIsInsane",
        id: 1360237881263783967n
    },
};

let chasterCache: Record<string, { data: any, lockData: any, timestamp: number; }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const badge: ProfileBadge = {
    getBadges,
    position: BadgePosition.START,
};

const indicatorLocations = {
    list: {
        description: "In the member list",
        onEnable: () => addMemberListDecorator("platform-indicator", props =>
            <ErrorBoundary noop>
                <ChasterIndicator userId={props.user.id} />
            </ErrorBoundary >
        ),
        onDisable: () => removeMemberListDecorator("platform-indicator")
    },
    badges: {
        description: "In user profiles, as badges",
        onEnable: () => addProfileBadge(badge),
        onDisable: () => removeProfileBadge(badge)
    },
    messages: {
        description: "Inside messages",
        onEnable: () => addMessageDecoration("chaster-indicator", e =>
            <ErrorBoundary noop >
                <ChasterIndicator userId={e.message.author.id} />
            </ErrorBoundary>
        ),
        onDisable: () => removeMessageDecoration("chaster-indicator")
    }
};
function checkLockStatus(userId: string): boolean {
    const updateChasterStatus = async () => {
        try {
            console.log("VencordChaster: Fetching data for userId:", userId);
            const apiKey = Settings.plugins.VencordChaster.apiKey || "";
            const requestInit: RequestInit = {
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "VencordChaster/1.0",
                    ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
                },
            };
            if (apiKey) {
                const response = await fetch(`https://api.chaster.app/users/search/by-discord-id/${userId}`, requestInit);

                if (response.status === 404) {
                    chasterCache[userId] = { data: null, lockData: null, timestamp: Date.now() };
                    return;
                }

                if (response.ok) {
                    const data = await response.json();
                    const chasterID = data?._id;
                    if (!chasterID) {
                        console.warn("Chaster ID not found");
                        return;
                    }
                    const resp = await fetch(`https://api.chaster.app/locks/user/${chasterID}`, requestInit);
                    if (resp.ok) {
                        const lockData = await resp.json();
                        chasterCache[userId] = { data, lockData, timestamp: Date.now() };
                    }
                }
                saveCacheToLocalStorage(chasterCache);
            }
        } catch (error) {
            console.error("Error fetching Chaster data:", error);
        }
    };

    const userData = chasterCache[userId];
    const now = Date.now();
    if (!userData || now - userData.timestamp >= CACHE_TTL) {
        updateChasterStatus().catch(console.error);
    }

    return !!userData?.lockData?.length;
}

function getBadges({ userId }: BadgeUserArgs): ProfileBadge[] {
    console.debug("VencordChaster: getBadges called for userId:", userId);
    const shouldShowChasterBadge = checkLockStatus(userId);
    if (!shouldShowChasterBadge) return [];

    return [{
        component: () => (
            <span className="chaster-badge" >
                <ChasterIndicator userId={userId} />
            </span>
        ),
        key: "chaster-badge"
    }];
}

function formatTimeLeft(lock: any): any {
    if (!lock || !lock.endDate) return "";
    if (lock.displayRemainingTime !== undefined) {
        const endDate = new Date(lock.endDate).getTime(); // Adding 12 hours offset
        const now = Date.now();
        const timeLeftMs = endDate - now;
        if (timeLeftMs <= 0) return "0s";
        const seconds = Math.floor(timeLeftMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0) {
            return `${days}d ${hours % 24}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
}

function ChasterIndicator(props: { userId: string; }) {

    const shouldShowChasterBadge = checkLockStatus(props.userId);
    const locktime = formatTimeLeft(chasterCache[props.userId]?.lockData?.[0]);
    let canBeUnlocked = chasterCache[props.userId]?.lockData?.[0]?.canBeUnlocked;
    const displayRemainingTime = chasterCache[props.userId]?.lockData?.[0]?.displayRemainingTime;
    const kh = chasterCache[props.userId]?.lockData?.[0]?.keyholder?.username;
    const isFrozen = chasterCache[props.userId]?.lockData?.[0]?.isFrozen;
    if (locktime === "0s") {
        canBeUnlocked = true;
    }

    if (shouldShowChasterBadge) {
        return (
            <span
                className="chaster-indicator"
                style={{
                    backgroundColor: "#7289da",
                    color: "white",
                    padding: "0px 4px",
                    borderRadius: "3px",
                    fontSize: "12px",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center"
                }}
            >
                {canBeUnlocked ? "🔓" : "🔒"}
                {isFrozen ? "❄️" : ""}
                Locked
                {
                    !canBeUnlocked && kh && (
                        <span style={{ marginLeft: "4px" }}>
                            {kh ? `by ${kh}` : ""}
                        </span>
                    )
                }
                {
                    displayRemainingTime && !canBeUnlocked && (
                        <span style={{ marginLeft: "4px" }}>
                            ({locktime})
                        </span>
                    )
                }

            </span>
        );
    }
    return null;
}

export default definePlugin({
    name: "VencordChaster",
    description: "Integrates Chaster with Discord to manage chastity devices and related features.",
    authors: [Devs.Ivy],
    dependencies: ["MessageDecorationsAPI", "MemberListDecoratorsAPI"],

    options: {
        apiKey: {
            type: OptionType.STRING,
            description: "Chaster API Key",
            restartNeeded: false,
            default: ""
        }
    },

    patches: [
        {
            find: "renderMessageUsername",
            replacement: {
                match: /function \w+\(\w+\){/,
                replace: "$&$self.patchUsername(arguments[0]);"
            }
        }
    ],

    patchUsername(props: { username: { type: (messageProps: any) => any; }; }) {
        const oldRender = props.username.type;
        props.username.type = (messageProps: any) => {
            const res = oldRender(messageProps);
            return this.MessageUsername({
                original: res,
                message: messageProps.message,
                author: messageProps.message?.author
            });
        };
        return props;
    },

    async start() {
        const loadedCache = await loadCacheFromLocalStorage();
        chasterCache = loadedCache || {};
        const settings = Settings.plugins.VencordChaster;
        for (const [key, location] of Object.entries(indicatorLocations)) {
            if (settings[key] !== false) {
                location.onEnable();
            }
        }
        if (!window?.document) {
            console.warn("VencordChaster: Not in browser environment, skipping start");
        }
    },

    stop() {
        saveCacheToLocalStorage(chasterCache);
        for (const location of Object.values(indicatorLocations)) {
            location.onDisable();
        }
        console.log("VencordChaster stopped");
    },

    MessageUsername: function ({ original, message, author }) {
        const shouldShowChasterTag = checkLockStatus(author.id);
        if (!shouldShowChasterTag) return original;

        return (
            <>
                {original}
                {shouldShowChasterTag && (
                    <ErrorBoundary noop>
                        <ChasterIndicator userId={author.id} />
                    </ErrorBoundary >
                )}
            </>
        );
    }
});
