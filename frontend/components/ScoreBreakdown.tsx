interface ScoreBreakdownProps {
  breakdown: Record<string, number>;
  teamScore: number;
}

export default function ScoreBreakdown({ breakdown, teamScore }: ScoreBreakdownProps) {
  const criteriaNames = Object.keys(breakdown || {});

  if (criteriaNames.length === 0) {
    return (
      <div className="p-4 bg-gray-50 text-xs text-gray-500 italic">
        No detailed criterion breakdown available for this team.
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-50/70 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Criterion Score Contribution Breakdown
        </h4>
        <span className="text-xs font-mono font-semibold text-gray-600">
          Total Score: {teamScore.toFixed(1)} pts
        </span>
      </div>

      <div className="space-y-2.5">
        {criteriaNames.map((criterion) => {
          const points = Number(breakdown[criterion] || 0);
          const percentage =
            teamScore > 0 ? Math.min(100, Math.max(0, (points / teamScore) * 100)).toFixed(1) : '0';

          return (
            <div key={criterion} className="flex items-center gap-3 text-xs">
              <span className="w-40 sm:w-52 truncate font-medium text-gray-700" title={criterion}>
                {criterion}
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, points))}%` }}
                />
              </div>
              <span className="w-16 text-right font-mono font-semibold text-gray-900">
                {points.toFixed(1)} pts
              </span>
              <span className="w-16 text-right text-gray-500 font-mono text-[11px]">
                {percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}