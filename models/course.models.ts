import mongoose, { Document, Model, Schema } from "mongoose";

// Interface for Chapter
interface IChapter {
    title: string;
    youtubeLink: string;
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
    chapters: IChapter[];
    completed: ICompletion[];
}

// Interface for Course Document
export interface ICourse extends Document {
    userId: mongoose.Types.ObjectId;
    modules: IModule[];
    createdAt?: Date;
    updatedAt?: Date;
}

const courseSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    modules: [{
        title: {
            type: String,
            required: true,
            trim: true,
        },
        chapters: [{
            title: {
                type: String,
                required: true,
                trim: true,
            },
            youtubeLink: {
                type: String,
                required: true,
                trim: true,
            }
        }],
        completed: [{
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
            }
        }]
    }]
}, {
    timestamps: true,
});

// Index for faster queries
courseSchema.index({ userId: 1 });

// Method to calculate overall course completion
courseSchema.methods.getCourseCompletion = function(): number {
    if (!this.modules || this.modules.length === 0) return 0;
    
    const totalModules = this.modules.length;
    const completedModules = this.modules.filter((module: IModule) => {
        const latestCompletion = module.completed[module.completed.length - 1];
        return latestCompletion?.isCompleted;
    }).length;
    
    return Math.round((completedModules / totalModules) * 100);
};

// Static method to get user's courses
courseSchema.statics.getUserCourses = async function(userId: string): Promise<ICourse[]> {
    return this.find({ userId }).sort({ updatedAt: -1 });
};

const Course: Model<ICourse> = mongoose.models.Course || mongoose.model<ICourse>("Course", courseSchema);

export default Course;