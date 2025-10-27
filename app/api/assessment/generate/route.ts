import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import dbConnect from "@/lib/connectDB";
import User from "@/models/user.models";
import Assessment from "@/models/assesment.models";

export async function POST() {
  try {
    // Get Clerk user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get user data from database using clerkId
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json(
        {
          error: "User profile not found. Please complete your registration.",
        },
        { status: 404 }
      );
    }

    // Check if user has languages set
    if (!user.languagesKnown || user.languagesKnown.length === 0) {
      return NextResponse.json(
        { error: "No languages found. Please update your profile." },
        { status: 400 }
      );
    }

    // Check if user already has a completed assessment
    const completedAssessment = await Assessment.findOne({
      userId: user._id,
      isCompleted: true,
    });

    if (completedAssessment) {
      return NextResponse.json({
        success: false,
        error: "Assessment already completed",
        redirect: "/roadmap",
      });
    }

    // Check if user already has a pending assessment
    const existingAssessment = await Assessment.findOne({
      userId: user._id,
      isCompleted: false,
    });

    if (existingAssessment) {
      return NextResponse.json({
        success: true,
        assessment: existingAssessment,
      });
    }

    // Generate questions using DeepSeek
    const questions = await generateQuestionsWithDeepSeek(user.languagesKnown);

    // Create new assessment
    const assessment = await Assessment.create({
      userId: user._id,
      questions: questions,
      totalQuestions: questions.length,
      isCompleted: false,
    });

    return NextResponse.json({
      success: true,
      assessment: assessment,
    });
  } catch (error: unknown) {
    console.error("Error generating assessment:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to generate assessment", details: errorMessage },
      { status: 500 }
    );
  }
}

interface Language {
  name: string;
  proficiency: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

async function generateQuestionsWithDeepSeek(languages: Language[]) {
  const allQuestions = [];

  for (const lang of languages) {
    const prompt = `Generate 10 multiple choice questions to assess ${lang.proficiency} level knowledge of ${lang.name} programming language.

Format your response as a JSON array with this exact structure:
[
  {
    "question": "What is the question?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "language": "${lang.name}"
  }
]

Requirements:
- Questions should match ${lang.proficiency} difficulty level
- Each question must have exactly 4 options
- correctAnswer should be the index (0-3) of the correct option
- Return ONLY the JSON array, no additional text or explanation
- Make questions practical and relevant to real programming scenarios`;

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer":
              process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
            "X-Title": "Assessment Generator",
          },
          body: JSON.stringify({
            model: "deepseek/deepseek-chat-v3.1",
            messages: [
              {
                role: "system",
                content:
                  "You are an expert programming instructor. Generate high-quality multiple choice questions for programming language assessments. Always respond with valid JSON only.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `OpenRouter API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content received from API");
      }

      // Clean the response to extract JSON
      let cleanContent = content.trim();

      // Remove markdown code blocks if present
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent
          .replace(/```json\n?/, "")
          .replace(/\n?```$/, "");
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent
          .replace(/```\n?/, "")
          .replace(/\n?```$/, "");
      }

      const questions = JSON.parse(cleanContent);

      // Validate and add questions
      if (Array.isArray(questions)) {
        // Validate each question structure
        const validQuestions = questions.filter(
          (q) =>
            q.question &&
            Array.isArray(q.options) &&
            q.options.length === 4 &&
            typeof q.correctAnswer === "number" &&
            q.correctAnswer >= 0 &&
            q.correctAnswer < 4
        );

        allQuestions.push(...validQuestions);
      }
    } catch (error) {
      console.error(`Error generating questions for ${lang.name}:`, error);
      // Add fallback questions if API fails
      const fallbackQuestions = generateFallbackQuestions(lang);
      allQuestions.push(...fallbackQuestions);
    }
  }

  return allQuestions;
}

function generateFallbackQuestions(lang: Language) {
  const baseQuestions = [
    {
      question: `What is your current proficiency level with ${lang.name}?`,
      options: ["Beginner", "Intermediate", "Advanced", "Expert"],
      correctAnswer: ["Beginner", "Intermediate", "Advanced", "Expert"].indexOf(
        lang.proficiency
      ),
      language: lang.name,
    },
    {
      question: `Which of the following best describes ${lang.name}?`,
      options: [
        "A programming language",
        "A database system",
        "An operating system",
        "A web browser",
      ],
      correctAnswer: 0,
      language: lang.name,
    },
    {
      question: `What type of applications can be built with ${lang.name}?`,
      options: [
        "Only web applications",
        "Only mobile applications",
        "Various types of applications",
        "Only desktop applications",
      ],
      correctAnswer: 2,
      language: lang.name,
    },
  ];

  return baseQuestions;
}
