import mongoose, { Schema, Document } from 'mongoose';
import { TherapyResponse } from '../types';

export interface IScreening extends Document {
  childName: string;
  age: number;
  eyeContact: number;
  speechLevel: number;
  socialResponse: number;
  sensoryReactions: number;
  results: TherapyResponse;
  source: 'gemini-ai' | 'fallback';
  createdAt: Date;
  updatedAt: Date;
}

const ScreeningSchema: Schema = new Schema(
  {
    childName: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 1,
      max: 18,
    },
    eyeContact: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    speechLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    socialResponse: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    sensoryReactions: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    results: {
      assessment: String,
      riskLevel: String,
      focusAreas: [String],
      therapyGoals: [String],
      activities: [Schema.Types.Mixed], // Can be strings or objects
      suggestions: [String],
    },
    source: {
      type: String,
      enum: ['gemini-ai', 'fallback'],
      default: 'gemini-ai',
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Index for faster queries
ScreeningSchema.index({ childName: 1, createdAt: -1 });
ScreeningSchema.index({ createdAt: -1 });

export const Screening = mongoose.model<IScreening>('Screening', ScreeningSchema);
