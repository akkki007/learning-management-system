import mongoose, { Document, Schema } from "mongoose";

export interface IVideoNote {
  id: string;
  timestamp: number;
  content: string;
  createdAt: string;
}

export interface ICompletedVideo {
  videoId: string;
  completedAt: Date | null;
}

export interface IUserProgress extends Document {
  userId: string;
  chapterId: string;
  courseId?: string;
  videoProgress: number;
  currentVideoId?: string;
  currentTimestamp: number;
  completedVideos: ICompletedVideo[];
  isCompleted: boolean;
  completedAt?: Date;
  notes: IVideoNote[];
  lastAccessedAt: Date;
  timeSpent: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}

const VideoNoteSchema = new Schema<IVideoNote>({
  id: { type: String, required: true },
  timestamp: { type: Number, required: true },
  content: { type: String, required: true },
  createdAt: { type: String, required: true }
});

const CompletedVideoSchema = new Schema<ICompletedVideo>({
  videoId: { type: String, required: true },
  completedAt: { type: Date, default: null }
});

const UserProgressSchema = new Schema<IUserProgress>({
  userId: { type: String, required: true, index: true },
  chapterId: { type: String, required: true, index: true },
  courseId: { type: String, index: true },
  videoProgress: { type: Number, default: 0, min: 0, max: 100 },
  currentVideoId: { type: String },
  currentTimestamp: { type: Number, default: 0 },
  completedVideos: [CompletedVideoSchema],
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  notes: [VideoNoteSchema],
  lastAccessedAt: { type: Date, default: Date.now },
  timeSpent: { type: Number, default: 0 }, // Track time spent in seconds
}, {
  timestamps: true
});

// Create compound index for user and chapter
UserProgressSchema.index({ userId: 1, chapterId: 1 }, { unique: true });

// Create index for course progress tracking
UserProgressSchema.index({ userId: 1, courseId: 1 });

export const UserProgress = mongoose.models.UserProgress || 
  mongoose.model<IUserProgress>("UserProgress", UserProgressSchema);