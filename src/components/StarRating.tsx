import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { SATISFACTION_LEVELS } from '../constants/levels';

interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
}

export default function StarRating({ rating, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  // The "active" score is whichever is set: hover takes priority, then selection.
  const activeScore = hovered || rating;

  return (
    <div className="space-y-4 p-4 border border-slate-200 bg-slate-50/50 rounded text-left">
      <label className="text-[11px] font-mono uppercase tracking-wider font-extrabold text-kerala-navy flex items-center gap-1.5">
        <Star className="w-3.5 h-3.5 text-kerala-gold" />
        <span>Rate Our Service</span>
      </label>

      <div className="space-y-3">
        <span className="block text-[11px] font-bold uppercase tracking-wide text-slate-600 font-sans">
          How satisfied are you with our service? <span className="text-kerala-red font-bold">*</span>
        </span>

        <div className="grid grid-cols-5 gap-2">
          {SATISFACTION_LEVELS.map((level) => {
            const filled = activeScore >= level.score;
            return (
              <button
                key={level.score}
                type="button"
                onClick={() => onChange(level.score)}
                onMouseEnter={() => setHovered(level.score)}
                onMouseLeave={() => setHovered(0)}
                className={`p-3 border flex flex-col items-center justify-center transition-all duration-150 cursor-pointer rounded bg-white hover:border-kerala-gold/60 active:scale-95 touch-manipulation min-h-[60px] ${
                  rating === level.score
                    ? 'border-kerala-gold bg-kerala-gold/5 scale-[1.02] shadow-sm'
                    : 'border-slate-200'
                }`}
                title={level.label}
              >
                <Star
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-100 ${
                    filled ? 'text-kerala-gold fill-current' : 'text-slate-200'
                  }`}
                />
                <span className="text-[9px] font-mono font-bold tracking-tight text-slate-400 mt-1 uppercase text-center truncate w-full hidden sm:inline">
                  {level.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected rating label */}
        <div className="h-5 flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400">Selected Rating:</span>
          {activeScore > 0 ? (
            <span className={`uppercase tracking-wider px-2 py-0.5 border rounded ${
              rating > 0
                ? 'text-kerala-navy font-extrabold bg-kerala-gold/10 border-kerala-gold/30'
                : 'text-slate-500 italic border-slate-200'
            }`}>
              {hovered > 0 ? 'Select: ' : ''}{SATISFACTION_LEVELS[activeScore - 1].label}
            </span>
          ) : (
            <span className="text-slate-400 italic">No score selected</span>
          )}
        </div>
      </div>
    </div>
  );
}
