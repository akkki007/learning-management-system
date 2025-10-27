import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/nextjs/server";
import dbConnect from "@/lib/connectDB";
import User from "@/models/user.models";

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Check if user exists and has complete profile
    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      // User doesn't exist in database yet, create a basic profile
      try {
        const clerkClient = createClerkClient({
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        const clerkUser = await clerkClient.users.getUser(userId);

        user = await User.create({
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          username:
            clerkUser.username ||
            `${clerkUser.firstName || "User"}_${userId.slice(-6)}`,
          education: "",
          career: "",
          languagesKnown: [],
        });
      } catch (clerkError) {
        console.error("Error creating user from Clerk data:", clerkError);
        // Create a basic user profile without Clerk data as fallback
        try {
          // Generate a unique username with random suffix
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const username = `User_${randomSuffix}`;
          
          // Check if username already exists
          const existingUser = await User.findOne({ username });
          
          user = await User.create({
            clerkId: userId,
            email: userId, // Using userId as email to satisfy required field
            username: existingUser ? `User_${randomSuffix}_${Date.now().toString().slice(-6)}` : username,
            education: "",
            career: "",
            languagesKnown: [],
          });
        } catch (createError) {
          console.error("Error creating fallback user:", createError);
          return NextResponse.json({ hasProfile: false });
        }
      }
    }

    // Check if profile is complete
    const isComplete =
      user.education &&
      user.career &&
      user.languagesKnown &&
      user.languagesKnown.length > 0;

    return NextResponse.json({
      hasProfile: isComplete,
      user: isComplete
        ? {
            id: user._id,
            username: user.username,
            email: user.email,
            education: user.education,
            career: user.career,
            languagesKnown: user.languagesKnown,
          }
        : null,
    });
  } catch (error: unknown) {
    console.error("Error checking profile:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to check profile", details: errorMessage },
      { status: 500 }
    );
  }
}
