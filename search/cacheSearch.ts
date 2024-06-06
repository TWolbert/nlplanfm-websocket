import type { YoutubeSearchResult } from "./search";
import { Database } from "bun:sqlite";

export const db = new Database("nlplanfm.sqlite")

export function cacheAdd(key: string, result: YoutubeSearchResult) {
    // Create cache table if it doesnt exist
    db.exec(`CREATE TABLE IF NOT EXISTS search_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT,
        result TEXT
    )`);

    // Check if the key already exists
    const existing = db.prepare("SELECT * FROM search_cache WHERE key = ?").get(key);

    if (existing) {
        db.prepare("UPDATE search_cache SET result = ? WHERE key = ?").run(JSON.stringify(result), key);
    } else {
        db.prepare("INSERT INTO search_cache (key, result) VALUES (?, ?)").run(key, JSON.stringify(result));
    }
}

export function cacheGet(key: string): YoutubeSearchResult | null {
    db.exec(`CREATE TABLE IF NOT EXISTS search_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT,
        result TEXT
    )`);

    interface Result {
        key: string;
        result: string;
    }

    const existing = db.prepare("SELECT * FROM search_cache WHERE key = ?").get(key) as Result;

    if (existing) {
        return JSON.parse(existing.result);
    }

    return null;
}