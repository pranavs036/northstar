"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface TrendDataPoint {
  date: string;
  visibilityScore: number;
  chatgpt: number;
  perplexity: number;
  google: number;
  gemini: number;
  copilot: number;
}

interface VisibilityTrendChartProps {
  data: TrendDataPoint[];
}

const ENGINE_COLORS: Record<string, string> = {
  chatgpt: "#10B981",
  perplexity: "#6366F1",
  google: "#F59E0B",
  gemini: "#3B82F6",
  copilot: "#8B5CF6",
  visibilityScore: "#EF4444",
};

export function VisibilityTrendChart({ data }: VisibilityTrendChartProps) {
  return (
    <div className="w-full h-[400px] bg-zinc-900 rounded-lg p-6 border border-zinc-800">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">Visibility Over Time</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
          <YAxis stroke="#71717a" fontSize={12} domain={[0, 100]} />
          <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }} />
          <Legend />
          <Line type="monotone" dataKey="visibilityScore" stroke={ENGINE_COLORS.visibilityScore} name="Overall Score" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="chatgpt" stroke={ENGINE_COLORS.chatgpt} name="ChatGPT" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="perplexity" stroke={ENGINE_COLORS.perplexity} name="Perplexity" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="google" stroke={ENGINE_COLORS.google} name="Google AI" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="gemini" stroke={ENGINE_COLORS.gemini} name="Gemini" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="copilot" stroke={ENGINE_COLORS.copilot} name="Copilot" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
