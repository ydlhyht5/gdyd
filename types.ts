
export interface Trigram {
  id: number;
  name: string;
  symbol: string;
  nature: string;
  lines: number[]; // 1 for Yang, 0 for Yin (from bottom to top)
}

export interface Hexagram {
  name: string;
  upper: Trigram;
  lower: Trigram;
  lines: number[];
}

export interface DivinationResult {
  question: string;
  originalHex: Hexagram;
  changedHex: Hexagram;
  movingLine: number;
  analysis: {
    upperTrigramDetail: string;
    lowerTrigramDetail: string;
    imagery: string;
    judgement: string;
    lineInterpretation: string;
    overallAdvice: string;
    followUps: string[];
  };
}
