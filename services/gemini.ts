
import { GoogleGenAI, Type } from "@google/genai";
import { DivinationResult, Hexagram } from "../types.ts";

// 每次调用时创建新实例，确保获取最新的环境变量
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export async function analyzeDivination(
  question: string,
  originalHex: Hexagram,
  changedHex: Hexagram,
  movingLine: number
): Promise<DivinationResult['analysis']> {
  const prompt = `
你现在是“易圣”高岛吞象（Kaemon Takashima），请严格基于你的著作《高岛易断》对以下卦象进行深度、专业且极其详尽的解析。

用户已占得以下卦象：
问卜问题：${question}
本卦：${originalHex.name}
上卦（外卦/悔）：${originalHex.upper.name}（${originalHex.upper.nature}）
下卦（内卦/贞）：${originalHex.lower.name}（${originalHex.lower.nature}）
动爻：第${movingLine}爻
变卦：${changedHex.name}

请按照以下结构提供深度解析，文字需考究、古雅，且具备《高岛易断》特有的实务指导意义（特别是政治、商业、军事视角的运用）：

1. 上卦（外卦）详析：不仅说明其象征，更要分析其在《高岛易断》体系中代表的“外势”、“对方”、“未来趋势”。
2. 下卦（内卦）详析：深度解析其代表的“内因”、“自我”、“根基”或“当前心境”。
3. 卦象大象（综合解析）：详细描述上下卦相遇产生的化学反应。解析该卦的“卦德”，并引用《高岛易断》中的论述。
4. 彖传精解：结合用户具体问题，用“至诚”理论分析彖辞，指出局势的转捩点。
5. 动爻（第${movingLine}爻）与变卦：解析该爻辞的微言大义，说明动爻如何导致了性质的转化。
6. 高岛式断语：给出明确的断语（吉凶、策略、时机）。
7. 后续建议：提出3个深度追问的方向。

输出必须为JSON格式。
`;

  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview", // 切换为 Flash 提升额度和速度
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          upperTrigramDetail: { type: Type.STRING },
          lowerTrigramDetail: { type: Type.STRING },
          imagery: { type: Type.STRING },
          judgement: { type: Type.STRING },
          lineInterpretation: { type: Type.STRING },
          overallAdvice: { type: Type.STRING },
          followUps: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }
          }
        },
        required: ["upperTrigramDetail", "lowerTrigramDetail", "imagery", "judgement", "lineInterpretation", "overallAdvice", "followUps"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function askFollowUp(
  context: DivinationResult,
  followUpQuestion: string
): Promise<string> {
  const prompt = `
作为占卜大师高岛吞象，请基于你之前对卦象【${context.originalHex.name}】动【${context.movingLine}】爻的解析，回答用户针对该结果的进一步追问。

背景：
问卜：${context.question}
综合断语要点：${context.analysis.overallAdvice}

用户追加提问：${followUpQuestion}
请给出更具针对性、不离《高岛易断》宗旨的深度解答。
`;

  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text || "解析遇阻，请诚心再问。";
}
