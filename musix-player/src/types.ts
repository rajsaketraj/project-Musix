export interface VideoResult {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    thumbnails: {
      medium: {
        url: string;
      }
    }
  };
  duration?: string;
}

export interface SearchResponse {
  items: VideoResult[];
  nextPageToken?: string;
}
