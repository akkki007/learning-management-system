import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/connectDB";
import User from "@/models/user.models";
import Assessment from "@/models/assesment.models";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get user from database
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the most recent completed assessment
    const assessment = await Assessment.findOne({
      userId: user._id,
      isCompleted: true,
    }).sort({ completedAt: -1 });

    if (!assessment) {
      return NextResponse.json({
        success: false,
        message: "No completed assessment found",
      });
    }

    return NextResponse.json({
      success: true,
      assessment: {
        _id: assessment._id,
        score: assessment.score,
        totalQuestions: assessment.totalQuestions,
        completedAt: assessment.completedAt,
        questions: assessment.questions,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching assessment results:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch assessment results", details: errorMessage },
      { status: 500 }
    );
  }
}
