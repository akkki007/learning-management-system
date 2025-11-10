import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/connectDB";
import Course from "@/models/course.models";
import { UserProgress } from "@/models/userProgress.models";

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
    if (!chapterId) {
      return NextResponse.json(
        { error: "Chapter ID is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the course and update chapter completion
    const course = await Course.findOne({
      "modules.chapters._id": chapterId,
    });

    if (!course) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    // Update the chapter as completed
    let chapterUpdated = false;
    for (const courseModule of course.modules) {
      const chapter = courseModule.chapters.find(
        (c) =>
          (c as unknown as { _id: { toString: () => string } })._id.toString() === chapterId
      );
      if (
        chapter &&
        !(chapter as unknown as Record<string, unknown>).isCompleted
      ) {
        (chapter as unknown as Record<string, unknown>).isCompleted = true;
        (chapter as unknown as Record<string, unknown>).completedAt =
          new Date();
        chapterUpdated = true;
        break;
      }
    }

    if (chapterUpdated) {
      await course.save();
    }

    // Update user progress
    await UserProgress.findOneAndUpdate(
      { userId, chapterId },
      {
        $set: {
          isCompleted: true,
          completedAt: new Date(),
          videoProgress: 100,
        },
      },
      { upsert: true, new: true }
    );

    // Calculate course progress
    const totalChapters = course.modules.reduce(
      (total: number, courseModule) => total + courseModule.chapters.length,
      0
    );

    const completedChapters = course.modules.reduce(
      (total: number, courseModule) =>
        total + courseModule.chapters.filter((c) => c.isCompleted).length,
      0
    );

    const courseProgress = Math.round(
      (completedChapters / totalChapters) * 100
    );

    return NextResponse.json({
      success: true,
      message: "Chapter completed successfully",
      progress: {
        chapterProgress: 100,
        courseProgress,
        completedChapters,
        totalChapters,
      },
    });
  } catch (error) {
    console.error("Error completing chapter:", error);
    return NextResponse.json(
      { error: "Failed to complete chapter" },
      { status: 500 }
    );
  }
}
