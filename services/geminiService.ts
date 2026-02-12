// 1. 라이브러리 임포트 (이름을 GoogleGenerativeAI로 정확히 씁니다)
import { GoogleGenerativeAI } from "@google/genai";
import { UniversityData, SearchOptions } from "../types";

// 2. Vercel 설정과 연결되는 API Key 가져오기
// 'import.meta.env'를 사용해야 Vite 앱이 Vercel의 환경 변수를 읽어올 수 있습니다.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''; 

// 3. AI 객체 생성 (라이브러리 양식에 맞게 수정)
const genAI = new GoogleGenerativeAI(apiKey);

// 4. (중요) 아래쪽 코드에서 'ai'라는 이름을 쓰고 있다면 아래처럼 정의하세요.
// 그러면 파일 하단의 나머지 코드를 고칠 필요가 없습니다.
const ai = genAI;

export const fetchUniversityData = async (majorQuery: string, options: SearchOptions): Promise<UniversityData[]> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  // 지역 조건 텍스트 생성
  const regionNames = {
    SEOUL: "서울권",
    CAPITAL: "수도권(경기/인천)",
    OTHER: "지방권(지거국 및 기타)"
  };
  
  const targetRegions = options.regions.length > 0 
    ? options.regions.map(r => regionNames[r]).join(", ")
    : "전국 모든 지역";

  // 성적 조건 텍스트 생성
  let scorePrompt = "";
  if (options.scoreType === 'GPA' && options.scoreValue) {
    // GPA는 낮을수록 좋음. 입력값이 2.0이면 2.0 ~ 9.0 (더 입결이 낮은 학교) 검색
    scorePrompt = `검색 기준 내신: **${options.scoreValue}등급**. (중요: **${options.scoreValue}등급 ~ 9.0등급** 사이의 '70% 컷'을 가진 대학 위주로 나열하세요. 입력된 등급으로 지원 가능한 **적정/안정권(내신 컷이 입력값보다 숫자가 큰)** 학교를 찾아야 합니다.)`;
  } else if (options.scoreType === 'CSAT' && options.scoreValue) {
    // 수능은 높을수록 좋음. 입력값이 80이면 80 ~ 0 (더 입결이 낮은 학교) 검색
    scorePrompt = `검색 기준 수능: **${options.scoreValue}%**. (중요: **${options.scoreValue}% ~ 0%** 사이의 '70% 컷'을 가진 대학 위주로 나열하세요. 입력된 점수로 지원 가능한 **적정/안정권(수능 컷이 입력값보다 낮은)** 학교를 찾아야 합니다.)`;
  } else {
    scorePrompt = "성적 무관하게 해당 학과가 유명한 주요 대학 위주로 다양하게 추천해주세요.";
  }

  const systemInstruction = `
    당신은 대한민국 2026년도 대학 입시 전문가입니다. 
    사용자가 '학과'를 입력하면, 해당 학과 또는 유사한 관련 학과가 있는 대학들의 리스트를 제공해야 합니다.
    
    **중요: 캠퍼스 분리 원칙**
    - **본교와 분교(제2캠퍼스)는 반드시 서로 다른 독립된 학교로 취급해야 합니다.**
    - 예: '중앙대학교'와 '중앙대학교(다빈치/안성)', '연세대학교'와 '연세대학교(미래)', '고려대학교'와 '고려대학교(세종)', '한양대학교'와 '한양대학교(ERICA)'.
    - 분교나 캠퍼스는 universityName에 반드시 캠퍼스 명을 명시하세요 (예: "한양대학교(ERICA)").
    - 각 캠퍼스는 위치(location)와 입시 결과(stats)가 완전히 다르므로 정확히 구분해서 데이터를 생성하세요.

    **검색 조건:**
    1. **목표 지역**: ${targetRegions} 위주로 찾아주세요.
    2. **성적 반영**: ${scorePrompt}
    3. **데이터 양**: 조건에 맞는 학교를 최대한 많이(최소 25개 이상) 나열하세요.
    
    **데이터 생성 규칙 (매우 중요 - 정밀성 요구):**
    1. **지역 분류**: regionCategory를 'SEOUL'(서울), 'CAPITAL'(경기/인천), 'OTHER'(그 외 지방) 중 하나로 정확히 분류하세요.
    2. **데이터 분리**: 
       - 모집인원: '수시(quotaSuSi)', '정시(quotaJeongSi)' 분리.
       - 경쟁률: '수시(competitionRateSuSi)', '정시(competitionRateJeongSi)' 분리.
    3. **점수 기준 - '상위 70% 컷' (70% Cutoff) 사용**:
       - 모든 점수는 **최종 등록자 기준 상위 70% 컷(10명 중 7등의 성적)**을 기준으로 반환하세요. 평균값이 아닙니다.
       - **내신 컷(cutoffGPA)**: 수시 **학생부교과** 전형 기준 70% 컷. (예: 2.61)
       - **수능 컷(cutoffCSAT)**: 정시 **일반전형** 기준 국/수/탐 **백분위 평균** 70% 컷. (예: 86.8)
    4. **연도별 데이터**: 
       - 2025년 데이터: 2025학년도 입시 결과 (2024년 말 시행). 아직 최종 발표 전이라면, 배치표 상의 예상 70% 컷을 사용하세요.
       - 2024년 데이터: 2024학년도 입시 결과 (확정치). 대입정보포털(어디가) 기준 70% 컷을 사용하세요.
    5. 생성된 값은 매 요청마다 가능한 한 일관성을 유지하도록, 알려진 입시 결과값(예: 아주대 2025 내신 2.6 등)에 가깝게 생성하세요.
  `;

  const prompt = `학과: "${majorQuery}"
  선택 지역: ${targetRegions}
  성적 정보: ${scorePrompt}
  
  위 조건에 맞는 대학 리스트를 JSON으로 반환해줘. 캠퍼스 구분 철저히 해줘. 2024년, 2025년 데이터 모두 포함해줘.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
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
              universityName: { type: Type.STRING, description: "대학명 (캠퍼스 포함)" },
              departmentName: { type: Type.STRING },
              location: { type: Type.STRING },
              regionCategory: { type: Type.STRING, enum: ["SEOUL", "CAPITAL", "OTHER"] },
              tags: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              description: { type: Type.STRING },
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
                    cutoffGPA: { type: Type.NUMBER, description: "내신 70% 컷 (1.0~9.0)" },
                    cutoffCSAT: { type: Type.NUMBER, description: "수능 백분위 70% 컷 (0~100)" }
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
    if (!jsonText) {
      throw new Error("No data returned from AI");
    }

    const data = JSON.parse(jsonText) as UniversityData[];
    
    // Initial Sort: Region SEOUL > CAPITAL > OTHER, then GPA (Better rank first)
    const regionScore = { SEOUL: 1, CAPITAL: 2, OTHER: 3 };
    
    data.sort((a, b) => {
      if (regionScore[a.regionCategory] !== regionScore[b.regionCategory]) {
        return regionScore[a.regionCategory] - regionScore[b.regionCategory];
      }
      // Compare based on the latest year available
      const aStats = a.stats.sort((x, y) => y.year - x.year)[0] || { cutoffGPA: 9 };
      const bStats = b.stats.sort((x, y) => y.year - x.year)[0] || { cutoffGPA: 9 };
      return aStats.cutoffGPA - bStats.cutoffGPA;
    });

    return data;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("입시 정보를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
  }
};
