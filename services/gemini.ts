
import { GoogleGenAI, Type } from "@google/genai";
import { DivinationResult, Hexagram } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

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

1. 上卦（外卦）详析：不仅说明其象征（如天、地、雷等），更要分析其在《高岛易断》体系中代表的“外势”、“对方”、“未来趋势”或“社会环境”。
2. 下卦（内卦）详析：深度解析其代表的“内因”、“自我”、“根基”或“当前心境”，以及它如何承载上卦。
3. 卦象大象（综合解析）：详细描述上下卦相遇产生的化学反应。解析该卦的“卦德”，说明为何以此命名，并引用《高岛易断》中关于此卦象的经典论述。
4. 彖传精解：结合用户的具体问题，用你高岛吞象特有的逻辑（如“至诚”理论）分析彖辞，指出局势的转捩点。
5. 动爻（第${movingLine}爻）与变卦：解析该爻辞的微言大义。必须结合变卦“${changedHex.name}”的特性，说明动爻如何导致了性质的转化。
6. 高岛式断语：给出极其明确、毫无模棱两可的断语。包括：吉凶判定、具体的行动策略、时机把握。
7. 后续建议：基于当前卦意，提出3个用户应该进一步思考或追问的深度方向。

输出必须为JSON格式。
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          upperTrigramDetail: { type: Type.STRING, description: "上卦及其外势影响的深度解析" },
          lowerTrigramDetail: { type: Type.STRING, description: "下卦及其内在根基的深度解析" },
          imagery: { type: Type.STRING, description: "整体卦象、卦德及高岛经典论述" },
          judgement: { type: Type.STRING, description: "彖辞精解与局势转捩点分析" },
          lineInterpretation: { type: Type.STRING, description: "动爻辞、变卦关联及性质转化解析" },
          overallAdvice: { type: Type.STRING, description: "高岛式明确断语与具体策略建议" },
          followUps: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "后续深度探究点"
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

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text || "解析遇阻，请诚心再问。";
}
