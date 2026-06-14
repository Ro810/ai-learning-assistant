// Ghi chú học tập của user theo từng chủ đề. 1 user + 1 topic = 1 ghi chú (upsert).

import mongoose, { Schema, Document } from 'mongoose';

export interface INoteDocument extends Document {
  userId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  topicId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema = new Schema<INoteDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    // topicId là _id của subdocument trong Subject.topics (không ref trực tiếp).
    topicId: { type: Schema.Types.ObjectId, required: true },
    content: { type: String, default: '', maxlength: 5000 },
  },
  { timestamps: true }
);

NoteSchema.index({ userId: 1, topicId: 1 }, { unique: true });
NoteSchema.index({ userId: 1, updatedAt: -1 });

export const Note = mongoose.model<INoteDocument>('Note', NoteSchema);
