import { GoogleGenAI, Type } from "@google/genai";
import { UniversityData, SearchOptions } from "../types";

// 1. Vite/Vercel 환경 변수 호출
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

// 2. 중요: baseUrl을 'v1'으로 강제 지정하여 404 에러를 방지합니다.
const ai = new GoogleGenAI({ 
  apiKey,
  baseUrl: "https://generativelanguage.googleapis.com/v1" 
});

export const fetchUniversityData = async (majorQuery: string, options: SearchOptions): Promise<UniversityData[]> => {
  if (!apiKey) {
    throw new Error("Vercel 설정에서 VITE_GEMINI_API_KEY를 확인해주세요.");
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
    // 3. 가장 대중적이고 안정적인 gemini-1.5-flash 모델 사용
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `학과: "${majorQuery}", 지역: ${targetRegions}. 관련 대학 리스트를 JSON 배열로 반환하세요.`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json"
      }
    });

    // 4. 응답 데이터 추출
    const response = await result;
    const jsonText = response.text;

    if (!jsonText) throw new Error("AI 응답이 없습니다.");

    const data = JSON.parse(jsonText) as UniversityData[];
    
    // 지역별 정렬 로직
    const regionScore = { SEOUL: 1, CAPITAL: 2, OTHER: 3 };
    data.sort((a, b) => regionScore[a.regionCategory] - regionScore[b.regionCategory]);

    return data;

  } catch (error: any) {
    console.error("최종 에러 상세:", error);
    // 에러 발생 시 사용자에게 더 명확한 가이드를 제공합니다.
    throw new Error("데이터를 가져오지 못했습니다. API 키가 활성화되어 있는지 확인해 주세요.");
  }
};
