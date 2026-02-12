import { GoogleGenAI, Type } from "@google/genai";
import { UniversityData, SearchOptions } from "../types";

// 1. API Key 설정 (Vite/Vercel 전용)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

// 2. 중요: API 버전을 'v1'으로 명시하여 404 에러를 방지합니다.
const ai = new GoogleGenAI({ 
  apiKey,
  baseUrl: "https://generativelanguage.googleapis.com/v1" 
});

export const fetchUniversityData = async (majorQuery: string, options: SearchOptions): Promise<UniversityData[]> => {
  if (!apiKey) {
    throw new Error("Vercel 설정에서 API Key를 확인해주세요.");
  }

  const regionNames = {
    SEOUL: "서울권",
    CAPITAL: "수도권(경기/인천)",
    OTHER: "지방권"
  };
  
  const targetRegions = options.regions.length > 0 
    ? options.regions.map(r => regionNames[r]).join(", ")
    : "전국";

  const systemInstruction = "대한민국 입시 전문가입니다. 반드시 JSON 배열 형식으로만 응답하세요.";

  try {
    // 3. 모델명을 가장 기본형인 'gemini-1.5-flash'로 사용합니다.
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `학과: "${majorQuery}", 지역: ${targetRegions}. 관련 대학 리스트를 JSON 배열로 반환하세요.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });

    // 4. 안전한 텍스트 추출 방식
    const response = await result;
    const jsonText = response.text;

    if (!jsonText) throw new Error("AI 응답이 없습니다.");

    const data = JSON.parse(jsonText) as UniversityData[];
    
    // 정렬: 서울 > 수도권 > 지방
    const regionScore = { SEOUL: 1, CAPITAL: 2, OTHER: 3 };
    data.sort((a, b) => regionScore[a.regionCategory] - regionScore[b.regionCategory]);

    return data;

  } catch (error) {
    console.error("최종 에러 상세:", error);
    throw new Error("입시 정보를 불러오는데 실패했습니다. 잠시 후 다시 시도해 주세요.");
  }
};
