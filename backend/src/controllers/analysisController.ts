import { Request, Response } from 'express';
import { GeminiService } from '../services/geminiService';
import { ChildData } from '../types';

const geminiService = new GeminiService();

export const analyzeChild = async (req: Request, res: Response): Promise<void> => {
  try {
    const childData: ChildData = req.body;

    // Validation
    if (!childData.childName || !childData.age) {
      res.status(400).json({
        success: false,
        error: 'Child name and age are required'
      });
      return;
    }

    if (!childData.eyeContact || !childData.speechLevel || 
        !childData.socialResponse || !childData.sensoryReactions) {
      res.status(400).json({
        success: false,
        error: 'All assessment fields are required'
      });
      return;
    }

    console.log(`📊 Analyzing: ${childData.childName}, Age: ${childData.age}`);

    const recommendations = await geminiService.analyzeChild(childData);

    res.status(200).json({
      success: true,
      childName: childData.childName,
      age: childData.age,
      data: recommendations,
      source: 'gemini-ai'
    });
    
    console.log(`✅ Analysis completed for ${childData.childName}`);
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: 'Analysis failed. Please try again.'
    });
  }
};
