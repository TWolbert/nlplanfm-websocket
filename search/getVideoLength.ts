export function getSongLength(id: string): Promise<number> {
    // Fetch youtube api to get video lengthq
    return fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${id}&key=${process.env.YOUTUBE_API_KEY}`)
        .then(res => res.json())
        .then(data => {
            const duration = data.items[0].contentDetails.duration;
            const hours = duration.match(/(\d+)H/);
            const minutes = duration.match(/(\d+)M/);
            const seconds = duration.match(/(\d+)S/);

            let totalSeconds = 0;

            if (hours) {
                totalSeconds += parseInt(hours[1]) * 60 * 60;
            }

            if (minutes) {
                totalSeconds += parseInt(minutes[1]) * 60;
            }

            if (seconds) {
                totalSeconds += parseInt(seconds[1]);
            }

            return totalSeconds;
        });
}