
import React from 'react';
import { Hexagram } from '../types';

interface Props {
  hexagram: Hexagram;
  movingLine?: number;
  label: string;
}

export const HexagramVisualizer: React.FC<Props> = ({ hexagram, movingLine, label }) => {
  // Lines are stored 0-5 (bottom to top)
  return (
    <div className="flex flex-col items-center p-4 bg-white/50 border border-amber-200 rounded-lg shadow-sm">
      <h3 className="text-xl font-bold mb-4 text-amber-900 underline decoration-amber-300">{label}: {hexagram.name}</h3>
      <div className="flex flex-col-reverse space-y-2 space-y-reverse w-32">
        {hexagram.lines.map((isYang, idx) => {
          const lineNum = idx + 1;
          const isMoving = movingLine === lineNum;
          
          return (
            <div key={idx} className="relative group flex items-center justify-center">
              {isYang ? (
                <div className={`h-3 w-full rounded-sm ${isMoving ? 'bg-red-700 animate-pulse' : 'bg-stone-800'}`}></div>
              ) : (
                <div className="flex justify-between w-full h-3">
                  <div className={`h-3 w-[45%] rounded-sm ${isMoving ? 'bg-red-700 animate-pulse' : 'bg-stone-800'}`}></div>
                  <div className={`h-3 w-[45%] rounded-sm ${isMoving ? 'bg-red-700 animate-pulse' : 'bg-stone-800'}`}></div>
                </div>
              )}
              {isMoving && (
                <span className="absolute -right-8 text-red-600 font-bold text-lg">●</span>
              )}
              <span className="absolute -left-6 text-xs text-stone-400">{lineNum}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-stone-600 text-sm flex gap-4">
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg">{hexagram.upper.symbol}</span>
          <span>{hexagram.upper.name}(上)</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg">{hexagram.lower.symbol}</span>
          <span>{hexagram.lower.name}(下)</span>
        </div>
      </div>
    </div>
  );
};
