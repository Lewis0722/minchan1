import { GoogleGenAI, Type } from "@google/genai";
import { UniversityData, SearchOptions } from "../types";

// 1. Vite 환경 전용 API Key 호출 방식
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const fetchUniversityData = async (majorQuery: string, options: SearchOptions): Promise<UniversityData[]> => {
  if (!apiKey) {
    throw new Error("Vercel 설정에서 VITE_GEMINI_API_KEY를 확인해주세요.");
  }

  const regionNames = {
    SEOUL: "서울권",
    CAPITAL: "수도권(경기/인천)",
    OTHER: "지방권(지거국 및 기타)"
  };
  
  const targetRegions = options.regions.length > 0 
    ? options.regions.map(r => regionNames[r]).join(", ")
    : "전국 모든 지역";

  const systemInstruction = "대한민국 대입 전문가로서 학과 정보를 JSON 배열로만 응답하세요.";

  try {
    // 2. 모델명을 안정적인 'gemini-1.5-flash'로 고정
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `학과: "${majorQuery}", 지역: ${targetRegions}. 관련 대학 리스트를 JSON으로 반환해.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      }
    });

    // 3. ⭐ 가장 중요한 부분: .text가 아니라 .text() 함수를 호출해야 할 수도 있습니다.
    // 현재 사용하시는 라이브러리 버전에 맞춰 안전하게 텍스트를 추출합니다.
    const response = await result;
    const jsonText = response.text || (typeof response.text === 'function' ? response.text() : "");

    if (!jsonText) {
      throw new Error("AI 응답이 비어있습니다.");
    }

    const data = JSON.parse(jsonText) as UniversityData[];
    
    // 정렬 로직
    const regionScore = { SEOUL: 1, CAPITAL: 2, OTHER: 3 };
    data.sort((a, b) => regionScore[a.regionCategory] - regionScore[b.regionCategory]);

    return data;

  } catch (error) {
    console.error("실제 에러 로그:", error);
    throw new Error("AI 정보를 불러오는 중 실패했습니다. API 키나 모델 설정을 확인하세요.");
  }
};
