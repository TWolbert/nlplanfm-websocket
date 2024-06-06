
export type YoutubeSearchResult = {
    kind: "youtube#searchResult";
    etag: string;
    id: {
      kind: string;
      videoId?: string;
      channelId?: string;
      playlistId?: string;
    };
    snippet: {
      publishedAt: string; // Using string to represent ISO 8601 date-time format
      channelId: string;
      title: string;
      description: string;
      thumbnails: {
        [key: string]: {
          url: string;
          width: number;
          height: number;
        };
      };
      channelTitle: string;
      liveBroadcastContent: string;
    };
  };
  

export const findSongOnYoutube = async (query: string): Promise<YoutubeSearchResult> => { 
  console.log(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${query}&key=${process.env.YOUTUBE_API_KEY}`)
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${query}&key=${process.env.YOUTUBE_API_KEY}`);
    const data = await response.json();
    console.log(data);
    return data.items[0];
}