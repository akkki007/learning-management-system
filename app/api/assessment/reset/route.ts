import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/connectDB";
import User from "@/models/user.models";
import Assessment from "@/models/assesment.models";

export async function POST() {
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

    // Delete all existing assessments for this user
    await Assessment.deleteMany({ userId: user._id });

    return NextResponse.json({
      success: true,
      message:
        "Assessment reset successfully. You can now take a new assessment.",
    });
  } catch (error: unknown) {
    console.error("Error resetting assessment:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to reset assessment", details: errorMessage },
      { status: 500 }
    );
  }
}
