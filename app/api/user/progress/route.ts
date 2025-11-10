import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/connectDB";
import Course from "@/models/course.models";
import { UserProgress } from "@/models/userProgress.models";

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Find the user's course
    const course = await Course.findOne({ userId }).lean();

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: "No course found",
        },
        { status: 404 }
      );
    }

    // Get all user progress records for this course
    const progressRecords = await UserProgress.find({ userId }).lean();

    // Calculate overall progress
    const allChapters: string[] = [];
    const completedChapters: string[] = [];

    course.modules.forEach((courseModule) => {
      courseModule.chapters.forEach((chapter) => {
        const chapterId = (
          chapter as unknown as Record<string, unknown>
        )._id?.toString();
        if (chapterId) {
          allChapters.push(chapterId);

          // Check if chapter is completed in progress records
          const chapterProgress = progressRecords.find(
            (p) => p.chapterId === chapterId
          );

          if (chapterProgress?.isCompleted || chapter.isCompleted) {
            completedChapters.push(chapterId);
          }
        }
      });
    });

    const overallProgress =
      allChapters.length > 0
        ? Math.round((completedChapters.length / allChapters.length) * 100)
        : 0;

    // Calculate total time spent
    const totalTimeSpent = progressRecords.reduce(
      (total, record) => total + (record.timeSpent || 0),
      0
    );

    // Find current chapter (last accessed)
    const lastAccessedProgress = progressRecords
      .filter((p) => p.lastAccessedAt)
      .sort(
        (a, b) =>
          new Date(b.lastAccessedAt).getTime() -
          new Date(a.lastAccessedAt).getTime()
      )[0];

    const currentChapter =
      lastAccessedProgress?.chapterId || allChapters[0] || "";

    const progress = {
      completedChapters,
      currentChapter,
      overallProgress,
      totalTimeSpent,
      lastAccessed:
        lastAccessedProgress?.lastAccessedAt?.toString() ||
        new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error("Error fetching user progress:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
