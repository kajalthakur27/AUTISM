import { Request, Response } from 'express';
import { GeminiService } from '../services/geminiService';
import { ChildData } from '../types';
import { Screening } from '../models/Screening';

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

    // Save to MongoDB
    try {
      const screening = new Screening({
        childName: childData.childName,
        age: childData.age,
        eyeContact: childData.eyeContact,
        speechLevel: childData.speechLevel,
        socialResponse: childData.socialResponse,
        sensoryReactions: childData.sensoryReactions,
        results: recommendations,
        source: 'gemini-ai',
      });

      await screening.save();
      console.log(`💾 Screening saved to database with ID: ${screening._id}`);
    } catch (dbError) {
      console.error('⚠️  Failed to save to database:', dbError);
      // Continue anyway - don't fail the request if DB save fails
    }

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
    const message = (error as Error).message || 'Analysis failed. Please try again.';
    res.status(500).json({
      success: false,
      error: message
    });
  }
};

export const getScreenings = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const childName = req.query.childName as string;

    let query = {};
    if (childName) {
      query = { childName: new RegExp(childName, 'i') }; // Case-insensitive search
    }

    const screenings = await Screening.find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .limit(limit)
      .select('-__v'); // Exclude version key

    res.status(200).json({
      success: true,
      count: screenings.length,
      data: screenings
    });
  } catch (error) {
    console.error('❌ Error fetching screenings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch screenings'
    });
  }
};

export const getScreeningById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const screening = await Screening.findById(id).select('-__v');

    if (!screening) {
      res.status(404).json({
        success: false,
        error: 'Screening not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: screening
    });
  } catch (error) {
    console.error('❌ Error fetching screening:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch screening'
    });
  }
};
