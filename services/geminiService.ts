// 1. 기존에 잘 작동하던 'GoogleGenAI'와 'Type'을 그대로 사용합니다.
import { GoogleGenAI, Type } from "@google/genai";
import { UniversityData, SearchOptions } from "../types";

// 2. Vite 환경에 맞게 'import.meta.env'로 수정합니다.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const fetchUniversityData = async (majorQuery: string, options: SearchOptions): Promise<UniversityData[]> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your Vercel Environment Variables.");
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
    scorePrompt = `검색 기준 내신: **${options.scoreValue}등급**. (중요: **${options.scoreValue}등급 ~ 9.0등급** 사이의 '70% 컷'을 가진 대학 위주로 나열하세요. 입력된 등급으로 지원 가능한 **적정/안정권(내신 컷이 입력값보다 숫자가 큰)** 학교를 찾아야 합니다.)`;
  } else if (options.scoreType === 'CSAT' && options.scoreValue) {
    scorePrompt = `검색 기준 수능: **${options.scoreValue}%**. (중요: **${options.scoreValue}% ~ 0%** 사이의 '70% 컷'을 가진 대학 위주로 나열하세요. 입력된 점수로 지원 가능한 **적정/안정권(수능 컷이 입력값보다 낮은)** 학교를 찾아야 합니다.)`;
  } else {
    scorePrompt = "성적 무관하게 해당 학과가 유명한 주요 대학 위주로 다양하게 추천해주세요.";
  }

  const systemInstruction = `
    당신은 대한민국 2026년도 대학 입시 전문가입니다. 
    사용자가 '학과'를 입력하면 대학 리스트를 제공하세요. 캠퍼스 분리 원칙을 준수하세요.
  `;

  const prompt = `학과: "${majorQuery}"
  선택 지역: ${targetRegions}
  성적 정보: ${scorePrompt}
  위 조건에 맞는 대학 리스트를 JSON으로 반환해줘.`;

  try {
    // 3. 모델 이름은 안정적인 'gemini-1.5-flash'를 사용합니다.
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
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
    if (!jsonText) throw new Error("No data returned");

    const data = JSON.parse(jsonText) as UniversityData[];
    return data;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("입시 정보를 불러오는 중 오류가 발생했습니다.");
  }
};
