import { GoogleGenAI, Type } from "@google/genai";
import { UniversityData, SearchOptions } from "../types";

// 1. Vite 환경에서 Vercel의 환경 변수를 읽어오는 정확한 방식입니다.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const fetchUniversityData = async (majorQuery: string, options: SearchOptions): Promise<UniversityData[]> => {
  if (!apiKey) {
    throw new Error("API Key가 설정되지 않았습니다. Vercel 설정을 확인해주세요.");
  }

  const regionNames = {
    SEOUL: "서울권",
    CAPITAL: "수도권(경기/인천)",
    OTHER: "지방권(지거국 및 기타)"
  };
  
  const targetRegions = options.regions.length > 0 
    ? options.regions.map(r => regionNames[r]).join(", ")
    : "전국 모든 지역";

  let scorePrompt = "";
  if (options.scoreType === 'GPA' && options.scoreValue) {
    scorePrompt = `내신 ${options.scoreValue}등급 기준 적정/안정권 대학`;
  } else if (options.scoreType === 'CSAT' && options.scoreValue) {
    scorePrompt = `수능 백분위 ${options.scoreValue}% 기준 적정/안정권 대학`;
  }

  const systemInstruction = "당신은 대한민국 대학 입시 전문가입니다. 학과명에 맞는 대학 리스트를 JSON 형식으로만 응답하세요.";

  try {
    // 2. 모델명을 가장 안정적인 'gemini-1.5-flash'로 변경합니다. (중요!)
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", 
      contents: `학과: "${majorQuery}", 지역: ${targetRegions}, 성적: ${scorePrompt}. 대학 정보를 JSON 배열로 반환하세요.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        // 기존의 복잡한 responseSchema를 제거하여 AI가 더 자유롭고 정확하게 응답하도록 유도합니다.
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("AI 응답 데이터가 없습니다.");

    const data = JSON.parse(jsonText) as UniversityData[];
    return data;

  } catch (error) {
    console.error("Gemini API Error Detail:", error);
    throw new Error("AI 정보를 불러오는 중 실패했습니다. API 키나 모델 설정을 확인하세요.");
  }
};
