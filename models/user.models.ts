import mongoose, { Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  clerkId?: string;
  username: string;
  email: string;
  password?: string;
  education: string;
  career: string;
  languagesKnown: {
    name: string;
    proficiency: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  }[];
  comparePassword?(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      unique: true,
      sparse: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: false,
      minlength: 6,
    },
    education: {
      type: String,
      default: "",
    },
    career: {
      type: String,
      default: "",
    },
    languagesKnown: [
      {
        name: {
          type: String,
          required: true,
        },
        proficiency: {
          type: String,
          required: true,
          enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving (only for non-Clerk users)
userSchema.pre("save", async function (next) {
  if (!this.password || !this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: unknown) {
    next(error instanceof Error ? error : new Error("Password hashing failed"));
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
