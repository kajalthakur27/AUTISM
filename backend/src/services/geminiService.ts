import { model, isConfigured } from '../config/gemini';
import { ChildData, TherapyResponse } from '../types';

export class GeminiService {
  async analyzeChildFromPhoto(data: ChildData, emotionData: any): Promise<TherapyResponse> {
    if (!model || !isConfigured) {
      throw new Error('Gemini model is not configured');
    }

    const prompt = this.constructPhotoOnlyPrompt(data, emotionData);
    
    try {
      console.log('🤖 Sending photo-only analysis to Gemini AI...');
      console.log(`📝 Patient: ${data.childName}, Age: ${data.age}`);
      console.log(`🎭 Primary Emotion: ${emotionData.emotion}, Confidence: ${(emotionData.confidence * 100).toFixed(1)}%`);
      
      const chatSession = model.startChat({
        history: [],
      });

      const result = await chatSession.sendMessage(prompt);
      const responseText = result.response.text();
      
      console.log('✅ Gemini AI photo analysis response received successfully');
      console.log('📄 Response length:', responseText.length, 'characters');
      
      return this.parseResponse(responseText, data);
    } catch (error) {
      console.error('❌ Gemini Photo Analysis Error:', error);
      throw new Error('Gemini photo analysis failed');
    }
  }

  async analyzeChild(data: ChildData): Promise<TherapyResponse> {
    if (!model || !isConfigured) {
      throw new Error('Gemini model is not configured');
    }

    const prompt = this.constructPrompt(data);
    
    try {
      console.log('🤖 Sending request to Gemini AI...');
      console.log(`📝 Patient: ${data.childName}, Age: ${data.age}`);
      console.log(`📊 Scores: Eye=${data.eyeContact}, Speech=${data.speechLevel}, Social=${data.socialResponse}, Sensory=${data.sensoryReactions}`);
      
      const chatSession = model.startChat({
        history: [],
      });

      const result = await chatSession.sendMessage(prompt);
      const responseText = result.response.text();
      
      console.log('✅ Gemini AI response received successfully');
      console.log('📄 Response length:', responseText.length, 'characters');
      
      return this.parseResponse(responseText, data);
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      throw new Error('Gemini analysis failed');
    }
  }

  private constructPhotoOnlyPrompt(data: ChildData, emotionData: any): string {
    return `You are Dr. Sarah Mitchell, a board-certified developmental pediatrician and autism specialist with 20 years of clinical experience. You work at a children's hospital and specialize in early childhood development and autism spectrum disorder assessment.

PATIENT PHOTO ANALYSIS DATA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Patient Name: ${data.childName}
Age: ${data.age} years old

FACIAL EXPRESSION ANALYSIS RESULTS:
• Primary Emotion Detected: ${emotionData.emotion}
• Confidence Level: ${(emotionData.confidence * 100).toFixed(1)}%
• Face Detection Quality: ${(emotionData.faceDetectionScore * 100).toFixed(1)}%

ALL DETECTED EMOTIONS WITH CONFIDENCE LEVELS:
${Object.entries(emotionData.allExpressions).map(([emotion, confidence]: [string, any]) => 
  `• ${emotion}: ${(confidence * 100).toFixed(1)}%`
).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLINICAL TASK - PHOTO-ONLY ANALYSIS:
This is a LIMITED photo-only facial expression analysis for ${data.childName}. Provide recommendations based solely on the facial expression data, while clearly noting the limitations of this approach.

YOU MUST RESPOND WITH VALID JSON IN THIS EXACT FORMAT:
{
  "assessment": "Write 2-3 professional sentences analyzing the facial expression results and their potential significance, while noting this is a limited photo-only assessment",
  "riskLevel": "Moderate",
  "focusAreas": [
    "Facial Expression Analysis",
    "Emotional Regulation Patterns",
    "Comprehensive Behavioral Assessment Needed"
  ],
  "therapyGoals": [
    "Complete comprehensive autism screening assessment",
    "Observe emotional expression patterns in various settings",
    "Evaluate social communication and behavioral patterns"
  ],
  "activities": [
    "Schedule full developmental assessment with licensed professional",
    "Observe child's emotional responses in different social contexts and document patterns"
  ],
  "suggestions": [
    "This photo-only analysis provides limited clinical information",
    "Complete behavioral assessment form recommended for accurate evaluation",
    "Consult developmental pediatrician or autism specialist for comprehensive screening"
  ]
}

CRITICAL GUIDELINES FOR PHOTO-ONLY ANALYSIS:
1. **assessment**: Acknowledge this is based on facial expression only, mention detected emotion and confidence level
2. **riskLevel**: Always "Moderate" for photo-only analysis due to limited data
3. **focusAreas**: Always include need for comprehensive assessment
4. **therapyGoals**: Focus on getting complete evaluation rather than specific interventions
5. **activities**: Emphasize professional assessment rather than specific activities
6. **suggestions**: Always mention limitations and need for complete evaluation

IMPORTANT DISCLAIMERS TO INCLUDE:
- Photo-only analysis has significant limitations
- Facial expressions alone cannot diagnose autism
- Complete behavioral assessment is essential
- Professional evaluation is strongly recommended

Use warm, professional language while being clear about limitations.

RESPONSE FORMAT: Pure JSON only. No markdown, no code blocks, no extra text. Start with { and end with }.`;
  }

