import { GoogleGenAI, Type } from "@google/genai";
import { UniversityData, SearchOptions } from "../types";

// 1. Vite 환경 변수 호출
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

// 2. 중요: 최신 모델들은 보통 'v1beta' 주소에 먼저 배포됩니다. 
// 아까 404가 났던 이유는 주소와 모델명이 매칭되지 않아서였으므로, 이번엔 확실한 조합으로 설정합니다.
const ai = new GoogleGenAI({ 
  apiKey,
  baseUrl: "https://generativelanguage.googleapis.com/v1beta" 
});

export const fetchUniversityData = async (majorQuery: string, options: SearchOptions): Promise<UniversityData[]> => {
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY가 설정되지 않았습니다.");
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
    // 3. AI Studio에서 사용하신 최신 모델명으로 설정합니다.
    // 보통 'gemini-2.0-pro-exp-02-05' 또는 'gemini-1.5-pro'를 사용합니다.
    // 'gemini-1.5-pro'가 가장 똑똑하고 안정적입니다.
    const result = await ai.models.generateContent({
      model: "gemini-1.5-pro", 
      contents: `학과: "${majorQuery}", 지역: ${targetRegions}. 관련 대학 리스트를 JSON 배열로 반환하세요.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const response = await result;
    const jsonText = response.text;

    if (!jsonText) throw new Error("AI 응답 데이터가 없습니다.");

    const data = JSON.parse(jsonText) as UniversityData[];
    
    // 지역별 정렬 로직
    const regionScore = { SEOUL: 1, CAPITAL: 2, OTHER: 3 };
    data.sort((a, b) => regionScore[a.regionCategory] - regionScore[b.regionCategory]);

    return data;

  } catch (error: any) {
    console.error("에러 상세:", error);
    throw new Error("정보를 불러오지 못했습니다. 모델명이나 API 설정을 확인하세요.");
  }
};
