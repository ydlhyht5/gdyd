
import React, { useState, useCallback } from 'react';
import { TRIGRAMS, HEXAGRAM_NAMES } from './constants';
import { Hexagram, DivinationResult } from './types';
import { analyzeDivination, askFollowUp } from './services/gemini';
import { HexagramVisualizer } from './components/HexagramVisualizer';

const App: React.FC = () => {
  const [upperId, setUpperId] = useState<number>(1);
  const [lowerId, setLowerId] = useState<number>(8);
  const [movingLine, setMovingLine] = useState<number>(1);
  const [question, setQuestion] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [followUpResponse, setFollowUpResponse] = useState<string | null>(null);
  const [followUpLoading, setFollowUpLoading] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getHexagram = useCallback((u: number, l: number): Hexagram => {
    const upper = TRIGRAMS[u];
    const lower = TRIGRAMS[l];
    const nameKey = `${u}-${l}`;
    const name = HEXAGRAM_NAMES[nameKey] || HEXAGRAM_NAMES[`${l}-${u}_alt`] || "未知卦";
    
    return {
      name,
      upper,
      lower,
      lines: [...lower.lines, ...upper.lines]
    };
  }, []);

  const handleDivination = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      alert("请先输入您卜卦时所问的问题，以便大师依理分析。");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setFollowUpResponse(null);

    try {
      const originalHex = getHexagram(upperId, lowerId);
      
      const changedLines = [...originalHex.lines];
      changedLines[movingLine - 1] = changedLines[movingLine - 1] === 1 ? 0 : 1;
      
      const newLowerLines = changedLines.slice(0, 3);
      const newUpperLines = changedLines.slice(3, 6);
      
      const findTrigramId = (lines: number[]) => {
        return Object.values(TRIGRAMS).find(t => t.lines.every((v, i) => v === lines[i]))?.id || 1;
      };
      
      const newUpperId = findTrigramId(newUpperLines);
      const newLowerId = findTrigramId(newLowerLines);
      const changedHex = getHexagram(newUpperId, newLowerId);

      const analysis = await analyzeDivination(question, originalHex, changedHex, movingLine);
      
      setResult({
        question,
        originalHex,
        changedHex,
        movingLine,
        analysis
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "大师解析受阻，请检查 API 配置或稍后再试。");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResult = () => {
    if (!result) return;
    const text = `
【高岛易断·解卦报告】
问卜之事：${result.question}
本卦：${result.originalHex.name} (动第${result.movingLine}爻)
变卦：${result.changedHex.name}

[卦象解析]
${result.analysis.imagery}

[爻辞解析]
${result.analysis.lineInterpretation}

[核心断语]
${result.analysis.overallAdvice}

—— 依高岛吞象“至诚”原理推演 ——
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleFollowUp = async (q: string) => {
    if (!result) return;
    setFollowUpLoading(true);
    try {
      const resp = await askFollowUp(result, q);
      setFollowUpResponse(resp);
    } catch (err) {
      alert("解析失败，请再问一次。");
    } finally {
      setFollowUpLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-6xl mx-auto">
      {/* Header */}
      <header className="text-center mb-10 animate-fade-in w-full">
        <h1 className="text-4xl md:text-6xl font-bold text-stone-800 mb-2 tracking-tight">高岛易断</h1>
        <p className="text-stone-500 italic tracking-[0.2em] text-sm md:text-lg">至诚感神 · 专业解卦系统</p>
        <div className="h-1 w-24 md:w-32 bg-amber-900 mx-auto mt-4"></div>
      </header>

      {error && (
        <div className="w-full max-w-2xl mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
          <p className="font-bold">解析出错</p>
          <p className="text-sm">{error}</p>
          <button onClick={() => setError(null)} className="mt-2 text-xs underline">清除错误</button>
        </div>
      )}

      {/* Input Section */}
      {!result && (
        <section className="w-full max-w-2xl bg-white/80 backdrop-blur-md p-6 md:p-10 border border-stone-200 rounded-3xl shadow-2xl transition-all">
          <div className="mb-8 p-4 bg-amber-50/50 rounded-xl border border-amber-100 text-amber-900 text-xs md:text-sm flex gap-3 items-center">
            <span className="text-2xl">📜</span>
            <p>本系统严格依照《高岛易断》原理，录入您已得出的卦象数据，大师将为您剥茧抽丝，指点迷津。</p>
          </div>
          
          <form onSubmit={handleDivination} className="space-y-8">
            <div className="space-y-3">
              <label className="block text-sm font-bold text-stone-600 ml-1">当初问卜之事 (问题内容)</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例如：本次与某公司的合作前景如何？"
                className="w-full p-4 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all h-32 bg-stone-50/50 text-stone-800 text-lg placeholder:text-stone-300 shadow-inner"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">上卦 (悔)</label>
                <select 
                  value={upperId} 
                  onChange={(e) => setUpperId(Number(e.target.value))}
                  className="w-full p-3 border border-stone-200 rounded-xl bg-white shadow-sm focus:border-amber-500 outline-none appearance-none cursor-pointer"
                >
                  {Object.values(TRIGRAMS).map(t => (
                    <option key={t.id} value={t.id}>{t.id}. {t.name} ({t.nature})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">下卦 (贞)</label>
                <select 
                  value={lowerId} 
                  onChange={(e) => setLowerId(Number(e.target.value))}
                  className="w-full p-3 border border-stone-200 rounded-xl bg-white shadow-sm focus:border-amber-500 outline-none appearance-none cursor-pointer"
                >
                  {Object.values(TRIGRAMS).map(t => (
                    <option key={t.id} value={t.id}>{t.id}. {t.name} ({t.nature})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest ml-1">动爻 (位)</label>
                <select 
                  value={movingLine} 
                  onChange={(e) => setMovingLine(Number(e.target.value))}
                  className="w-full p-3 border border-stone-200 rounded-xl bg-white shadow-sm focus:border-amber-500 outline-none appearance-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>第 {n} 爻动</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 bg-stone-800 text-amber-50 rounded-2xl font-bold text-xl hover:bg-stone-700 transform transition-all active:scale-[0.98] flex justify-center items-center gap-3 shadow-xl hover:shadow-amber-900/10 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-3 border-amber-200 border-t-transparent rounded-full animate-spin"></div>
                  <span>大师正在研读易理...</span>
                </>
              ) : "提交解析"}
            </button>
          </form>
        </section>
      )}

      {/* Result Section */}
      {result && (
        <section className="w-full animate-fade-in-up space-y-8 pb-24">
          <div className="flex justify-between items-center px-2">
            <button 
              onClick={() => {setResult(null); setFollowUpResponse(null);}}
              className="text-stone-500 font-bold hover:text-amber-900 flex items-center gap-2 group transition-colors"
            >
              <span className="text-xl transition-transform group-hover:-translate-x-1">↩</span> 重新解析
            </button>
            <button 
              onClick={handleCopyResult}
              className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold transition-all ${copySuccess ? 'bg-green-100 text-green-700' : 'bg-amber-900 text-amber-50 hover:bg-amber-800 shadow-md'}`}
            >
              {copySuccess ? "✓ 已复制全文" : "📋 复制解析报告"}
            </button>
          </div>

          <div className="bg-white/95 border border-stone-200 p-6 md:p-14 rounded-[2.5rem] shadow-2xl space-y-12">
            {/* Hexagram Display Area */}
            <div className="flex flex-col lg:flex-row justify-around items-center gap-10 border-b border-stone-100 pb-12">
              <HexagramVisualizer label="本卦 (体)" hexagram={result.originalHex} movingLine={result.movingLine} />
              <div className="flex flex-col items-center">
                <div className="text-5xl text-amber-700/20 animate-pulse hidden lg:block">→</div>
                <div className="text-3xl text-amber-700/20 animate-pulse lg:hidden">↓</div>
                <div className="text-xs text-stone-400 mt-2 font-bold tracking-[0.3em]">动则有变</div>
              </div>
              <HexagramVisualizer label="变卦 (用)" hexagram={result.changedHex} />
            </div>

            {/* Trigram Details Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-stone-50 p-6 md:p-8 rounded-3xl border-l-8 border-stone-800 shadow-sm">
                <h4 className="flex items-center gap-3 text-xl font-bold text-stone-800 mb-4">
                  <span className="text-amber-700 text-3xl font-serif">{result.originalHex.upper.symbol}</span>
                  上卦 (外势): {result.originalHex.upper.name}
                </h4>
                <div className="text-stone-600 leading-relaxed font-serif text-lg">
                  {result.analysis.upperTrigramDetail}
                </div>
              </div>
              <div className="bg-stone-50 p-6 md:p-8 rounded-3xl border-l-8 border-stone-800 shadow-sm">
                <h4 className="flex items-center gap-3 text-xl font-bold text-stone-800 mb-4">
                  <span className="text-amber-700 text-3xl font-serif">{result.originalHex.lower.symbol}</span>
                  下卦 (内因): {result.originalHex.lower.name}
                </h4>
                <div className="text-stone-600 leading-relaxed font-serif text-lg">
                  {result.analysis.lowerTrigramDetail}
                </div>
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-12">
                <section>
                  <h4 className="text-2xl font-bold text-amber-900 mb-5 flex items-center gap-2">
                    <div className="w-1.5 h-8 bg-amber-900 rounded-full"></div>
                    卦象大象
                  </h4>
                  <p className="text-stone-800 leading-relaxed text-lg text-justify font-serif indent-8">
                    {result.analysis.imagery}
                  </p>
                </section>
                <section>
                  <h4 className="text-2xl font-bold text-amber-900 mb-5 flex items-center gap-2">
                    <div className="w-1.5 h-8 bg-amber-900 rounded-full"></div>
                    彖辞判定
                  </h4>
                  <p className="text-stone-800 leading-relaxed text-lg text-justify font-serif indent-8">
                    {result.analysis.judgement}
                  </p>
                </section>
              </div>
              
              <div className="space-y-12">
                <section>
                  <h4 className="text-2xl font-bold text-amber-900 mb-5 flex items-center gap-2">
                    <div className="w-1.5 h-8 bg-amber-900 rounded-full"></div>
                    动爻与变卦分析
                  </h4>
                  <p className="text-stone-800 leading-relaxed text-lg text-justify font-serif indent-8">
                    {result.analysis.lineInterpretation}
                  </p>
                </section>
                
                <div className="bg-stone-900 text-amber-50 p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group border-4 border-amber-900/30">
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">☯</div>
                  <h4 className="text-2xl font-bold text-amber-400 mb-6 underline underline-offset-8 decoration-amber-900">
                    高岛易断 · 核心指引
                  </h4>
                  <p className="text-2xl leading-relaxed font-serif italic tracking-wide">
                    “{result.analysis.overallAdvice}”
                  </p>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            <div className="pt-10 border-t border-stone-100">
              <h4 className="text-xl font-bold text-stone-800 mb-6 flex items-center gap-3">
                <span className="p-2 bg-amber-100 rounded-lg text-amber-900">🕯️</span>
                追本溯源：大师建议探究
              </h4>
              <div className="flex flex-wrap gap-4">
                {result.analysis.followUps.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => handleFollowUp(f)}
                    className="px-6 py-4 bg-white hover:bg-stone-800 text-stone-700 hover:text-amber-50 rounded-2xl border border-stone-200 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 text-sm md:text-base font-medium"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Follow-up Output */}
            {(followUpLoading || followUpResponse) && (
              <div className="mt-12 p-8 md:p-12 bg-stone-900 text-stone-100 rounded-[3rem] shadow-2xl border border-amber-500/20 relative">
                <h5 className="font-bold text-amber-400 mb-6 italic text-2xl flex items-center gap-3">
                   <span className="text-3xl">✒️</span> 大师深度解析：
                </h5>
                {followUpLoading ? (
                  <div className="flex items-center gap-4 py-6">
                    <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce [animation-delay:-.3s]"></div>
                    <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce [animation-delay:-.5s]"></div>
                    <span className="text-amber-200 animate-pulse ml-2">正在依理推演后续天机...</span>
                  </div>
                ) : (
                  <div className="leading-loose text-xl whitespace-pre-wrap font-serif opacity-90">
                    {followUpResponse}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-auto py-12 text-stone-400 text-sm flex flex-col items-center gap-4 w-full">
        <div className="h-px w-full max-w-xs bg-gradient-to-r from-transparent via-stone-200 to-transparent"></div>
        <div className="text-center">
          <p className="tracking-[0.4em] font-bold text-stone-300 mb-1 uppercase">高岛易断 · AI 深度解析</p>
          <p className="text-xs opacity-50 tracking-widest">易理精微 · 至诚无息 · 仅供学术交流</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
