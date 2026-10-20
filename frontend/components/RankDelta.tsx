import { ArrowUp, ArrowDown, Minus, Sparkles, LogOut } from 'lucide-react';

interface RankDeltaProps {
  delta?: number;
  enteredTopX?: boolean;
  leftTopX?: boolean;
}

export default function RankDelta({
  delta = 0,
  enteredTopX = false,
  leftTopX = false,
}: RankDeltaProps) {
  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      {delta > 0 && (
        <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
          <ArrowUp size={12} className="mr-0.5 text-emerald-600" /> +{delta}
        </span>
      )}

      {delta < 0 && (
        <span className="inline-flex items-center text-xs font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
          <ArrowDown size={12} className="mr-0.5 text-rose-600" /> {delta}
        </span>
      )}

      {delta === 0 && (
        <span className="inline-flex items-center text-xs text-gray-400 font-mono">
          <Minus size={12} />
        </span>
      )}

      {enteredTopX && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
          <Sparkles size={10} /> Entered Top X
        </span>
      )}

      {leftTopX && (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide uppercase bg-rose-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
          <LogOut size={10} /> Left Top X
        </span>
      )}
    </div>
  );
}