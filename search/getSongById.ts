export interface Song {
    kind: string;
    etag: string;
    items: Array<{
        kind: string;
        etag: string;
        id: string;
        snippet: {
            publishedAt: string;
            channelId: string;
            title: string;
            description: string;
            thumbnails: {
                default: {
                    url: string;
                    width: number;
                    height: number;
                };
                medium: {
                    url: string;
                    width: number;
                    height: number;
                };
                high: {
                    url: string;
                    width: number;
                    height: number;
                };
                standard: {
                    url: string;
                    width: number;
                    height: number;
                };
                maxres: {
                    url: string;
                    width: number;
                    height: number;
                };
            };
            channelTitle: string;
            tags: string[];
            categoryId: string;
            liveBroadcastContent: string;
            defaultLanguage: string;
            localized: {
                title: string;
                description: string;
            };
            defaultAudioLanguage: string;
        };
    }>;
    pageInfo: {
        totalResults: number;
        resultsPerPage: number;
    };
}

export function getSongById(id: string): Promise<Song> {
    return fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${id}&key=${process.env.YOUTUBE_API_KEY}`
    )
        .then((response) => response.json())
        .then((data) => {
            return data;
        });
}
