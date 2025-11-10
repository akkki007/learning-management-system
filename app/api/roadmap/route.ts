import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/connectDB";
import Course from "@/models/course.models";

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Find the user's course/roadmap
    let course = await Course.findOne({ userId }).lean();

    if (!course) {
      // Try to generate roadmap automatically
      const generateResponse = await fetch(
        `${request.nextUrl.origin}/api/roadmap/generate`,
        {
          method: "POST",
          headers: {
            ...Object.fromEntries(request.headers),
          },
        }
      );

      if (generateResponse.ok) {
        // Fetch the newly created course
        course = await Course.findOne({ userId }).lean();
      }

      if (!course) {
        return NextResponse.json(
          {
            success: false,
            message: "No roadmap found. Please complete your assessment first.",
          },
          { status: 404 }
        );
      }
    }

    // Calculate total duration
    const totalDuration = course.modules.reduce(
      (total, courseModule) =>
        total + (courseModule.estimatedDuration || 0) * 60,
      0
    );

    // Transform the course data to match the frontend interface
    const roadmap = {
      _id: course._id,
      title: "Your Personalized Learning Path",
      description: "A customized roadmap based on your assessment results",
      modules: course.modules.map((courseModule) => ({
        _id: (courseModule as unknown as Record<string, unknown>)._id,
        title: courseModule.title,
        description: courseModule.description,
        chapters: courseModule.chapters.map((chapter) => ({
          _id: (chapter as unknown as Record<string, unknown>)._id,
          title: chapter.title,
          description: chapter.description,
          videos: chapter.videos.map((video) => ({
            id: video.videoId,
            title: video.title,
            description: video.description,
            duration: video.duration,
            viewCount: video.viewCount.toString(),
            thumbnail: video.thumbnailUrl,
            channel: video.channelTitle,
            publishedAt: video.publishedAt.toString(),
          })),
          selectedVideoId: chapter.selectedVideoId,
          estimatedTime: chapter.estimatedTime,
          difficulty: chapter.difficulty.toLowerCase() as
            | "beginner"
            | "intermediate"
            | "advanced",
          isCompleted: chapter.isCompleted,
          completedAt: chapter.completedAt?.toString(),
          order: chapter.order,
        })),
        order: courseModule.order,
        estimatedDuration: courseModule.estimatedDuration || 0,
        prerequisites: courseModule.prerequisites || [],
      })),
      totalDuration,
      difficulty: "intermediate" as const,
      tags: [],
      createdAt:
        (course as unknown as Record<string, unknown>).createdAt?.toString() ||
        new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      roadmap,
    });
  } catch (error) {
    console.error("Error fetching roadmap:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch roadmap" },
      { status: 500 }
    );
  }
}