  private constructPrompt(data: ChildData): string {
    return `You are Dr. Sarah Mitchell, a board-certified developmental pediatrician and autism specialist with 20 years of clinical experience. You work at a children's hospital and specialize in early childhood development and autism spectrum disorder assessment.

PATIENT ASSESSMENT DATA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Patient Name: ${data.childName}
Age: ${data.age} years old

DEVELOPMENTAL SCREENING SCORES (1-5 Scale):
• Eye Contact Level: ${data.eyeContact}/5
  (1=Rarely makes eye contact, 5=Excellent sustained eye contact)
  
• Speech Development: ${data.speechLevel}/5
  (1=Non-verbal, 5=Age-appropriate speech)
  
• Social Response: ${data.socialResponse}/5
  (1=No social interaction, 5=Excellent social skills)
  
• Sensory Reactions: ${data.sensoryReactions}/5
  (1=Severe sensory issues, 5=No sensory concerns)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLINICAL TASK:
Based on this ${data.age}-year-old child's assessment scores, provide a comprehensive developmental evaluation with evidence-based therapy recommendations. Consider each score carefully - lower scores indicate greater concern.

YOU MUST RESPOND WITH VALID JSON IN THIS EXACT FORMAT:
{
  "assessment": "Write 2-3 professional sentences analyzing ${data.childName}'s overall developmental profile based on the specific scores provided",
  "riskLevel": "High" OR "Moderate" OR "Low",
  "focusAreas": [
    "First specific developmental area based on lowest scores",
    "Second specific developmental area",
    "Third specific developmental area"
  ],
  "therapyGoals": [
    "First SMART goal tailored to ${data.childName}'s age and needs",
    "Second SMART goal specific to the child's challenges",
    "Third SMART goal with measurable outcomes"
  ],
  "activities": [
    "First detailed activity with step-by-step instructions that parents can do at home - make it specific and actionable",
    "Second detailed activity with clear implementation steps and expected outcomes"
  ],
  "suggestions": [
    "First professional recommendation for next steps",
    "Second recommendation for professional support or resources"
  ]
}

CRITICAL GUIDELINES:
1. **assessment**: Analyze the ACTUAL scores provided (${data.eyeContact}, ${data.speechLevel}, ${data.socialResponse}, ${data.sensoryReactions}). Mention specific concerns.

2. **riskLevel**: 
   - "High" if average score ≤ 2.5 (significant delays, immediate intervention needed)
   - "Moderate" if average score 2.5-3.5 (some concerns, targeted therapy recommended)
   - "Low" if average score > 3.5 (typical development, enrichment suggested)

3. **focusAreas**: Based on the LOWEST scores, identify specific areas like:
   - If eyeContact ≤ 3: "Joint Attention and Visual Engagement Skills"
   - If speechLevel ≤ 3: "Expressive and Receptive Language Development"
   - If socialResponse ≤ 3: "Social Communication and Peer Interaction"
   - If sensoryReactions ≤ 3: "Sensory Processing and Integration"

4. **therapyGoals**: Create SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound) appropriate for ${data.age}-year-old

5. **activities**: Provide DETAILED activities with:
   - Clear step-by-step instructions
   - Materials needed
   - Duration and frequency
   - What success looks like

6. Use evidence-based practices: ABA, DIR/Floortime, TEACCH, PECS, social stories
7. Use warm, hopeful, professional language
8. Consider child's age (${data.age} years) in all recommendations

RESPONSE FORMAT: Pure JSON only. No markdown, no code blocks, no extra text. Start with { and end with }.`;
  }

  private parseResponse(responseText: string, data: ChildData): TherapyResponse {
    try {
      console.log('🔍 Parsing AI response...');
      
      // Clean up the response - remove markdown code blocks if present
      let cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      // Remove any text before the first { and after the last }
      const firstBrace = cleanedText.indexOf('{');
      const lastBrace = cleanedText.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
      }
      
      console.log('🔧 Cleaned response, attempting JSON parse...');
      const parsed = JSON.parse(cleanedText);
      
      // Validate required fields
      if (!parsed.focusAreas || !parsed.therapyGoals || !parsed.activities) {
        console.error('⚠️ Missing required fields in AI response');
        throw new Error('Missing required fields in AI response');
      }
      
      console.log('✅ Successfully parsed Gemini AI response!');
      console.log(`   📌 Risk Level: ${parsed.riskLevel || 'N/A'}`);
      console.log(`   🎯 Focus Areas: ${parsed.focusAreas.length} items`);
      console.log(`   📈 Therapy Goals: ${parsed.therapyGoals.length} items`);
      console.log(`   🎨 Activities: ${parsed.activities.length} items`);
      
      return {
        assessment: parsed.assessment || `Assessment for ${data.childName}`,
        riskLevel: parsed.riskLevel || 'Moderate',
        focusAreas: parsed.focusAreas || [],
        therapyGoals: parsed.therapyGoals || [],
        activities: parsed.activities || [],
        suggestions: parsed.suggestions || []
      };
    } catch (error) {
      console.error('❌ Failed to parse AI response:', error);
      console.log('📋 Response text snippet:', responseText.substring(0, 200));
      throw new Error('Invalid AI response format');
    }
  }
  // Fallback logic removed per request: only real Gemini AI responses are used.
}
