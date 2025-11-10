"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  ChevronRight,
  Star,
  Lock,
  Award,
  TrendingUp,
  ChevronDown,
  Code,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { cachedFetch } from "@/lib/cache";

interface IVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  viewCount: string;
  thumbnail: string;
  channel: string;
  publishedAt: string;
}

interface IChapter {
  _id: string;
  title: string;
  description: string;
  videos: IVideo[];
  selectedVideoId?: string;
  estimatedTime: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  isCompleted: boolean;
  completedAt?: string;
  order: number;
}

interface IModule {
  _id: string;
  title: string;
  description: string;
  chapters: IChapter[];
  order: number;
  estimatedDuration: number;
  prerequisites: string[];
}

interface ICourse {
  _id: string;
  title: string;
  description: string;
  modules: IModule[];
  totalDuration: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  createdAt: string;
}

interface UserProgress {
  completedChapters: string[];
  currentChapter: string;
  overallProgress: number;
  totalTimeSpent: number;
  lastAccessed: string;
}

export function LearningRoadmap() {
  const router = useRouter();
  const [course, setCourse] = useState<ICourse | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<IChapter | null>(null);

  useEffect(() => {
    loadRoadmapData();
  }, []);

  const loadRoadmapData = async () => {
    try {
      setLoading(true);
      setError("");

      // Use cached fetch for better performance
      const roadmapData = await cachedFetch<{
        success: boolean;
        roadmap?: ICourse;
        message?: string;
      }>("/api/roadmap", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }, "roadmap-data", 5 * 60 * 1000); // Cache for 5 minutes

      if (!roadmapData.success || !roadmapData.roadmap) {
        throw new Error(roadmapData.message || "Failed to load roadmap");
      }

      setCourse(roadmapData.roadmap);

      // Fetch user progress
      const progressResponse = await fetch("/api/user/progress", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setUserProgress(progressData.progress);
      }

    } catch (error) {
      console.error("Error loading roadmap data:", error);
      setError("Failed to load your learning roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChapterClick = (chapter: IChapter, moduleId: string) => {
    setSelectedChapter(chapter);
    setSelectedModule(moduleId);
    // Add smooth transition before navigation
    setTimeout(() => {
      router.push(`/learn/${chapter._id}`);
    }, 200);
  };

  const handleStartLearning = (chapter: IChapter) => {
    router.push(`/learn/${chapter._id}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your personalized roadmap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center p-6">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Roadmap</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadRoadmapData} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center p-6">
            <div className="text-blue-600 text-5xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Course Available</h3>
            <p className="text-gray-600 mb-4">
              Please complete your assessment first to get your personalized learning roadmap.
            </p>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Go to Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Learning Roadmap</h1>
              <p className="text-gray-600">
                Personalized course based on your assessment results
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {userProgress?.overallProgress || 0}%
              </div>
              <p className="text-sm text-gray-600">Complete</p>
            </div>
          </div>

          <Progress value={userProgress?.overallProgress || 0} className="h-3" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">{course.modules.length}</div>
                <p className="text-sm text-gray-600">Total Modules</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <BookOpen className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">
                  {course.modules.reduce((acc, module) => acc + module.chapters.length, 0)}
                </div>
                <p className="text-sm text-gray-600">Total Chapters</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">
                  {formatDuration(course.totalDuration)}
                </div>
                <p className="text-sm text-gray-600">Total Duration</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">
                  {userProgress?.completedChapters.length || 0}
                </div>
                <p className="text-sm text-gray-600">Completed</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Course Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Modules List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Course Modules</CardTitle>
                <CardDescription>
                  Complete all modules to master your learning path
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {course.modules.map((module, moduleIndex) => (
                  <div key={module._id}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {moduleIndex + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{module.title}</h3>
                          <p className="text-sm text-gray-600">{module.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{formatDuration(module.estimatedDuration)}</Badge>
                    </div>

                    <div className="ml-11 space-y-2">
                      {module.chapters.map((chapter) => (
                        <div
                          key={chapter._id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            chapter.isCompleted
                              ? "bg-green-50 border-green-200 hover:bg-green-100"
                              : "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                          }`}
                          onClick={() => handleChapterClick(chapter, module._id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {chapter.isCompleted ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <BookOpen className="h-5 w-5 text-gray-400" />
                              )}
                              <div>
                                <h4 className="font-medium text-gray-800">{chapter.title}</h4>
                                <p className="text-sm text-gray-600">{chapter.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getDifficultyColor(chapter.difficulty)}>
                                {chapter.difficulty}
                              </Badge>
                              <Badge variant="secondary">{formatDuration(chapter.estimatedTime)}</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {moduleIndex < course.modules.length - 1 && <Separator className="my-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Selected Chapter Details */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Chapter Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedChapter ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">{selectedChapter.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{selectedChapter.description}</p>
                      
                      <div className="flex items-center space-x-2 mb-3">
                        <Badge className={getDifficultyColor(selectedChapter.difficulty)}>
                          {selectedChapter.difficulty}
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(selectedChapter.estimatedTime)}
                        </Badge>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Learning Videos</h4>
                      <div className="space-y-2">
                        {selectedChapter.videos.slice(0, 3).map((video) => (
                          <div key={video.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                            <img 
                              src={video.thumbnail} 
                              alt={video.title}
                              className="w-12 h-8 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{video.title}</p>
                              <p className="text-xs text-gray-600">{video.duration}</p>
                            </div>
                            <Play className="h-4 w-4 text-blue-600" />
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleStartLearning(selectedChapter)}
                      className="w-full"
                      disabled={selectedChapter.isCompleted}
                    >
                      {selectedChapter.isCompleted ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completed
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Learning
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Select a chapter to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-4 sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Streak</span>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                      <span className="font-semibold">3 days</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Study Time Today</span>
                    <span className="font-semibold">45 min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Next Milestone</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-semibold">25%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}