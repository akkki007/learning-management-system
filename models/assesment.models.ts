import mongoose, { Document, Model, Schema } from "mongoose";

// Interface for Question
interface IQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  userAnswer?: number; // index of user's selected option
  language: string; // which language this question is for
}

// Interface for Assessment Document
export interface IAssessment extends Document {
  userId: mongoose.Types.ObjectId;
  questions: IQuestion[];
  score?: number;
  totalQuestions: number;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;

  // Methods
  calculateScore(): number;
  submitAnswers(answers: { questionIndex: number; answer: number }[]): void;
}

const assessmentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questions: [
      {
        question: {
          type: String,
          required: true,
        },
        options: [
          {
            type: String,
            required: true,
          },
        ],
        correctAnswer: {
          type: Number,
          required: true,
        },
        userAnswer: {
          type: Number,
          default: null,
        },
        language: {
          type: String,
          required: true,
        },
      },
    ],
    score: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
assessmentSchema.index({ userId: 1 });
assessmentSchema.index({ isCompleted: 1 });

// Method to calculate score
assessmentSchema.methods.calculateScore = function (): number {
  const correctAnswers = this.questions.filter(
    (q: IQuestion) =>
      q.userAnswer !== undefined && q.userAnswer === q.correctAnswer
  ).length;

  return Math.round((correctAnswers / this.totalQuestions) * 100);
};

// Method to submit answers
assessmentSchema.methods.submitAnswers = function (
  answers: { questionIndex: number; answer: number }[]
): void {
  answers.forEach(({ questionIndex, answer }) => {
    if (this.questions[questionIndex]) {
      this.questions[questionIndex].userAnswer = answer;
    }
  });

  this.isCompleted = true;
  this.completedAt = new Date();
  this.score = this.calculateScore();
};

// Static method to get user's assessments
assessmentSchema.statics.getUserAssessments = async function (
  userId: string
): Promise<IAssessment[]> {
  return this.find({ userId }).sort({ createdAt: -1 });
};

const Assessment: Model<IAssessment> =
  mongoose.models.Assessment ||
  mongoose.model<IAssessment>("Assessment", assessmentSchema);

export default Assessment;
