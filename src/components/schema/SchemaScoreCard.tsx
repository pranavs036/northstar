interface SchemaScoreCardProps {
  score: number;
  label: string;
}

function getScoreConfig(score: number): { color: string; bgColor: string; rating: string } {
  if (score <= 30) {
    return { color: "text-error", bgColor: "bg-error/10", rating: "Poor" };
  }
  if (score <= 60) {
    return { color: "text-warning", bgColor: "bg-warning/10", rating: "Needs Work" };
  }
  if (score <= 80) {
    return { color: "text-info", bgColor: "bg-info/10", rating: "Good" };
  }
  return { color: "text-success", bgColor: "bg-success/10", rating: "Excellent" };
}

export function SchemaScoreCard({ score, label }: SchemaScoreCardProps) {
  const { color, bgColor, rating } = getScoreConfig(score);

  return (
    <div className={`${bgColor} border border-border rounded-xl p-8 text-center`}>
      <p className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
        {label}
      </p>
      <p className={`text-7xl font-bold ${color} mb-2`}>{score}</p>
      <p className="text-lg text-text-tertiary">/ 100</p>
      <span
        className={`inline-block mt-3 px-4 py-1 rounded-full text-sm font-semibold ${color} ${bgColor} border border-current border-opacity-30`}
      >
        {rating}
      </span>
    </div>
  );
}
