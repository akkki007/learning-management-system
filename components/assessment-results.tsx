"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

interface AssessmentResultsProps {
  assessment?: Assessment;
  loading?: boolean;
}

export function AssessmentResults({ assessment, loading = false }: AssessmentResultsProps) {
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [languageBreakdown, setLanguageBreakdown] = useState<Record<string, { correct: number; total: number }>>({});

  useEffect(() => {
    if (assessment && assessment.questions) {
      let correct = 0;
      let incorrect = 0;
      const breakdown: Record<string, { correct: number; total: number }> = {};

      assessment.questions.forEach((question) => {
        const lang = question.language;
        if (!breakdown[lang]) {
          breakdown[lang] = { correct: 0, total: 0 };
        }
        breakdown[lang].total++;

        if (question.userAnswer !== undefined && question.userAnswer === question.correctAnswer) {
          correct++;
          breakdown[lang].correct++;
        } else {
          incorrect++;
        }
      });

      setCorrectAnswers(correct);
      setIncorrectAnswers(incorrect);
      setLanguageBreakdown(breakdown);
    }
  }, [assessment]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
          </CardHeader>
          <CardContent>
            <div className="h-32 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assessment) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No assessment results available</p>
            <p className="text-sm mt-2">Complete an assessment to view your results here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const scorePercentage = assessment.score || 0;
  const completionDate = assessment.completedAt ? new Date(assessment.completedAt).toLocaleDateString() : "Not completed";

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Improvement";
    return "Requires Review";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Overall Score Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
      >
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl font-bold text-gray-800">Assessment Results</CardTitle>
                <CardDescription className="text-gray-600">
                  Completed on {completionDate}
                </CardDescription>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <Badge 
                  variant={scorePercentage >= 80 ? "default" : scorePercentage >= 60 ? "secondary" : "destructive"}
                  className="text-lg px-3 py-1"
                >
                  {getScoreBadge(scorePercentage)}
                </Badge>
              </motion.div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 150 }}
                className={`text-6xl font-bold mb-2 ${getScoreColor(scorePercentage)}`}
              >
                {scorePercentage}%
              </motion.div>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                className="bg-gray-200 rounded-full h-4 mb-2 overflow-hidden"
              >
                <motion.div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full"
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                />
              </motion.div>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-sm text-gray-500 mt-2"
              >
                {correctAnswers} correct out of {assessment.totalQuestions} questions
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 gap-4 mt-6"
            >
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
                <div className="text-sm text-green-700">Correct</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">{incorrectAnswers}</div>
                <div className="text-sm text-red-700">Incorrect</div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Language Breakdown */}
      {Object.keys(languageBreakdown).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <CardTitle>Performance by Language</CardTitle>
              </motion.div>
              <CardDescription>
                Your proficiency across different programming languages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(languageBreakdown).map(([language, stats], index) => {
                  const percentage = Math.round((stats.correct / stats.total) * 100);
                  return (
                    <motion.div
                      key={language}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">{language}</span>
                        <Badge 
                          variant={percentage >= 70 ? "default" : percentage >= 50 ? "secondary" : "destructive"}
                        >
                          {percentage}%
                        </Badge>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <p className="text-sm text-gray-600">
                        {stats.correct} out of {stats.total} questions
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Question Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Question Breakdown</CardTitle>
          <CardDescription>
            Review your answers and learn from mistakes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assessment.questions.map((question, index) => {
              const isCorrect = question.userAnswer === question.correctAnswer;
              const userAnswerText = question.userAnswer !== undefined ? question.options[question.userAnswer] : "Not answered";
              const correctAnswerText = question.options[question.correctAnswer];

              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                      {isCorrect ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {question.language}
                        </Badge>
                        <span className="text-sm text-gray-500">Question {index + 1}</span>
                      </div>
                      <p className="font-medium">{question.question}</p>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-gray-600">Your answer: </span>
                          <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                            {userAnswerText}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div>
                            <span className="text-gray-600">Correct answer: </span>
                            <span className="text-green-600">{correctAnswerText}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}