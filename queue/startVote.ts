import { date } from "zod";
import { io } from "..";
import { getSongLength } from "../search/getVideoLength";
import { DownloadSong } from "../songs/downloadSong";
import { songs, type SongWithVotes } from "./addsong";
import { GetRandomSongs } from "./GetRandomSongs";
import { removeSongFromQueue } from "./removeSong";

export let currentVoteSongs: SongWithVotes[] = [];
export let usersVotedCurrentRound: string[] = [];

/**
 * Start voting for the next song
 * @param {string} song1Id
 * @param {string} song2Id
 * @param {number} currentSongStartTime
 * @param {number} currentSongLength
 */
export function StartVoting(
    song1Id: string,
    song2Id: string,
    currentSongStartTime: number,
    currentSongLength: number
) {
    const song1 = songs.find((song) => song.items[0].id === song1Id);
    const song2 = songs.find((song) => song.items[0].id === song2Id);

    if (!song1 || !song2) {
        return;
    }

    currentVoteSongs.push({
        ...song1,
        votes: 0,
    });

    currentVoteSongs.push({
        ...song2,
        votes: 0,
    });

    const timeUntilCurrentSongEnd = currentSongLength * 1000;
    const timeUntilVoteEnd = (currentSongLength * 1000) - 5000;

    console.log(timeUntilCurrentSongEnd, timeUntilVoteEnd)

    io.sockets.emit("nextVoteSong", {
        songs: currentVoteSongs,
        timeUntilEnd: timeUntilVoteEnd,
    });

    setTimeout(() => {
        io.sockets.emit("endVote");
    }, timeUntilVoteEnd);

    // Wait until end of current song
    setTimeout(() => {
        EndVote();
        console.log("Voting ended, playing next song");
    }, timeUntilCurrentSongEnd);
}

/**
 * Returns true if song was found and voted for, false otherwise
 * @param {string} songId
 * @returns {boolean}
 */
export function VoteSong(songId: string, userId: string): { success: boolean, error?: string } {
    console.log("Voting for song", songId, userId);
    if (usersVotedCurrentRound.includes(userId)) {
        return {
            success: false,
            error: "User already voted"
        };
    }
    
    const song = currentVoteSongs.find((song) => song.items[0].id === songId);

    if (!song) {
        return {
            success: false,
            error: "Song not found"
        };
    }

    song.votes = (song.votes ?? 0) + 1;

    console.log(currentVoteSongs[0].items[0].snippet.title, currentVoteSongs[0].votes);
    console.log(currentVoteSongs[1].items[0].snippet.title, currentVoteSongs[1].votes);
    usersVotedCurrentRound.push(userId);
    return {
        success: true
    };
}

export async function EndVote() {
    const winner = currentVoteSongs.sort((a, b) => b.votes! - a.votes!)[0];

    const winningSong = songs.find(
        (song) => song.items[0].id === winner.items[0].id
    );

    if (!winningSong) {
        return;
    }

    const songUrl = await DownloadSong(winningSong.items[0].id);

    if ("error" in songUrl) {
        io.sockets.emit("playSong", {
            error: songUrl.error,
        });
        return;
    }

    io.sockets.emit("playSong", {
        url: songUrl.url,
        message: "Now playing: " + winningSong.items[0].snippet.title,
    });

    const losingSong = currentVoteSongs.find(
        (song) => song.items[0].id !== winner.items[0].id
    );

    if (losingSong) {
        losingSong.tries++;
        if (losingSong.tries >= 3) {
            removeSongFromQueue(losingSong.items[0].id);
        }
    }

    const winningSongLength = await getSongLength(winningSong.items[0].id);
    removeSongFromQueue(winningSong.items[0].id);

    currentVoteSongs = [];
    usersVotedCurrentRound = [];

    const [randomSong1, randomSong2] = GetRandomSongs();
    StartVoting(randomSong1, randomSong2, new Date().getTime(), winningSongLength);
}

export function GetVoteSongs() {
    return currentVoteSongs;
}