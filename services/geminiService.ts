// ✅ 사용자님 환경의 패키지 이름인 'GoogleGenAI'를 직접 임포트합니다.
import { GoogleGenAI } from "@google/genai";
import { UniversityData, SearchOptions } from "../types";

// ✅ Vite 환경 변수 주입 방식 (VITE_ 접두사 필수)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

// ✅ v1 주소를 강제 지정하여 'v1beta' 404 에러를 차단합니다.
const genAI = new GoogleGenAI({ 
  apiKey,
  baseUrl: "https://generativelanguage.googleapis.com/v1" 
});

export const fetchUniversityData = async (majorQuery: string, options: SearchOptions): Promise<UniversityData[]> => {
  if (!apiKey) {
    throw new Error("API Key가 설정되지 않았습니다. Vercel 환경 변수를 확인하세요.");
  }

  try {
    // ✅ 모델 호출 방식을 사용자님 환경에 맞게 수정
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const regionNames = {
      SEOUL: "서울권",
      CAPITAL: "수도권(경기/인천)",
      OTHER: "지방권"
    };
    
    const targetRegions = options.regions.length > 0 
      ? options.regions.map(r => regionNames[r]).join(", ")
      : "전국";

    const prompt = `당신은 대한민국 대학 입시 전문가입니다. 
    학과: "${majorQuery}", 지역: ${targetRegions}에 맞는 대학 리스트를 JSON 배열로 반환하세요. 
    형식은 반드시 [ { "id": "...", "universityName": "...", ... } ] 형태여야 합니다.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // ✅ 응답 텍스트에서 JSON 부분만 추출 (Markdown 태그 제거)
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson) as UniversityData[];

  } catch (error) {
    console.error("Gemini API 상세 에러:", error);
    throw new Error("대학 정보를 불러오는데 실패했습니다.");
  }
};
