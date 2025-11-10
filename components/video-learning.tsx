"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  ArrowLeft,
  ArrowRight,
  Star,
  MessageSquare,
  ThumbsUp,
  Share2
} from "lucide-react";

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

interface VideoNote {
  id: string;
  timestamp: number;
  content: string;
  createdAt: string;
}

export function VideoLearning() {
  const router = useRouter();
  const params = useParams();
  const chapterId = params?.chapterId as string;
  
  const [course, setCourse] = useState<ICourse | null>(null);
  const [currentChapter, setCurrentChapter] = useState<IChapter | null>(null);
  const [currentVideo, setCurrentVideo] = useState<IVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [videoProgress, setVideoProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [embedError, setEmbedError] = useState(false);
  const [completedVideoIds, setCompletedVideoIds] = useState<Set<string>>(new Set());
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string>("");

  // Use refs to prevent infinite loops
  const hasLoadedData = useRef(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Load chapter data and user progress in parallel
      const [chapterResponse, progressResponse] = await Promise.all([
        fetch(`/api/learn/${chapterId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }),
        fetch(`/api/progress/chapter/${chapterId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
      ]);

      // Handle chapter data
      if (!chapterResponse.ok) {
        const errorData = await chapterResponse.json().catch(() => ({}));
        console.error("API Error:", chapterResponse.status, errorData);
        throw new Error(errorData.error || "Failed to load chapter data");
      }

      const chapterData = await chapterResponse.json();
      console.log("Chapter data received:", chapterData);
      
      if (!chapterData.success || !chapterData.chapter) {
        throw new Error("Invalid chapter data received");
      }
      
      setCourse(chapterData.course);
      setCurrentChapter(chapterData.chapter);
      
      // Set first video as current if none selected
      const selectedVideo = chapterData.chapter.videos.find(
        (v: IVideo) => v.id === chapterData.chapter.selectedVideoId
      ) || chapterData.chapter.videos[0];
      setCurrentVideo(selectedVideo);

      // Handle progress data
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setVideoProgress(progressData.progress?.videoProgress || 0);
        setNotes(progressData.notes || []);
        
        // Track completed videos
        if (progressData.completedVideos) {
          setCompletedVideoIds(new Set(progressData.completedVideos));
        }
      }

    } catch (error) {
      console.error("Error loading data:", error);
      setError(error instanceof Error ? error.message : "Failed to load chapter content. Please try again.");
    } finally {
      setLoading(false);
    }
  },[chapterId]);
  useEffect(() => {
    if (chapterId && !hasLoadedData.current) {
      hasLoadedData.current = true;
      loadData();
    }
  }, [chapterId, loadData]);


  const handleVideoSelect = (video: IVideo) => {
    setCurrentVideo(video);
    setIsPlaying(false);
    setEmbedError(false); // Reset error state when changing videos
  };

  const handleEmbedError = () => {
    console.warn("Video embed failed, showing fallback option");
    setEmbedError(true);
  };

  const openInYouTube = () => {
    if (currentVideo) {
      window.open(`https://www.youtube.com/watch?v=${currentVideo.id}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVideoComplete = async () => {
    if (!currentVideo || !currentChapter) return;

    try {
      // Mark current video as completed locally
      const updatedCompletedVideos = new Set(completedVideoIds);
      updatedCompletedVideos.add(currentVideo.id);
      setCompletedVideoIds(updatedCompletedVideos);

      // Update progress in database
      await fetch(`/api/learn/${chapterId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId: currentVideo.id,
          completionPercentage: 100,
          timestamp: 0
        }),
      });

      // Check if all videos are completed
      const allVideosCompleted = currentChapter.videos.every(
        video => updatedCompletedVideos.has(video.id)
      );

      // Mark chapter as completed if all videos are watched
      if (allVideosCompleted) {
        await handleChapterComplete();
      }
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const handleChapterComplete = async () => {
    try {
      await fetch(`/api/learn/${chapterId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Update local state
      if (currentChapter) {
        setCurrentChapter({
          ...currentChapter,
          isCompleted: true,
          completedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error completing chapter:", error);
    }
  };

  const navigateToNext = () => {
    if (!currentChapter || !course) return;

    const currentModuleIndex = course.modules.findIndex(m => 
      m.chapters.some(c => c._id === currentChapter._id)
    );

    if (currentModuleIndex === -1) return;

    const currentModule = course.modules[currentModuleIndex];
    const currentChapterIndex = currentModule.chapters.findIndex(
      c => c._id === currentChapter._id
    );

    if (currentChapterIndex === -1) return;

    // Try next chapter in current module
    const nextChapter = currentModule.chapters[currentChapterIndex + 1];
    if (nextChapter) {
      router.push(`/learn/${nextChapter._id}`);
      return;
    }

    // Try first chapter of next module
    const nextModule = course.modules[currentModuleIndex + 1];
    if (nextModule && nextModule.chapters.length > 0) {
      router.push(`/learn/${nextModule.chapters[0]._id}`);
      return;
    }

    // Course completed
    router.push("/roadmap");
  };

  const navigateToPrevious = () => {
    if (!currentChapter || !course) return;

    const currentModuleIndex = course.modules.findIndex(m => 
      m.chapters.some(c => c._id === currentChapter._id)
    );

    if (currentModuleIndex === -1) return;

    const currentModule = course.modules[currentModuleIndex];
    const currentChapterIndex = currentModule.chapters.findIndex(
      c => c._id === currentChapter._id
    );

    if (currentChapterIndex === -1) return;

    // Try previous chapter in current module
    if (currentChapterIndex > 0) {
      const prevChapter = currentModule.chapters[currentChapterIndex - 1];
      router.push(`/learn/${prevChapter._id}`);
      return;
    }

    // Try last chapter of previous module
    if (currentModuleIndex > 0) {
      const prevModule = course.modules[currentModuleIndex - 1];
      if (prevModule.chapters.length > 0) {
        const lastChapter = prevModule.chapters[prevModule.chapters.length - 1];
        router.push(`/learn/${lastChapter._id}`);
      }
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    setIsSavingNote(true);
    setNoteError("");

    try {
      const note: VideoNote = {
        id: Date.now().toString(),
        timestamp: videoProgress,
        content: newNote.trim(),
        createdAt: new Date().toISOString()
      };

      // Optimistically update UI
      setNotes([...notes, note]);
      setNewNote("");
      
      // Save note to backend
      const response = await fetch(`/api/progress/chapter/${chapterId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(note),
      });

      if (!response.ok) {
        throw new Error("Failed to save note");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      setNoteError("Failed to save note. Please try again.");
      
      // Remove the optimistically added note
      setNotes(notes);
      setNewNote(newNote);
    } finally {
      setIsSavingNote(false);
    }
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
          <p className="mt-4 text-gray-600">Loading chapter content...</p>
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
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Chapter</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => {
              hasLoadedData.current = false;
              loadData();
            }} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentChapter || !currentVideo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center p-6">
            <div className="text-blue-600 text-5xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Content Available</h3>
            <p className="text-gray-600 mb-4">
              This chapter doesnt have any learning videos yet.
            </p>
            <Button onClick={() => router.push("/roadmap")} className="w-full">
              Back to Roadmap
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allVideosCompleted = currentChapter.videos.every(
    video => completedVideoIds.has(video.id)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{currentChapter.title}</h1>
              <p className="text-gray-600">{currentChapter.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getDifficultyColor(currentChapter.difficulty)}>
                {currentChapter.difficulty}
              </Badge>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {formatDuration(currentChapter.estimatedTime)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/roadmap")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Roadmap
            </Button>
            
            <div className="flex-1">
              <Progress value={videoProgress} className="h-2" />
              <p className="text-sm text-gray-600 mt-1">
                Progress: {videoProgress}% complete • {completedVideoIds.size}/{currentChapter.videos.length} videos completed
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                {/* YouTube Video Player */}
                <div className="aspect-video bg-black rounded-t-lg relative">
                  {currentVideo ? (
                    <>
                      <iframe
                        key={currentVideo.id}
                        src={`https://www.youtube.com/embed/${currentVideo.id}?enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                        title={currentVideo.title}
                        className="w-full h-full rounded-t-lg"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        onError={handleEmbedError}
                        onLoad={() => {
                          console.log("Video loaded:", currentVideo.title);
                          setEmbedError(false);
                        }}
                      />
                      {embedError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-t-lg">
                          <div className="text-center text-white p-6">
                            <div className="text-5xl mb-4">🎥</div>
                            <h3 className="text-xl font-semibold mb-2">Video Restricted</h3>
                            <p className="text-sm mb-4 opacity-90">
                              This video cannot be embedded. Watch it on YouTube instead.
                            </p>
                            <Button
                              onClick={openInYouTube}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Watch on YouTube
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-white">
                      <div className="text-center">
                        <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p>No video available</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Controls */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-800">{currentVideo.title}</h2>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Share2 className="h-4 w-4" />
                      </Button>
                      {completedVideoIds.has(currentVideo.id) && (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{currentVideo.description}</p>

                  {/* Open in YouTube Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openInYouTube}
                    className="w-full mb-3 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Watch on YouTube
                  </Button>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>Channel: {currentVideo.channel}</span>
                      <span>Duration: {currentVideo.duration}</span>
                      <span>Views: {currentVideo.viewCount}</span>
                    </div>
                    <div>
                      Published: {new Date(currentVideo.publishedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Video Notes</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNotes(!showNotes)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {showNotes ? "Hide" : "Show"} Notes ({notes.length})
                  </Button>
                </div>
              </CardHeader>
              
              {showNotes && (
                <CardContent>
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {notes.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No notes yet. Add your first note below!
                      </p>
                    ) : (
                      notes.map((note) => (
                        <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              {Math.floor(note.timestamp / 60)}:{(note.timestamp % 60).toString().padStart(2, '0')}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800">{note.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-3">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note at current timestamp..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      disabled={isSavingNote}
                    />
                    {noteError && (
                      <p className="text-sm text-red-600">{noteError}</p>
                    )}
                    <Button 
                      onClick={addNote} 
                      className="w-full"
                      disabled={isSavingNote || !newNote.trim()}
                    >
                      {isSavingNote ? "Saving..." : "Add Note"}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Video Playlist */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Video Playlist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {currentChapter.videos.map((video) => (
                    <div
                      key={video.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        currentVideo?.id === video.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => handleVideoSelect(video)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-16 h-12 object-cover rounded"
                          />
                          {completedVideoIds.has(video.id) && (
                            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{video.title}</p>
                          <p className="text-xs text-gray-600">{video.duration}</p>
                        </div>
                        {currentVideo?.id === video.id && (
                          <Play className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Button
                    onClick={handleVideoComplete}
                    className="w-full"
                    disabled={completedVideoIds.has(currentVideo.id)}
                  >
                    {completedVideoIds.has(currentVideo.id) ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Video Completed
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Video Complete
                      </>
                    )}
                  </Button>
                  
                  {allVideosCompleted && !currentChapter.isCompleted && (
                    <Button
                      onClick={handleChapterComplete}
                      variant="outline"
                      className="w-full border-green-500 text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Chapter
                    </Button>
                  )}

                  {currentChapter.isCompleted && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                      <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                      <p className="text-sm font-medium text-green-800">Chapter Completed!</p>
                    </div>
                  )}

                  <Separator className="my-4" />
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={navigateToPrevious}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={navigateToNext}
                      className="flex-1"
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
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