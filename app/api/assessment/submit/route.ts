import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/connectDB";
import Assessment from "@/models/assesment.models";
import User from "@/models/user.models";

export async function POST(req: NextRequest) {
  try {
    // Get Clerk user
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

    const { assessmentId, answers } = await req.json();

    if (!assessmentId || !answers) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find assessment and verify it belongs to the user
    const assessment = await Assessment.findById(assessmentId);

    if (!assessment) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // Verify the assessment belongs to the logged-in user
    if (assessment.userId.toString() !== user._id?.toString()) {
      return NextResponse.json(
        { error: "Unauthorized access to this assessment" },
        { status: 403 }
      );
    }

    if (assessment.isCompleted) {
      return NextResponse.json(
        { error: "Assessment already completed" },
        { status: 400 }
      );
    }

    // Submit answers and calculate score
    assessment.submitAnswers(answers);
    await assessment.save();

    return NextResponse.json({
      success: true,
      score: assessment.score,
      totalQuestions: assessment.totalQuestions,
      assessment: assessment,
    });
  } catch (error: unknown) {
    console.error("Error submitting assessment:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to submit assessment", details: errorMessage },
      { status: 500 }
    );
  }
}
