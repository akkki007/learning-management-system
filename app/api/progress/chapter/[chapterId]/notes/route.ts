import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/connectDB";
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
    const { id, timestamp, content } = await request.json();

    if (!chapterId || !content) {
      return NextResponse.json(
        { error: "Chapter ID and note content are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const note = {
      id: id || Date.now().toString(),
      timestamp: timestamp || 0,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    // Update user progress with new note
    const progress = await UserProgress.findOneAndUpdate(
      { userId, chapterId },
      {
        $push: {
          notes: note,
        },
        $set: {
          lastAccessedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      note,
      notes: progress.notes,
    });
  } catch (error) {
    console.error("Error adding note:", error);
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}

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
      notes: (progress as Record<string, unknown> | null)?.notes || [],
      videoProgress:
        (progress as Record<string, unknown> | null)?.videoProgress || 0,
    });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}
