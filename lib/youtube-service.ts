import { cacheManager } from "./cache";

interface YouTubeSearchParams {
  query: string;
  maxResults?: number;
  order?: "relevance" | "viewCount" | "rating" | "date";
  videoDuration?: "any" | "short" | "medium" | "long";
  type?: "video";
}

interface YouTubeVideoItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
    channelTitle: string;
    publishedAt: string;
  };
}

interface YouTubeVideoDetails {
  id: string;
  contentDetails: {
    duration: string; // PT1H30M20S format
  };
  statistics: {
    viewCount: string;
  };
}

interface IVideo {
  videoId: string;
  title: string;
  description: string;
  duration: string;
  viewCount: number;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: Date;
}

export class YouTubeService {
  private apiKey: string;
  private baseUrl = "https://www.googleapis.com/youtube/v3";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for educational videos on YouTube
   */
  async searchEducationalVideos(
    params: YouTubeSearchParams
  ): Promise<IVideo[]> {
    const cacheKey = `youtube:search:${JSON.stringify(params)}`;

    // Check cache first
    const cached = cacheManager.get<IVideo[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Enhance query for educational content
      const enhancedQuery = `${params.query} tutorial programming development course`;

      // Search for videos - ONLY embeddable ones
      const searchResponse = await fetch(
        `${this.baseUrl}/search?key=${this.apiKey}&q=${encodeURIComponent(
          enhancedQuery
        )}&part=snippet&type=video&maxResults=${
          params.maxResults || 10
        }&order=${params.order || "relevance"}&videoDuration=${
          params.videoDuration || "medium"
        }&videoEmbeddable=true&videoSyndicated=true`
      );

      if (!searchResponse.ok) {
        throw new Error(`YouTube API error: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      const videoItems: YouTubeVideoItem[] = searchData.items;

      if (videoItems.length === 0) {
        return [];
      }

      // Get video IDs for details
      const videoIds = videoItems.map((item) => item.id.videoId).join(",");

      // Get video details (duration, view count)
      const detailsResponse = await fetch(
        `${this.baseUrl}/videos?key=${this.apiKey}&id=${videoIds}&part=contentDetails,statistics`
      );

      if (!detailsResponse.ok) {
        throw new Error(`YouTube API error: ${detailsResponse.status}`);
      }

      const detailsData = await detailsResponse.json();
      const videoDetails: Record<string, YouTubeVideoDetails> = {};

      detailsData.items.forEach((item: YouTubeVideoDetails) => {
        videoDetails[item.id] = item;
      });

      // Filter and transform videos
      const videos: IVideo[] = videoItems
        .map((item) => {
          const details = videoDetails[item.id.videoId];
          if (!details) return null;

          const viewCount = parseInt(details.statistics.viewCount) || 0;

          // Filter by view count and duration
          if (viewCount < 1000) return null; // Minimum 1k views

          const duration = this.parseDuration(details.contentDetails.duration);

          return {
            videoId: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            duration: duration,
            viewCount: viewCount,
            thumbnailUrl: item.snippet.thumbnails.medium.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: new Date(item.snippet.publishedAt),
          };
        })
        .filter((video): video is IVideo => video !== null)
        .sort((a, b) => {
          // Sort by relevance (combination of view count and recency)
          const scoreA =
            a.viewCount * 0.7 +
            ((Date.now() - a.publishedAt.getTime()) / (1000 * 60 * 60 * 24)) *
              0.3;
          const scoreB =
            b.viewCount * 0.7 +
            ((Date.now() - b.publishedAt.getTime()) / (1000 * 60 * 60 * 24)) *
              0.3;
          return scoreB - scoreA;
        })
        .slice(0, 3); // Return top 3 videos

      // Cache the results
      cacheManager.set(cacheKey, videos, 24 * 60 * 60 * 1000); // Cache for 24 hours

      return videos;
    } catch (error) {
      console.error("Error searching YouTube videos:", error);
      throw new Error("Failed to search YouTube videos");
    }
  }

  /**
   * Parse YouTube duration format (PT1H30M20S) to readable format
   */
  private parseDuration(duration: string): string {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const matches = duration.match(regex);

    if (!matches) return "0:00";

    const hours = parseInt(matches[1] || "0");
    const minutes = parseInt(matches[2] || "0");
    const seconds = parseInt(matches[3] || "0");

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
  }

  /**
   * Get video by ID
   */
  async getVideoById(videoId: string): Promise<IVideo | null> {
    const cacheKey = `youtube:video:${videoId}`;

    // Check cache first
    const cached = cacheManager.get<IVideo>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/videos?key=${this.apiKey}&id=${videoId}&part=snippet,contentDetails,statistics`
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.items.length === 0) {
        return null;
      }

      const item = data.items[0];

      const video: IVideo = {
        videoId: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        duration: this.parseDuration(item.contentDetails.duration),
        viewCount: parseInt(item.statistics.viewCount) || 0,
        thumbnailUrl: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: new Date(item.snippet.publishedAt),
      };

      // Cache the result
      cacheManager.set(cacheKey, video, 24 * 60 * 60 * 1000); // Cache for 24 hours

      return video;
    } catch (error) {
      console.error("Error getting YouTube video:", error);
      return null;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number; missRate: number } {
    return cacheManager.getStats();
  }
}
