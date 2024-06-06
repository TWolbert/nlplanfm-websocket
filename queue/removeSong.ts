import { songs } from "./addsong";

export function removeSongFromQueue(songId: string) {
    let found = false;

    songs.forEach((song, index) => {
        if (song.items[0].id === songId) {
            songs.splice(index, 1);
            found = true;
        }
    });

    return found;
}