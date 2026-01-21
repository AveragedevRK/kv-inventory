import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateInventoryInsights = async (inventoryContext: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Analyze this inventory data and provide 3 punchy, data-heavy insights. 
        Focus on:
        - Specific SKU performance
        - High-risk stockouts
        - Capital efficiency
        
        FORMAT RULES:
        - Use Markdown bullet points.
        - **Bold** all numbers and percentages.
        - Keep each insight under 15 words.
        
        DATA:
        ${inventoryContext}
      `,
    });
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Error generating insights:", error);
    return "Failed to generate insights.";
  }
};

export const generateStoreProjections = async (storeName: string, performanceData: any[]): Promise<string> => {
  try {
    const context = JSON.stringify(performanceData.slice(-4)); 
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Act as a Quant Analyst for the store "${storeName}". 
        Look at this performance data: ${context}
        
        PROVIDE:
        1. Projected Profit: [One sentence with **bolded figure**]
        2. KPI Target: [One sentence focusing on COGS or Shipping % improvement]
        
        FORMAT:
        - Short sentences only.
        - No fluff.
        - **Bold** every numeric value.
      `,
    });
    return response.text || "No projection available.";
  } catch (error) {
    return "Error generating projections.";
  }
};

export const generateSKUReasoning = async (sku: string, stock: number, shipped: number): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Analyze SKU: ${sku} (Stock: ${stock}, Total Shipped: ${shipped}).
        
        FORMAT:
        - One line for burn rate (e.g. "Burn: **X** units/day").
        - One line for action (e.g. "Action: Reorder **Y** units by **Date**").
        - Use **bold** for all digits.
      `,
    });
    return response.text || "Reasoning unavailable.";
  } catch (error) {
    return "Failed to analyze SKU.";
  }
};
