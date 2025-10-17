export interface ChildData {
  childName: string;
  age: number;
  eyeContact: number;
  speechLevel: number;
  socialResponse: number;
  sensoryReactions: number;
}

export interface TherapyResponse {
  assessment?: string;
  riskLevel?: string;
  focusAreas: string[];
  therapyGoals: string[];
  activities: string[];
  suggestions?: string[];
}

export interface ApiResponse {
  success: boolean;
  childName?: string;
  age?: number;
  data?: TherapyResponse;
  error?: string;
  source?: 'gemini-ai' | 'fallback';
}
