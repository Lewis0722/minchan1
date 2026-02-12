import { GoogleGenAI, Type } from "@google/genai";
import { UniversityData, SearchOptions } from "../types";

// ✅ 1. Vite 환경에서 Vercel 환경 변수를 읽는 정확한 방법으로 수정
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
    scorePrompt = `내신 ${options.scoreValue}등급 기준 적정/안정권 대학을 추천하세요.`;
  } else if (options.scoreType === 'CSAT' && options.scoreValue) {
    scorePrompt = `수능 백분위 ${options.scoreValue}% 기준 적정/안정권 대학을 추천하세요.`;
  }

  const systemInstruction = "당신은 대한민국 대학 입시 전문가입니다. 학과명에 맞는 대학 리스트를 JSON으로 제공하세요.";

  try {
    const response = await ai.models.generateContent({
      // ✅ 2. 실존하는 안정적인 모델명(gemini-1.5-flash)으로 수정
      model: "gemini-1.5-flash",
      contents: `학과: "${majorQuery}", 지역: ${targetRegions}, 성적: ${scorePrompt}`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              universityName: { type: Type.STRING },
              departmentName: { type: Type.STRING },
              location: { type: Type.STRING },
              regionCategory: { type: Type.STRING, enum: ["SEOUL", "CAPITAL", "OTHER"] },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              stats: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    year: { type: Type.INTEGER },
                    quotaSuSi: { type: Type.INTEGER },
                    quotaJeongSi: { type: Type.INTEGER },
                    competitionRateSuSi: { type: Type.NUMBER },
                    competitionRateJeongSi: { type: Type.NUMBER },
                    cutoffGPA: { type: Type.NUMBER },
                    cutoffCSAT: { type: Type.NUMBER }
                  },
                  required: ["year", "quotaSuSi", "quotaJeongSi", "competitionRateSuSi", "competitionRateJeongSi", "cutoffGPA", "cutoffCSAT"]
                }
              }
            },
            required: ["id", "universityName", "departmentName", "location", "regionCategory", "tags", "stats"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("AI 응답 데이터가 없습니다.");

    return JSON.parse(jsonText) as UniversityData[];

  } catch (error) {
    console.error("Gemini API Error:", error);
    // ✅ 에러 발생 시 구체적인 원인을 알 수 있도록 에러를 던집니다.
    throw new Error("AI 정보를 불러오는 중 실패했습니다. API 키나 모델 설정을 확인하세요.");
  }
};
