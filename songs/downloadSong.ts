import axios from "axios";
import fs from "fs";

interface DownloadResponse {
    url: string;
}

interface DownloadError {
    error: string;
}

const apiLink = "https://co.wuk.sh/";
const cobaltApi = axios.create({
    baseURL: apiLink,
});

export async function DownloadSong(
    songId: string
): Promise<DownloadResponse | DownloadError> {
    if (fs.existsSync(`./tmp/${songId}.mp3`)) {
        console.log("File already exists");
        return {
            url: process.env.SERVER_URL + "/song/" + songId,
        };
     }

    const songUrl = "https://youtube.com/watch?v=" + songId;
    const data = await cobaltApi.post(
        "/api/json",
        {
            url: songUrl,
        },
        {
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        }
    );

    const streamUrl = data.data.url;

    return new Promise((resolve) => {
        cobaltApi
            .get(streamUrl, {
                responseType: "stream",
                headers: {
                    "Accept-Encoding": "gzip",
                },
            })
            .then((response) => {
                const path = `./tmp/${songId}.mp3`;
                const writer = fs.createWriteStream(path);
                response.data.pipe(writer);

                writer.on("finish", async () => {
                    resolve({
                        url: process.env.SERVER_URL + "/song/" + songId,
                    });
                });

                writer.on("error", (err) => {
                    console.error(err);
                    resolve({
                        error: err.message,
                    });
                });
            })
            .catch((err) => {
                console.error(err);
                resolve({
                    error: err.message,
                });
            });
    });
}
