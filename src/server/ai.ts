import { GoogleGenAI, Type } from "@google/genai";
import { TicketAIMetadata, TicketPriority } from "../types";

// Lazy-initialize Gemini client
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Running AI in fallback mock mode.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

interface AIAnalysisOutput extends TicketAIMetadata {
  tags: string[];
  priority: TicketPriority;
}

export async function analyzeTicket(title: string, description: string): Promise<AIAnalysisOutput> {
  const ai = getAIClient();
  
  if (!ai) {
    // Graceful fallback if API key is missing
    return {
      sentiment: -0.1,
      sentimentLabel: 'neutral',
      intent: 'general_inquiry',
      suggestedCategory: 'General',
      confidenceScore: 0.7,
      suggestedResponse: `Thank you for your message regarding "${title}". One of our support representatives will review your request and get back to you shortly.`,
      tags: ['General', 'Support'],
      priority: 'medium'
    };
  }

  try {
    const prompt = `Analyze this support ticket and extract structured metadata:
Title: "${title}"
Description: "${description}"

Generate a custom response draft that is empathetic, professional, addresses the exact issue, and offers specific support guidelines.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the primary AI Engine for Nexus Support, an enterprise SaaS customer support system. Your goal is to classify incoming tickets, determine their priority (low, medium, high, urgent), analyze customer sentiment (score from -1 to 1), suggest the appropriate department (Billing, Technical, Features, Account Setup, General), assign tags, and generate an exceptionally helpful and context-aware draft response.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: {
              type: Type.NUMBER,
              description: "Sentiment score of the customer, ranging from -1.0 (extremely angry/dissatisfied) to 1.0 (extremely happy/grateful)."
            },
            sentimentLabel: {
              type: Type.STRING,
              description: "Must be exactly 'positive', 'neutral', or 'negative'."
            },
            intent: {
              type: Type.STRING,
              description: "Short camelCase or snake_case key representing user intent, e.g., billing_double_charge, reset_password_error, api_webhook_failed."
            },
            suggestedCategory: {
              type: Type.STRING,
              description: "Must be one of: 'Billing', 'Technical', 'Features', 'Account Setup', 'General'."
            },
            confidenceScore: {
              type: Type.NUMBER,
              description: "Confidence in classification accuracy, from 0.0 to 1.0."
            },
            suggestedResponse: {
              type: Type.STRING,
              description: "An empathetic, highly professional, context-rich response draft prepared for an agent to review or send."
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Up to 3-4 specific tech/business tags for indexing (e.g., invoice, DNS, password-reset, react)."
            },
            priority: {
              type: Type.STRING,
              description: "Must be one of: 'low', 'medium', 'high', 'urgent'."
            }
          },
          required: ["sentiment", "sentimentLabel", "intent", "suggestedCategory", "confidenceScore", "suggestedResponse", "tags", "priority"]
        }
      }
    });

    const resultText = response.text?.trim();
    if (!resultText) {
      throw new Error("Empty response received from Gemini API");
    }

    const aiOutput = JSON.parse(resultText) as AIAnalysisOutput;
    return aiOutput;

  } catch (error) {
    console.error("Gemini AI Analysis failed, using fallback:", error);
    
    // Check if frustration keywords are in description to guess sentiment/priority
    const descLower = (description + " " + title).toLowerCase();
    let sentiment: number = -0.1;
    let sentimentLabel: 'positive' | 'neutral' | 'negative' = 'neutral';
    let priority: TicketPriority = 'medium';
    let department = 'General';
    let tags = ['General'];

    if (descLower.includes("error") || descLower.includes("fail") || descLower.includes("broken")) {
      sentiment = -0.4;
      sentimentLabel = 'negative';
      priority = 'high';
      department = 'Technical';
      tags = ['system-error'];
    }
    if (descLower.includes("bill") || descLower.includes("invoice") || descLower.includes("charge") || descLower.includes("refund")) {
      department = 'Billing';
      tags = ['billing'];
    }
    if (descLower.includes("urgent") || descLower.includes("asap") || descLower.includes("emergency")) {
      priority = 'urgent';
    }

    return {
      sentiment,
      sentimentLabel,
      intent: 'automatic_fallback_parsing',
      suggestedCategory: department,
      confidenceScore: 0.5,
      suggestedResponse: `Hello, thank you for reaching out. We have received your query regarding "${title}". One of our support experts from the ${department} team is looking into this, especially considering its ${priority} priority. We appreciate your patience.`,
      tags,
      priority
    };
  }
}

export async function generateSmartReply(ticketTitle: string, description: string, conversationHistory: { sender: string, text: string }[]): Promise<string> {
  const ai = getAIClient();
  
  if (!ai) {
    return "I am looking into this issue right now and will get back to you with the solution shortly.";
  }

  try {
    const historyText = conversationHistory.map(h => `${h.sender}: "${h.text}"`).join("\n");
    const prompt = `We have a customer support ticket. Here is the context:
Ticket Title: "${ticketTitle}"
Description: "${description}"

Conversation History:
${historyText}

Based on this history, write a helpful, professional, and personalized agent reply to the customer's last message. Draft ONLY the response text. Do not include quotes or surrounding formatting.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the voice of Nexus Support team. Your tone is supportive, informative, concise, and incredibly professional. Never offer false promises, always offer clear steps, code blocks or diagnostic workflows where appropriate.",
      }
    });

    return response.text?.trim() || "Thank you for the additional information. Let me check our logs and get back to you.";
  } catch (error) {
    console.error("Smart reply generation failed:", error);
    return "Thank you for the follow up. I am checking this information against our systems and will provide an update shortly.";
  }
}
