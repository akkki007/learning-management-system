"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from '@clerk/nextjs';

interface Question {
    question: string;
    options: string[];
    correctAnswer: number;
    userAnswer?: number;
    language: string;
}

interface Assessment {
    _id: string;
    questions: Question[];
    totalQuestions: number;
    isCompleted: boolean;
    score?: number;
}

export default function AssessmentDashboard() {
    const router = useRouter();
    const { isSignedIn, user } = useUser();
    const [assessment, setAssessment] = useState<Assessment | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string>("");
    const [checkingProfile, setCheckingProfile] = useState(false);

    const getAuthHeaders = useCallback(() => {
        return {
            "Content-Type": "application/json",
        };
    }, []);

     const loadAssessment = useCallback(async () => {
        if (!isSignedIn || !user) {
            router.push("/sign-in");
            return;
        }

        try {
            setLoading(true);
            setCheckingProfile(true);
            setError("");
            
            // First check if user has completed their profile
            const profileResponse = await fetch("/api/user/check-profile", {
                method: "POST",
                headers: getAuthHeaders(),
            });

            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                if (!profileData.hasProfile) {
                    router.push("/complete-profile");
                    return;
                }
            }
            
            setCheckingProfile(false);
            
            const response = await fetch("/api/assessment/generate", {
                method: "POST",
                headers: getAuthHeaders(),
            });

            if (response.status === 401) {
                router.push("/sign-in");
                return;
            }

            const data = await response.json();
            
            if (data.success) {
                setAssessment(data.assessment);
                if (data.assessment.isCompleted) {
                    setSubmitted(true);
                }
            } else {
                // Handle specific case where assessment is already completed
                if (data.redirect === "/roadmap") {
                    router.push("/roadmap");
                    return;
                } else if (data.error?.includes("User profile not found")) {
                    router.push("/complete-profile");
                    return;
                } else if (data.error?.includes("No languages found")) {
                    setError("Please set up your programming languages in your profile before taking the assessment.");
                } else {
                    setError(data.error || "Failed to load assessment");
                }
            }
        } catch (error) {
            console.error("Error loading assessment:", error);
            setError("Failed to connect to the server");
        } finally {
            setLoading(false);
            setCheckingProfile(false);
        }
    },[router, isSignedIn, user, getAuthHeaders]);

    useEffect(() => {
        if (isSignedIn) {
            loadAssessment();
        } else {
            router.push("/sign-in");
        }
    }, [loadAssessment, router, isSignedIn]);



   

    const handleAnswerSelect = (answerIndex: number) => {
        setSelectedAnswers({
            ...selectedAnswers,
            [currentQuestion]: answerIndex
        });
    };

    const handleNext = () => {
        if (assessment && currentQuestion < assessment.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleSubmit = async () => {
        if (!assessment) return;

        try {
            const answers = Object.entries(selectedAnswers).map(([questionIndex, answer]) => ({
                questionIndex: parseInt(questionIndex),
                answer: answer
            }));

            const response = await fetch("/api/assessment/submit", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    assessmentId: assessment._id,
                    answers: answers
                })
            });

            if (response.status === 401) {
                router.push("/sign-in");
                return;
            }

            const data = await response.json();
            
            if (data.success) {
                // Redirect to roadmap after successful submission
                router.push("/roadmap");
            } else {
                setError(data.error || "Failed to submit assessment");
            }
        } catch (error) {
            console.error("Error submitting assessment:", error);
            setError("Failed to submit assessment");
        }
    };

    if (loading || checkingProfile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">
                        {checkingProfile ? "Checking profile..." : "Loading assessment..."}
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <div className="text-red-600 text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="space-y-3">
                        <button
                            onClick={loadAssessment}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Try Again
                        </button>
                        {error.includes("languages") && (
                            <button
                                onClick={() => router.push("/complete-profile")}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition ml-3"
                            >
                                Complete Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (submitted && assessment) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <div className="mb-6">
                        <div className="text-6xl font-bold text-blue-600 mb-2">
                            {assessment.score}%
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Assessment Complete!</h2>
                    </div>
                    <p className="text-gray-600 mb-6">
                        You answered {Math.round((assessment.score! / 100) * assessment.totalQuestions)} out of {assessment.totalQuestions} questions correctly.
                    </p>
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

    if (!assessment || assessment.questions.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">No assessment available</p>
                </div>
            </div>
        );
    }

    const question = assessment.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / assessment.totalQuestions) * 100;
    const allQuestionsAnswered = Object.keys(selectedAnswers).length === assessment.totalQuestions;

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-3xl mx-auto py-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Language Assessment</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Welcome back, {user?.firstName || user?.username || 'there'}!
                            </p>
                        </div>
                        <span className="text-sm text-gray-600">
                            Question {currentQuestion + 1} of {assessment.totalQuestions}
                        </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    {/* Answered Questions Counter */}
                    <div className="mt-2 text-sm text-gray-600">
                        Answered: {Object.keys(selectedAnswers).length} / {assessment.totalQuestions}
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-white rounded-lg shadow-md p-8">
                    <div className="mb-2">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                            {question.language}
                        </span>
                    </div>
                    
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">
                        {question.question}
                    </h2>

                    {/* Options */}
                    <div className="space-y-3">
                        {question.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(index)}
                                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                    selectedAnswers[currentQuestion] === index
                                        ? "border-blue-600 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                <div className="flex items-center">
                                    <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                                        selectedAnswers[currentQuestion] === index
                                            ? "border-blue-600 bg-blue-600"
                                            : "border-gray-300"
                                    }`}>
                                        {selectedAnswers[currentQuestion] === index && (
                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-gray-700">{option}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-6">
                    <button
                        onClick={handlePrevious}
                        disabled={currentQuestion === 0}
                        className="px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        Previous
                    </button>

                    {currentQuestion === assessment.totalQuestions - 1 ? (
                        <button
                            onClick={handleSubmit}
                            disabled={!allQuestionsAnswered}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                            title={!allQuestionsAnswered ? "Please answer all questions before submitting" : ""}
                        >
                            Submit Assessment
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            Next
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}