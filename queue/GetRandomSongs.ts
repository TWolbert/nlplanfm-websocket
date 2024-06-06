import type { Song } from "../search/getSongById";
import { songs } from "./addsong";

export function GetRandomSongs(): string[] {
    const randomSongs = songs.sort(() => Math.random() - 0.5).slice(0, 2);

    return randomSongs.map((song) => song.items[0].id);
}