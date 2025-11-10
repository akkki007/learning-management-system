import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/connectDB";
import Course from "@/models/course.models";
import Assessment from "@/models/assesment.models";
import User from "@/models/user.models";
import { YouTubeService } from "@/lib/youtube-service";

// Create YouTube service instance
const youtubeService = new YouTubeService(process.env.YOUTUBE_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Get user from database
    const user = await User.findOne({ clerkId: userId });
    console.log("User lookup - Clerk ID:", userId);
    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      console.error("User not found in database for Clerk ID:", userId);
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
          details: "Please complete your profile first",
        },
        { status: 404 }
      );
    }

    // Check if roadmap already exists
    const existingCourse = await Course.findOne({ userId });
    if (existingCourse) {
      return NextResponse.json({
        success: true,
        message: "Roadmap already exists",
        courseId: existingCourse._id,
      });
    }

    // Get the user's completed assessment
    const assessment = await Assessment.findOne({
      userId: user._id,
      isCompleted: true,
    }).sort({ completedAt: -1 });

    console.log("Assessment found:", assessment ? "Yes" : "No");
    console.log("User ID:", user._id);

    if (!assessment) {
      console.error("No completed assessment found for user:", userId);
      return NextResponse.json(
        {
          success: false,
          error: "Please complete the assessment first",
          details: "No completed assessment found in database",
        },
        { status: 400 }
      );
    }

    // Get user's programming languages from profile
    const languages = user.languagesKnown || [];

    console.log("Programming languages found:", languages.length);
    console.log("Languages:", JSON.stringify(languages));

    if (languages.length === 0) {
      console.error("No programming languages found for user:", userId);
      return NextResponse.json(
        {
          success: false,
          error: "No programming languages found in profile",
          details: "Please complete your profile with programming languages",
        },
        { status: 400 }
      );
    }

    // Generate modules based on languages and assessment score
    const modules = [];
    let moduleOrder = 0;

    for (const lang of languages) {
      const langName = lang.name;
      const proficiency = lang.proficiency || "Beginner";

      // Define topics based on proficiency
      const topics = getTopicsForLanguage(langName, proficiency);
      const chapters = [];

      for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];
        const chapterOrder = i;

        // Search for educational videos for this topic
        try {
          const videos = await youtubeService.searchEducationalVideos({
            query: `${langName} ${topic} tutorial`,
            maxResults: 3,
            order: "relevance",
            videoDuration: "medium",
          });

          if (videos.length > 0) {
            chapters.push({
              title: topic,
              description: `Learn ${topic} in ${langName}`,
              estimatedTime: 45,
              difficulty: proficiency,
              videos: videos.map((video) => ({
                videoId: video.videoId,
                title: video.title,
                description: video.description,
                duration: video.duration,
                viewCount: video.viewCount,
                thumbnailUrl: video.thumbnailUrl,
                channelTitle: video.channelTitle,
                publishedAt: video.publishedAt,
              })),
              selectedVideoId: videos[0].videoId,
              isCompleted: false,
              order: chapterOrder,
            });
          }
        } catch (error) {
          console.error(`Error fetching videos for ${topic}:`, error);
        }
      }

      if (chapters.length > 0) {
        modules.push({
          title: `${langName} Fundamentals`,
          description: `Master the fundamentals of ${langName} programming`,
          order: moduleOrder++,
          estimatedDuration: Math.ceil(chapters.length * 0.75),
          prerequisites: [],
          chapters,
          completed: [],
        });
      }
    }

    if (modules.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate roadmap modules" },
        { status: 500 }
      );
    }

    // Create the course
    const course = await Course.create({
      userId,
      modules,
    });

    return NextResponse.json({
      success: true,
      message: "Roadmap generated successfully",
      courseId: course._id,
    });
  } catch (error) {
    console.error("Error generating roadmap:", error);
    return NextResponse.json(
      { error: "Failed to generate roadmap" },
      { status: 500 }
    );
  }
}

// Helper function to get topics based on language and proficiency
function getTopicsForLanguage(language: string, proficiency: string): string[] {
  const topicMap: Record<string, Record<string, string[]>> = {
    JavaScript: {
      Beginner: [
        "Variables and Data Types",
        "Functions and Scope",
        "Arrays and Objects",
        "DOM Manipulation",
      ],
      Intermediate: [
        "Async Programming",
        "ES6+ Features",
        "Error Handling",
        "Modules",
      ],
      Advanced: [
        "Design Patterns",
        "Performance Optimization",
        "Testing",
        "Advanced Async",
      ],
    },
    Python: {
      Beginner: [
        "Variables and Data Types",
        "Functions",
        "Lists and Dictionaries",
        "File Handling",
      ],
      Intermediate: [
        "OOP Concepts",
        "Decorators",
        "Generators",
        "Error Handling",
      ],
      Advanced: [
        "Metaclasses",
        "Concurrency",
        "Testing",
        "Performance Optimization",
      ],
    },
    Java: {
      Beginner: [
        "Variables and Data Types",
        "OOP Basics",
        "Collections",
        "Exception Handling",
      ],
      Intermediate: ["Generics", "Streams API", "Multithreading", "JDBC"],
      Advanced: [
        "Design Patterns",
        "JVM Internals",
        "Concurrency",
        "Performance Tuning",
      ],
    },
  };

  const langTopics = topicMap[language];
  if (!langTopics) {
    return ["Basics", "Intermediate Concepts", "Advanced Topics"];
  }

  return langTopics[proficiency] || langTopics.Beginner;
}
