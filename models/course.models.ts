import mongoose, { Document, Model, Schema } from "mongoose";

// Interface for Video
interface IVideo {
  videoId: string;
  title: string;
  description: string;
  duration: string;
  viewCount: number;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: Date;
}

// Interface for Chapter
interface IChapter {
  title: string;
  description?: string;
  estimatedTime: number; // in minutes
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  videos: IVideo[]; // Multiple video options
  selectedVideoId?: string; // User's chosen video
  isCompleted: boolean;
  completedAt?: Date;
  order: number;
}

// Interface for Completion
interface ICompletion {
  percentage: number;
  date: Date;
  isCompleted: boolean;
}

// Interface for Module
interface IModule {
  title: string;
  description?: string;
  order: number;
  chapters: IChapter[];
  completed: ICompletion[];
  estimatedDuration: number; // in hours
  prerequisites?: string[];
}

// Interface for Course Document
export interface ICourse extends Document {
  userId: string;
  modules: IModule[];
  createdAt?: Date;
  updatedAt?: Date;
}

const courseSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    modules: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        order: {
          type: Number,
          required: true,
          default: 0,
        },
        estimatedDuration: {
          type: Number,
          required: true,
          default: 1,
        },
        prerequisites: [
          {
            type: String,
            trim: true,
          },
        ],
        chapters: [
          {
            title: {
              type: String,
              required: true,
              trim: true,
            },
            description: {
              type: String,
              trim: true,
            },
            estimatedTime: {
              type: Number,
              required: true,
              default: 30, // minutes
            },
            difficulty: {
              type: String,
              enum: ["Beginner", "Intermediate", "Advanced"],
              default: "Beginner",
            },
            videos: [
              {
                videoId: {
                  type: String,
                  required: true,
                },
                title: {
                  type: String,
                  required: true,
                },
                description: {
                  type: String,
                  required: true,
                },
                duration: {
                  type: String,
                  required: true,
                },
                viewCount: {
                  type: Number,
                  required: true,
                  default: 0,
                },
                thumbnailUrl: {
                  type: String,
                  required: true,
                },
                channelTitle: {
                  type: String,
                  required: true,
                },
                publishedAt: {
                  type: Date,
                  required: true,
                },
              },
            ],
            selectedVideoId: {
              type: String,
              default: null,
            },
            isCompleted: {
              type: Boolean,
              default: false,
            },
            completedAt: {
              type: Date,
              default: null,
            },
            order: {
              type: Number,
              required: true,
              default: 0,
            },
          },
        ],
        completed: [
          {
            percentage: {
              type: Number,
              required: true,
              min: 0,
              max: 100,
            },
            date: {
              type: Date,
              required: true,
              default: Date.now,
            },
            isCompleted: {
              type: Boolean,
              required: true,
              default: false,
            },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Method to calculate overall course completion
courseSchema.methods.getCourseCompletion = function (): number {
  if (!this.modules || this.modules.length === 0) return 0;

  const totalModules = this.modules.length;
  const completedModules = this.modules.filter((module: IModule) => {
    const latestCompletion = module.completed[module.completed.length - 1];
    return latestCompletion?.isCompleted;
  }).length;

  return Math.round((completedModules / totalModules) * 100);
};

// Static method to get user's courses
courseSchema.statics.getUserCourses = async function (
  userId: string
): Promise<ICourse[]> {
  return this.find({ userId }).sort({ updatedAt: -1 });
};

const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>("Course", courseSchema);

export default Course;
