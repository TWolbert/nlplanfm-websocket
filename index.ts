// init expressjs
import express from "express";
const app = express();

import { Server } from "socket.io";
import http from "http";
import { findSongOnYoutube } from "./search/search";
import { getSongById } from "./search/getSongById";
import { songs, type SongWithVotes } from "./queue/addsong";
const server = http.createServer(app);
import fs from "fs";
import axios from "axios";
import { getSongLength } from "./search/getVideoLength";
import { DownloadSong } from "./songs/downloadSong";
import { cacheAdd, cacheGet } from "./search/cacheSearch";
import { isNil } from "lodash";
import { z } from "zod";
import { removeSongFromQueue } from "./queue/removeSong";
import { GetVoteSongs, StartVoting, VoteSong } from "./queue/startVote";
import { GetRandomSongs } from "./queue/GetRandomSongs";

app.use(express.json());
// Allow global cors
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    next();
});

export const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

const apiLink = "https://co.wuk.sh/"
const cobaltApi = axios.create({
    baseURL: apiLink,
});

export let started = false;
export let nextVoteSongs: SongWithVotes[] = [];
export let voteEndTime: number = -1;

app.get("/", (req, res) => {
    res.send("<h1>vuile hoer wat doe je bij mn websocket nou dan</h1>");
});

app.get('/song/:id', (req, res) => {
    const id = req.params.id;

    const baseDir = __dirname
    const filePath = `${baseDir}/tmp/${id}.mp3`

    if (!fs.existsSync(filePath)) {
        res.send('Not found bro')
    }

    res.sendFile(filePath);
})

app.get('/status', (req, res) => {
    res.status(200).send('Server is active');
})

app.post('/search',async (req, res) => {
    console.log(req.body);
    const query = req.body.query;

    const song = await findSongOnYoutube(query);

    res.json({
        name: song.snippet.title,
        url: "https://youtube.com/watch?v=" + song.id.videoId
    })
});

io.on("connection", (socket) => {
    console.log("connection");
    socket.on('message', (data) => {
        const message = JSON.parse(data);
        console.log(message);
    });

    socket.on('chat', (data) => {
        const chatMessageSchema = z.object({
            user: z.string(),
            text: z.string(),
            timeSent: z.string()
        })

        const dataObj = JSON.parse(data);

        try {
            const chatMessage = chatMessageSchema.parse(dataObj);
            io.sockets.emit('chat', chatMessage);
        }
        catch (error) {
            console.log('Invalid chat message');
        }
    })

    socket.on('search', async (query) => {
        const searchQuery = (query as string).toLowerCase();
        const cacheHit = cacheGet(searchQuery);

        if (!isNil(cacheHit)) {
            socket.emit('search', {
                id: cacheHit.id.videoId,
                name: decodeURI(cacheHit.snippet.title),
                url: "https://youtube.com/watch?v=" + cacheHit.id.videoId,
                art: cacheHit.snippet.thumbnails.default,
                cache: true
            });

            return;
        }

        const song = await findSongOnYoutube(searchQuery);

        cacheAdd(searchQuery, song)
        
        socket.emit('search', {
            id: song.id.videoId,
            name: song.snippet.title,
            url: "https://youtube.com/watch?v=" + song.id.videoId,
            art: song.snippet.thumbnails.default
        });
    })

    socket.on('submit', async songId => {
        const song = await getSongById(songId);

        let songAlreadyInQueue = false;

        songs.forEach(song => {
            if (song.items[0].id === songId) {
                songAlreadyInQueue = true;
            }
        });

        if (songAlreadyInQueue) {
            socket.emit('submit', {
                error: "Song already in queue"
            });
            return;
        }

        songs.push({
            ...song, tries: 0
        });

        socket.emit('submit', {
            success: "Song submitted"
        });
    })

    socket.on('getQueue', () => {
        socket.emit('getQueue', songs);
    });

    socket.on('getVoteSongs', () => { 
        socket.emit('getVoteSongs', GetVoteSongs());
    });

    socket.on('hasStarted', () => {
        socket.emit('hasStarted', started);
    });

    socket.on('startSong', async () => {
        console.log('starting song')
        if (songs.length <= 0) {
            socket.emit('playSong', {
                error: "No songs in queue"
            });
            return;
         }

         if (songs.length < 3) {
            socket.emit('playSong', {
                error: "Not enough songs in queue"
            });
            return;
         }

         const firstSong = songs[0];

         // Check if /tmp exists
        if (!fs.existsSync('./tmp')) {
            fs.mkdirSync('./tmp');
        }

        const songUrl = await DownloadSong(firstSong.items[0].id);

        if ('error' in songUrl) {
            socket.emit('playSong', {
                error: songUrl.error
            });
            return;
         }

        started = true;

        io.sockets.emit('playSong', {
            url: songUrl.url,
            message: 'Now playing: ' + firstSong.items[0].snippet.title,
        });

        removeSongFromQueue(firstSong.items[0].id);
        const [randomSong1, randomSong2] = GetRandomSongs();
        StartVoting(randomSong1, randomSong2, new Date().getTime(), await getSongLength(firstSong.items[0].id));
     });

     socket.on('vote', (data) => {
        const dataSchema = z.object({
            songId: z.string(),
            userId: z.string()
        });

        const dataObj = dataSchema.parse(JSON.parse(data));
        const voted = VoteSong(dataObj.songId, dataObj.userId);

        if (!voted.success) {
            socket.emit('voteSong', {
                error: voted.error,
                songId: data.songId,
            });
            return;
        }

        socket.emit('voteSong', {
            success: 'Voted for song',
            songId: data.songId,
        });
     });

    socket.on("disconnect", (socket) => {
        console.log("Disconnect");
    });
});

server.listen(3000, () => {
    console.log("Server is running");
});
