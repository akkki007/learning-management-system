import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/nextjs/server";
import dbConnect from "@/lib/connectDB";
import User from "@/models/user.models";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { education, career, languagesKnown } = await req.json();

    if (
      !education ||
      !career ||
      !languagesKnown ||
      languagesKnown.length === 0
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user exists in database
    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      // User doesn't exist in database, get user info from Clerk and create them
      try {
        const clerkClient = createClerkClient({
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        const clerkUser = await clerkClient.users.getUser(userId);

        // Create new user in database
        user = await User.create({
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          username:
            clerkUser.username ||
            `${clerkUser.firstName || "User"}_${userId.slice(-6)}`,
          education,
          career,
          languagesKnown,
        });
      } catch (clerkError) {
        console.error("Error fetching user from Clerk:", clerkError);
        // Create user with basic info as fallback
        try {
          user = await User.create({
            clerkId: userId,
            email: "",
            username: `User_${userId.slice(-6)}`,
            education,
            career,
            languagesKnown,
          });
        } catch (createError) {
          console.error("Error creating fallback user:", createError);
          return NextResponse.json(
            { error: "Failed to create user profile" },
            { status: 500 }
          );
        }
      }
    } else {
      // User exists, update their profile
      user = await User.findOneAndUpdate(
        { clerkId: userId },
        {
          education,
          career,
          languagesKnown,
        },
        { new: true }
      );
    }

    // Ensure user is not null before accessing properties
    if (!user) {
      return NextResponse.json(
        { error: "Failed to create or update user profile" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: "Profile completed successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        education: user.education,
        career: user.career,
        languagesKnown: user.languagesKnown,
      },
    });
  } catch (error: unknown) {
    console.error("Error completing profile:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to complete profile", details: errorMessage },
      { status: 500 }
    );
  }
}
