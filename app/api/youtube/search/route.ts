import { NextRequest, NextResponse } from "next/server";
import { YouTubeService } from "@/lib/youtube-service";
import { auth } from "@clerk/nextjs/server";

// Initialize YouTube service with API key from environment
const youtubeService = new YouTubeService(process.env.YOUTUBE_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { query, maxResults = 3, order = "relevance", videoDuration = "medium" } = body;

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Search for educational videos
    const videos = await youtubeService.searchEducationalVideos({
      query,
      maxResults,
      order,
      videoDuration,
    });

    return NextResponse.json({
      success: true,
      videos,
      count: videos.length,
    });
  } catch (error) {
    console.error("YouTube API error:", error);
    
    if (error instanceof Error && error.message.includes("API key")) {
      return NextResponse.json(
        { error: "YouTube API configuration error" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to search YouTube videos" },
      { status: 500 }
    );
  }
}

// GET endpoint for cache statistics
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const stats = youtubeService.getCacheStats();
    
    return NextResponse.json({
      success: true,
      cacheStats: stats,
    });
  } catch (error) {
    console.error("Cache stats error:", error);
    return NextResponse.json(
      { error: "Failed to get cache statistics" },
      { status: 500 }
    );
  }
}