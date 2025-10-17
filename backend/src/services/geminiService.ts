import { model, isConfigured } from '../config/gemini';
import { ChildData, TherapyResponse } from '../types';

export class GeminiService {
  async analyzeChild(data: ChildData): Promise<TherapyResponse> {
    if (!model || !isConfigured) {
      console.log('📋 Using fallback recommendations');
      return this.getFallbackResponse(data);
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
      console.log('⚠️ Falling back to rule-based system');
      return this.getFallbackResponse(data);
    }
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
      console.log('⚠️ Using fallback response instead');
      return this.getFallbackResponse(data);
    }
  }

  private getFallbackResponse(data: ChildData): TherapyResponse {
    const focusAreas: string[] = [];
    const therapyGoals: string[] = [];
    const activities: string[] = [];
    const suggestions: string[] = [];

    console.log('⚠️ Using rule-based fallback recommendations');

    // Calculate average score for risk assessment
    const avgScore = (data.eyeContact + data.speechLevel + data.socialResponse + data.sensoryReactions) / 4;
    let riskLevel = 'Moderate';
    let assessment = '';

    if (avgScore <= 2) {
      riskLevel = 'High';
      assessment = `${data.childName} (${data.age} years) shows significant developmental concerns across multiple areas. Immediate professional evaluation and intensive early intervention therapy is strongly recommended.`;
    } else if (avgScore <= 3.5) {
      riskLevel = 'Moderate';
      assessment = `${data.childName} (${data.age} years) demonstrates some developmental delays that would benefit from targeted therapeutic interventions and close monitoring.`;
    } else {
      riskLevel = 'Low';
      assessment = `${data.childName} (${data.age} years) shows age-appropriate development in most areas. Enrichment activities and continued monitoring recommended.`;
    }

    // Analyze based on numeric scores (1-5 scale)
    if (data.eyeContact <= 3) {
      focusAreas.push('Visual Engagement & Eye Contact Development');
      therapyGoals.push(`Increase sustained eye contact to 5-7 seconds during interactions by practicing daily visual games`);
      activities.push('👁️ Mirror Game: Sit face-to-face with child. Make exaggerated facial expressions and funny sounds to encourage them to look at your face. Start with 2-3 second glances, reward with favorite toy. Practice 3 times daily for 5 minutes.');
    }

    if (data.speechLevel <= 3) {
      focusAreas.push('Speech & Communication Skills');
      therapyGoals.push(`Expand functional vocabulary by 20 words within 3 months using visual aids and repetition`);
      activities.push('🗣️ Picture Communication Cards: Create photo cards of 10 favorite items (food, toys, family). Point and name each item clearly. Have child request items by pointing to cards. Gradually introduce verbal prompts. Practice during meal times and play.');
    }

    if (data.socialResponse <= 3) {
      focusAreas.push('Social Interaction & Engagement');
      therapyGoals.push(`Initiate social interactions 3-5 times per hour during structured play sessions`);
      activities.push('🤝 Turn-Taking Games: Use simple games like rolling ball back-and-forth, building blocks together. Clap and cheer for each turn. Start with 3-5 turns, increase gradually. Makes learning social rules fun and predictable.');
    }

    if (data.sensoryReactions <= 3) {
      focusAreas.push('Sensory Processing & Integration');
      therapyGoals.push(`Improve tolerance to various sensory inputs through gradual desensitization activities`);
      activities.push('🎨 Sensory Exploration Box: Create a box with different textures (soft fabrics, smooth stones, bumpy toys). Let child explore for 30 seconds initially. Praise calm engagement. Increase time weekly. Helps regulate sensory responses.');
    }

    // Add general recommendations
    if (focusAreas.length < 3) {
      focusAreas.push('Fine Motor Skills Development', 'Play-Based Learning', 'Emotional Regulation');
    }

    if (therapyGoals.length < 3) {
      therapyGoals.push(
        'Develop age-appropriate self-help skills with hand-over-hand assistance',
        'Follow 2-step instructions consistently in structured environment',
        'Express basic needs using verbal or visual communication methods'
      );
    }

    if (activities.length < 2) {
      activities.push(
        '🧩 Structured Play Routine: Set up 15-minute daily play sessions with favorite toys. Use visual schedule showing "First play, then snack". This teaches transitions and rewards positive engagement.',
        '🎵 Music & Movement: Play favorite songs and model simple actions (clap, jump, spin). Encourage imitation. Music engages multiple senses and promotes social connection. Do 2-3 songs before bedtime routine.'
      );
    }

    suggestions.push(
      '📋 Professional Evaluation: Schedule comprehensive assessment with developmental pediatrician or child psychologist for formal diagnosis and personalized treatment plan',
      '👨‍👩‍👧 Parent Training: Consider ABA therapy, speech therapy, or occupational therapy based on specific needs. Parent-mediated interventions show best outcomes',
      '🏫 Early Intervention Services: Contact your local early intervention program for free/low-cost services if child is under 3 years old',
      '📚 Resources: Explore evidence-based programs like TEACCH, PECS, DIR/Floortime based on child\'s learning style'
    );

    return {
      assessment,
      riskLevel,
      focusAreas: focusAreas.slice(0, 3),
      therapyGoals: therapyGoals.slice(0, 3),
      activities: activities.slice(0, 2),
      suggestions: suggestions.slice(0, 2)
    };
  }
}
