"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from '@clerk/nextjs';
import { AssessmentResults } from "@/components/assessment-results";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    completedAt?: string;
    createdAt: string;
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
                // Refresh assessment data to show results
                loadAssessment();
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
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"
            >
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center"
                >
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"
                    />
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-gray-700 font-medium"
                    >
                        {checkingProfile ? "Checking profile..." : "Loading assessment..."}
                    </motion.p>
                </motion.div>
            </motion.div>
        );
    }

    if (error) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4"
            >
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
                >
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="text-red-600 text-6xl mb-4"
                    >
                        ⚠️
                    </motion.div>
                    <motion.h2 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-2xl font-bold text-gray-800 mb-4"
                    >
                        Error
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-gray-600 mb-6"
                    >
                        {error}
                    </motion.p>
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-3"
                    >
                        <Button
                            onClick={loadAssessment}
                            className="w-full bg-blue-600 hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
                        >
                            Try Again
                        </Button>
                        {error.includes("languages") && (
                            <Button
                                onClick={() => router.push("/complete-profile")}
                                className="w-full bg-green-600 hover:bg-green-700 transition-all duration-200 transform hover:scale-105"
                            >
                                Complete Profile
                            </Button>
                        )}
                    </motion.div>
                </motion.div>
            </motion.div>
        );
    }

    if (submitted || (assessment && assessment.isCompleted)) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className="max-w-2xl mx-auto"
                >
                    <AssessmentResults assessment={assessment || undefined} />
                </motion.div>
            </motion.div>
        );
    }

    if (!assessment || assessment.questions.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center"
            >
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className="text-center"
                >
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="text-6xl mb-4"
                    >
                        📋
                    </motion.div>
                    <motion.h2 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-xl font-semibold text-gray-700 mb-2"
                    >
                        No Assessment Available
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-gray-500"
                    >
                        Please check back later or contact support.
                    </motion.p>
                </motion.div>
            </motion.div>
        );
    }

    const question = assessment.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / assessment.totalQuestions) * 100;
    const allQuestionsAnswered = Object.keys(selectedAnswers).length === assessment.totalQuestions;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4"
        >
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
                className="max-w-4xl mx-auto"
            >
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                    className="bg-white rounded-2xl shadow-xl p-8"
                >
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="mb-8"
                    >
                        <motion.h1 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-3xl font-bold text-gray-800 mb-2"
                        >
                            Programming Assessment
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-gray-600"
                        >
                            Test your knowledge across different programming languages
                        </motion.p>
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentQuestion + 1) / assessment.questions.length) * 100}%` }}
                            transition={{ delay: 0.6, duration: 0.8 }}
                            className="mt-4 bg-gray-200 rounded-full h-3 overflow-hidden"
                        >
                            <motion.div 
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full"
                                initial={{ x: "-100%" }}
                                animate={{ x: "0%" }}
                                transition={{ delay: 0.6, duration: 0.8 }}
                            />
                        </motion.div>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="text-sm text-gray-500 mt-2"
                        >
                            Question {currentQuestion + 1} of {assessment.questions.length}
                        </motion.p>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentQuestion}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ type: "spring", stiffness: 100 }}
                            className="mb-8"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <motion.h2 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="text-xl font-semibold text-gray-800"
                                >
                                    {assessment.questions[currentQuestion].question}
                                </motion.h2>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                >
                                    <Badge className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                                        {assessment.questions[currentQuestion].language}
                                    </Badge>
                                </motion.div>
                            </div>

                            <div className="space-y-3">
                                {assessment.questions[currentQuestion].options.map((option, index) => (
                                    <motion.button
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + index * 0.1 }}
                                        onClick={() => handleAnswerSelect(index)}
                                        className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 transform hover:scale-102 hover:shadow-md ${
                                            selectedAnswers[currentQuestion] === index
                                                ? "border-blue-500 bg-blue-50 text-blue-800 shadow-lg"
                                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                                        {option}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="flex justify-between items-center"
                    >
                        <Button
                            onClick={handlePrevious}
                            disabled={currentQuestion === 0}
                            variant="outline"
                            className="px-6 py-2 border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            Previous
                        </Button>

                        {currentQuestion === assessment.questions.length - 1 ? (
                            <Button
                                onClick={handleSubmit}
                                disabled={Object.keys(selectedAnswers).length < assessment.questions.length}
                                className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                            >
                                Submit Assessment
                            </Button>
                        ) : (
                            <Button
                                onClick={handleNext}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105"
                            >
                                Next
                            </Button>
                        )}
                    </motion.div>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}