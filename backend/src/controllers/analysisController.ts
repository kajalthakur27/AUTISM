import { Request, Response } from 'express';
import { GeminiService } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { Screening } from '../models/Screening';
import { ChildData } from '../types';

// In-memory storage (replaces MongoDB)
interface StoredScreening {
  id: string;
  childName: string;
  age: number;
  eyeContact: string;
  speechLevel: string;
  socialResponse: string;
  sensoryReactions: string;
  results: any;
  source: string;
  createdAt: Date;
}

const screenings: StoredScreening[] = [];

const geminiService = new GeminiService();
const storageService = new StorageService();

export const analyzeChild = async (req: Request, res: Response): Promise<void> => {
  try {
    const childData: ChildData = req.body;
    const emotionAnalysis = req.body.emotionAnalysis;
    const capturedImage = req.body.capturedImage;
    const photoOnlyAnalysis = req.body.photoOnlyAnalysis; // New flag for photo-only analysis

    console.log('📨 Received request body keys:', Object.keys(req.body));
    console.log('📏 Request body size:', JSON.stringify(req.body).length, 'bytes');

    // Validation - make fields optional for photo-only analysis
    if (!childData.childName) {
      res.status(400).json({
        success: false,
        error: 'Child name is required'
      });
      return;
    }

    // For photo-only analysis, we only need emotion data
    if (photoOnlyAnalysis && !emotionAnalysis) {
      res.status(400).json({
        success: false,
        error: 'Emotion analysis data is required for photo-only analysis'
      });
      return;
    }

    // For full analysis, we need all form fields (unless it's photo-only)
    if (!photoOnlyAnalysis && !emotionAnalysis && (!childData.age || !childData.eyeContact || !childData.speechLevel || 
        !childData.socialResponse || !childData.sensoryReactions)) {
      res.status(400).json({
        success: false,
        error: 'All assessment fields are required for full analysis'
      });
      return;
    }

    console.log(`📊 Analyzing: ${childData.childName}, Age: ${childData.age || 'Not provided'}`);
    if (emotionAnalysis) {
      console.log(`🎭 Emotion detected: ${emotionAnalysis.emotion} (confidence: ${emotionAnalysis.confidence})`);
    }
    if (capturedImage) {
      console.log(`📷 Image data received: ${capturedImage.substring(0, 50)}...`);
    }
    if (photoOnlyAnalysis) {
      console.log('📸 Photo-only analysis requested');
    }

    let recommendations = null;

    // Handle photo-only analysis
    if (photoOnlyAnalysis && emotionAnalysis) {
      // Create a modified prompt for photo-only analysis using Gemini
      const photoOnlyChildData: ChildData = {
        childName: childData.childName,
        age: childData.age || 5, // Default age if not provided
        eyeContact: 0, // 0 indicates unknown/not assessed
        speechLevel: 0, // 0 indicates unknown/not assessed
        socialResponse: 0, // 0 indicates unknown/not assessed
        sensoryReactions: 0 // 0 indicates unknown/not assessed
      };

      try {
        recommendations = await geminiService.analyzeChildFromPhoto(photoOnlyChildData, emotionAnalysis);
      } catch (geminiError) {
        // Fallback for photo-only analysis
        recommendations = {
          assessment: `Based on facial expression analysis, ${childData.childName} shows primary emotion: ${emotionAnalysis.emotion} with ${(emotionAnalysis.confidence * 100).toFixed(1)}% confidence. A complete behavioral assessment is recommended for comprehensive evaluation.`,
          riskLevel: emotionAnalysis.confidence > 0.7 ? 'Low' : emotionAnalysis.confidence > 0.4 ? 'Moderate' : 'High',
          focusAreas: [
            'Facial Expression Patterns',
            'Emotional Regulation Assessment', 
            'Complete Behavioral Evaluation'
          ],
          therapyGoals: [
            'Complete comprehensive behavioral assessment',
            'Monitor emotional expression patterns',
            'Evaluate social communication skills'
          ],
          activities: [
            'Schedule full autism screening assessment',
            'Observe child in multiple social settings',
            'Consider professional evaluation by developmental pediatrician'
          ],
          suggestions: [
            'This photo-only analysis provides limited insights',
            'Complete the full assessment form for accurate recommendations',
            'Consult with healthcare professionals for proper evaluation'
          ]
        };
      }
    }
    // Handle full analysis with all form data
    else if (childData.age && childData.eyeContact && childData.speechLevel && 
        childData.socialResponse && childData.sensoryReactions) {
      recommendations = await geminiService.analyzeChild(childData);
    }
    // Handle incomplete form data (fallback)
    else {
      recommendations = {
        assessment: 'Emotion detection completed. Please fill out the complete assessment form for detailed analysis.',
        riskLevel: 'Pending',
        focusAreas: ['Complete Assessment'],
        therapyGoals: ['Complete the full assessment form for comprehensive analysis'],
        activities: ['Fill out all assessment fields'],
        suggestions: ['Provide complete information for accurate analysis']
      };
    }

    // Save to MongoDB first, then external storage, fallback to memory
    let savedScreening = null;
    try {
      // Try MongoDB first
      const screening = new Screening({
        childName: childData.childName,
        age: childData.age,
        eyeContact: childData.eyeContact,
        speechLevel: childData.speechLevel,
        socialResponse: childData.socialResponse,
        sensoryReactions: childData.sensoryReactions,
        results: recommendations,
        source: 'gemini-ai'
      });

      savedScreening = await screening.save();
      console.log(`💾 Screening saved to MongoDB with ID: ${savedScreening._id}`);
    } catch (mongoError) {
      console.error('⚠️  MongoDB save failed:', mongoError);
      
      // Try external storage as fallback
      try {
        const externalData = await storageService.saveScreeningData(childData, recommendations);
        if (externalData) {
          console.log(`🌐 Screening saved to external storage with ID: ${externalData.id}`);
        } else {
          // Final fallback to in-memory storage
          const memoryScreening: StoredScreening = {
            id: Date.now().toString(),
            childName: childData.childName,
            age: childData.age,
            eyeContact: childData.eyeContact.toString(),
            speechLevel: childData.speechLevel.toString(),
            socialResponse: childData.socialResponse.toString(),
            sensoryReactions: childData.sensoryReactions.toString(),
            results: recommendations,
            source: 'gemini-ai',
            createdAt: new Date(),
          };

          screenings.push(memoryScreening);
          console.log(`💾 Screening saved to memory with ID: ${memoryScreening.id}`);
        }
      } catch (error) {
        console.error('⚠️  All storage methods failed:', error);
        // Continue anyway - analysis was successful
      }
    }

    res.status(200).json({
      success: true,
      childName: childData.childName,
      age: childData.age,
      data: recommendations,
      emotionAnalysis: emotionAnalysis || null,
      photoOnlyAnalysis: photoOnlyAnalysis || false,
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

    // Try MongoDB first
    try {
      const query = childName 
        ? { childName: { $regex: childName, $options: 'i' } }
        : {};

      const mongoScreenings = await Screening.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();

      if (mongoScreenings.length > 0) {
        console.log(`💾 Retrieved ${mongoScreenings.length} screenings from MongoDB`);
        res.status(200).json({
          success: true,
          count: mongoScreenings.length,
          data: mongoScreenings,
          source: 'mongodb'
        });
        return;
      }
    } catch (mongoError) {
      console.error('⚠️  MongoDB query failed:', mongoError);
    }

    // Try external storage as fallback
    let externalScreenings: any[] = [];
    if (storageService.isStorageConfigured()) {
      try {
        externalScreenings = await storageService.getScreenings(limit, childName);
        console.log(`🌐 Retrieved ${externalScreenings.length} screenings from external storage`);
      } catch (error) {
        console.error('⚠️  Failed to fetch from external storage:', error);
      }
    }

    // Final fallback to in-memory storage
    let memoryScreenings = screenings;
    if (childName) {
      memoryScreenings = screenings.filter(screening => 
        screening.childName.toLowerCase().includes(childName.toLowerCase())
      );
    }

    const sortedMemoryScreenings = memoryScreenings
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    // Return best available data
    const finalResults = externalScreenings.length > 0 ? externalScreenings : sortedMemoryScreenings;
    const source = externalScreenings.length > 0 ? 'external-storage' : 'memory';

    res.status(200).json({
      success: true,
      count: finalResults.length,
      data: finalResults,
      source
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

    // Try MongoDB first
    try {
      const mongoScreening = await Screening.findById(id).exec();
      if (mongoScreening) {
        res.status(200).json({
          success: true,
          data: mongoScreening,
          source: 'mongodb'
        });
        return;
      }
    } catch (mongoError) {
      console.error('⚠️  MongoDB query failed:', mongoError);
    }

    // Try external storage as fallback
    if (storageService.isStorageConfigured()) {
      try {
        const externalScreening = await storageService.getScreeningById(id);
        if (externalScreening) {
          res.status(200).json({
            success: true,
            data: externalScreening,
            source: 'external-storage'
          });
          return;
        }
      } catch (error) {
        console.error('⚠️  Failed to fetch from external storage:', error);
      }
    }

    // Final fallback to in-memory storage
    const screening = screenings.find(s => s.id === id);
    if (screening) {
      res.status(200).json({
        success: true,
        data: screening,
        source: 'memory'
      });
      return;
    }

    // Not found in any storage
    res.status(404).json({
      success: false,
      error: 'Screening not found'
    });
  } catch (error) {
    console.error('❌ Error fetching screening:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch screening'
    });
  }
};
