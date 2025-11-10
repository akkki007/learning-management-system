import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/connectDB";
import Course from "@/models/course.models";
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

    // Find the course containing this chapter
    const course = await Course.findOne({
      "modules.chapters._id": chapterId,
    }).lean();

    if (!course) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Find the specific chapter
    let chapter = null;
    for (const courseModule of course.modules) {
      const chapters = courseModule.chapters as unknown as Record<
        string,
        unknown
      >[];
      const foundChapter = chapters.find(
        (c) => (c._id as { toString: () => string }).toString() === chapterId
      );
      if (foundChapter) {
        chapter = {
          ...foundChapter,
          moduleId: (courseModule as unknown as Record<string, unknown>)._id,
          moduleTitle: (courseModule as unknown as Record<string, unknown>)
            .title,
        };
        break;
      }
    }

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Get user progress for this chapter
    const userProgress = await UserProgress.findOne({
      userId,
      chapterId,
    }).lean();

    return NextResponse.json({
      success: true,
      course: {
        _id: course._id,
        title: (course as Record<string, unknown>).title,
        description: (course as Record<string, unknown>).description,
        modules: course.modules.map(
          (courseModule: Record<string, unknown>) => ({
            _id: courseModule._id,
            title: courseModule.title,
            description: courseModule.description,
            order: courseModule.order,
            estimatedDuration: courseModule.estimatedDuration,
            prerequisites: courseModule.prerequisites,
            chapters: (courseModule.chapters as Record<string, unknown>[]).map(
              (c) => ({
                _id: c._id,
                title: c.title,
                description: c.description,
                videos: c.videos,
                selectedVideoId: c.selectedVideoId,
                estimatedTime: c.estimatedTime,
                difficulty: c.difficulty,
                isCompleted: c.isCompleted,
                completedAt: c.completedAt,
                order: c.order,
              })
            ),
          })
        ),
      },
      chapter,
      userProgress: userProgress
        ? {
            videoProgress: (userProgress as Record<string, unknown>)
              .videoProgress,
            completedVideos: (userProgress as Record<string, unknown>)
              .completedVideos,
            notes: (userProgress as Record<string, unknown>).notes,
            lastAccessedAt: (userProgress as Record<string, unknown>)
              .lastAccessedAt,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching chapter data:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapter data" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chapterId } = await params;
    const { videoId, completionPercentage, timestamp } = await request.json();

    if (!chapterId || !videoId) {
      return NextResponse.json(
        { error: "Chapter ID and Video ID are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Update user progress
    const progress = await UserProgress.findOneAndUpdate(
      { userId, chapterId },
      {
        $set: {
          videoProgress: completionPercentage,
          lastAccessedAt: new Date(),
          currentVideoId: videoId,
          currentTimestamp: timestamp || 0,
        },
        $addToSet: {
          completedVideos: {
            videoId,
            completedAt: completionPercentage === 100 ? new Date() : null,
          },
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      progress: {
        videoProgress: progress.videoProgress,
        completedVideos: progress.completedVideos,
        lastAccessedAt: progress.lastAccessedAt,
      },
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
