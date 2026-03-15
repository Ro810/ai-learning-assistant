import mongoose, { Schema, Document } from 'mongoose';
import { ISubject, ITopic } from '../types';

export interface ISubjectDocument extends ISubject, Document {}

const TopicSchema = new Schema<ITopic>(
  {
    name: {
      type: String,
      required: [true, 'Topic name is required'],
      trim: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
  },
  { _id: true }
);

const SubjectSchema = new Schema<ISubjectDocument>(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Subject code is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    topics: [TopicSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes
SubjectSchema.index({ code: 1 }, { unique: true });
SubjectSchema.index({ 'topics._id': 1 });

export const Subject = mongoose.model<ISubjectDocument>('Subject', SubjectSchema);
