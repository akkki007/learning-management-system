import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/connectDB";
import { UserProgress } from "@/models/userProgress.models";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chapterId } = await params;
    if (!chapterId) {
      return NextResponse.json(
        { error: "Chapter ID is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const progress = await UserProgress.findOne({
      userId,
      chapterId,
    }).lean();

    return NextResponse.json({
      success: true,
      progress: progress
        ? {
            videoProgress: (progress as Record<string, unknown>).videoProgress,
            completedVideos: (progress as Record<string, unknown>)
              .completedVideos,
            notes: (progress as Record<string, unknown>).notes,
            lastAccessedAt: (progress as Record<string, unknown>)
              .lastAccessedAt,
            isCompleted: (progress as Record<string, unknown>).isCompleted,
            timeSpent: (progress as Record<string, unknown>).timeSpent,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
