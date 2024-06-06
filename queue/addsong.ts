import type { Song } from "../search/getSongById";

// Keyvalue pair array for songs
interface SongWithTries extends Song {
    tries: number;
 }

export interface SongWithVotes extends SongWithTries {   
    votes?: number;
}

export const songs: SongWithTries[] = []

export function AddSongToQueue() {

}