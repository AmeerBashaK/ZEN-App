
import { GoogleGenAI, Type } from "@google/genai";
import { ClaritySynthesis, ProbingQuestion } from "../types";

// Initialize AI client
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Generates the next question in the sequence.
 * Uses the faster flash model for sequential conversation.
 */
export const getNextQuestion = async (
  situation: string, 
  history: ProbingQuestion[]
): Promise<{ question: string; isClear: boolean }> => {
  const ai = getAI();
  const context = history.slice(-10).map(h => `Q: ${h.question}\nA: ${h.answer}`).join('\n');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `The user is untangling this situation: "${situation}"
    
    Recent conversation context (last 10 turns):
    ${context}
    
    Task:
    1. Assess if the internal landscape (emotions, hidden biases, external facts) is fully mapped.
    2. Generate a sharp, probing follow-up question. Avoid generic filler. Target specific details from previous answers.
    3. Return 'isClear' as true ONLY if you have enough data for a 360-degree synthesis.
    
    Return as JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          isClear: { type: Type.BOOLEAN }
        },
        required: ["question", "isClear"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text.trim());
    return data;
  } catch (e) {
    console.error("Failed to parse next question", e);
    return { question: "Can you elaborate on your primary concern regarding this?", isClear: false };
  }
};

/**
 * Generates an evocative mind map image.
 * This is decoupled to allow the text synthesis to finish first if needed.
 */
export const generateMindMapImage = async (situation: string, summary: string): Promise<string | undefined> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{
          text: `Professional, minimalist Zen-style mind map for: "${situation}". Summary: "${summary}". Dark theme, deep charcoal background, glowing blue and violet connections. Abstract geometric structure representing clarity. High quality digital illustration.`
        }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Cloud image generation failed", error);
  }
  return undefined;
};

/**
 * Synthesizes the final report.
 * Uses Flash model for long-context handling and faster response times.
 */
export const synthesizeClarity = async (situation: string, qas: ProbingQuestion[]): Promise<ClaritySynthesis> => {
  const ai = getAI();
  const prompt = `
    SITUATION ANALYSIS REQUEST
    Starting Point: ${situation}
    
    INQUIRY DATA (${qas.length} Points):
    ${qas.map((qa, i) => `${i + 1}. Q: ${qa.question} | A: ${qa.answer}`).join('\n')}
    
    TASK: Provide a master synthesis of this data.
    1. birdsEyeView: A powerful, objective, 2-paragraph summary of the "actual" situation as seen from outside the user's emotions.
    2. coreConflict: The single most important tension point.
    3. keyInsights: 5 deep, non-obvious realizations derived from the answers.
    4. actionableSteps: 3 clear, sequential steps for the user to move forward.
    5. mindMap: A hierarchy representing the key components (e.g., Emotional State, External Constraints, Internal Fears, Future Opportunities).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          birdsEyeView: { type: Type.STRING },
          coreConflict: { type: Type.STRING },
          keyInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
          actionableSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
          mindMap: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              children: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    children: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING } } } }
                  }
                }
              }
            }
          }
        },
        required: ["birdsEyeView", "coreConflict", "keyInsights", "actionableSteps", "mindMap"]
      }
    }
  });

  try {
    const synthesis = JSON.parse(response.text.trim());
    return synthesis;
  } catch (e) {
    console.error("JSON Synthesis Parse Error", e);
    throw new Error("The cloud synthesis returned an invalid format. This can happen with extremely long inputs. Please try a slightly shorter summary.");
  }
};
