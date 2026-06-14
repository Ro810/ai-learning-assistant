import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  resetTokenHash?: string | null;
  resetTokenExpires?: Date | null;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    profile: {
      name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
      },
      avatarUrl: {
        type: String,
        default: null,
      },
      grade: {
        type: String,
        default: null,
      },
    },
    learningGoals: [
      {
        subjectId: {
          type: Schema.Types.ObjectId,
          ref: 'Subject',
          required: true,
        },
        targetLevel: {
          type: String,
          enum: ['basic', 'intermediate', 'advanced'],
          required: true,
        },
        targetDate: {
          type: Date,
          required: true,
        },
      },
    ],
    currentLevel: {
      subjectId: {
        type: Schema.Types.ObjectId,
        ref: 'Subject',
      },
      level: String,
      // Topic IDs are subdocument _ids inside Subject.topics — no Mongoose ref
      // (populate must be done manually by querying the parent Subject)
      weakTopics: [Schema.Types.ObjectId],
    },
    // Quên mật khẩu: lưu HASH (sha256) của token reset + hạn dùng. Token thô chỉ
    // gửi cho user qua link, không lưu DB. select:false để không lộ khi query thường.
    resetTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    resetTokenExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Note: unique index is already defined in email field

// Method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static method to hash password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

export const User = mongoose.model<IUserDocument>('User', UserSchema);
