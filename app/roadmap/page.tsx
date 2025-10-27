"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

interface AssessmentResult {
  _id: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
  questions: {
    question: string;
    language: string;
    userAnswer: number;
    correctAnswer: number;
    options: string[];
  }[];
}

interface RoadmapItem {
  language: string;
  proficiency: string;
  score: number;
  recommendations: string[];
  nextSteps: string[];
}

export default function RoadmapPage() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAssessmentResults = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/assessment/results", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        router.push("/sign-in");
        return;
      }

      const data = await response.json();

      if (data.success && data.assessment) {
        setAssessment(data.assessment);
        generateRoadmap(data.assessment);
      } else {
        // No completed assessment found, redirect to dashboard
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error loading assessment results:", error);
      setError("Failed to load assessment results");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const generateRoadmap = (assessmentData: AssessmentResult) => {
    // Group questions by language and calculate scores
    const languageScores: { [key: string]: { correct: number; total: number; proficiency: string } } = {};

    assessmentData.questions.forEach((q) => {
      if (!languageScores[q.language]) {
        languageScores[q.language] = { correct: 0, total: 0, proficiency: "Beginner" };
      }
      languageScores[q.language].total++;
      if (q.userAnswer === q.correctAnswer) {
        languageScores[q.language].correct++;
      }
    });

    // Generate roadmap items
    const roadmapItems: RoadmapItem[] = Object.entries(languageScores).map(([language, data]) => {
      const score = Math.round((data.correct / data.total) * 100);
      
      let proficiencyLevel = "Beginner";
      let recommendations: string[] = [];
      let nextSteps: string[] = [];

      if (score >= 80) {
        proficiencyLevel = "Advanced";
        recommendations = [
          `Excellent work! You have strong ${language} skills.`,
          "Consider contributing to open source projects",
          "Explore advanced frameworks and libraries",
          "Mentor others in the community"
        ];
        nextSteps = [
          "Build complex projects",
          "Learn system design patterns",
          "Explore performance optimization",
          "Consider specialization areas"
        ];
      } else if (score >= 60) {
        proficiencyLevel = "Intermediate";
        recommendations = [
          `Good foundation in ${language}! Keep building on it.`,
          "Practice with real-world projects",
          "Learn best practices and design patterns",
          "Join developer communities"
        ];
        nextSteps = [
          "Build portfolio projects",
          "Learn testing frameworks",
          "Study code architecture",
          "Practice problem-solving"
        ];
      } else {
        proficiencyLevel = "Beginner";
        recommendations = [
          `Start with ${language} fundamentals`,
          "Practice basic syntax and concepts",
          "Follow structured learning paths",
          "Build simple projects"
        ];
        nextSteps = [
          "Complete basic tutorials",
          "Practice coding exercises",
          "Build small projects",
          "Join beginner-friendly communities"
        ];
      }

      return {
        language,
        proficiency: proficiencyLevel,
        score,
        recommendations,
        nextSteps
      };
    });

    setRoadmap(roadmapItems);
  };

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    loadAssessmentResults();
  }, [isSignedIn, router, loadAssessmentResults]);

  const retakeAssessment = () => {
    // Allow retaking by clearing the completed assessment
    fetch("/api/assessment/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }).then(() => {
      router.push("/dashboard");
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your learning roadmap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Your Learning Roadmap</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, {user?.firstName || user?.username || 'there'}! Here&apos;s your personalized learning path.
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{assessment?.score}%</div>
              <p className="text-sm text-gray-600">Overall Score</p>
            </div>
          </div>
        </div>

        {/* Assessment Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Assessment Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{assessment?.totalQuestions}</div>
              <p className="text-sm text-gray-600">Total Questions</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {assessment ? Math.round((assessment.score / 100) * assessment.totalQuestions) : 0}
              </div>
              <p className="text-sm text-gray-600">Correct Answers</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{roadmap.length}</div>
              <p className="text-sm text-gray-600">Languages Assessed</p>
            </div>
          </div>
        </div>

        {/* Roadmap Items */}
        <div className="space-y-6">
          {roadmap.map((item, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{item.language}</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    item.proficiency === 'Advanced' ? 'bg-green-100 text-green-800' :
                    item.proficiency === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.proficiency} Level
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{item.score}%</div>
                  <p className="text-sm text-gray-600">Score</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Recommendations</h4>
                  <ul className="space-y-2">
                    {item.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span className="text-gray-600 text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Next Steps</h4>
                  <ul className="space-y-2">
                    {item.nextSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-500 mr-2">→</span>
                        <span className="text-gray-600 text-sm">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-8 text-center">
          <button
            onClick={retakeAssessment}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition mr-4"
          >
            Retake Assessment
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}