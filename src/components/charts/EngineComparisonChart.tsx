"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface EngineData {
  engine: string;
  visibilityRate: number;
}

interface EngineComparisonChartProps {
  data: EngineData[];
}

const ENGINE_COLORS: Record<string, string> = {
  ChatGPT: "#10B981",
  Perplexity: "#6366F1",
  "Google AI": "#F59E0B",
  Gemini: "#3B82F6",
  Copilot: "#8B5CF6",
};

export function EngineComparisonChart({ data }: EngineComparisonChartProps) {
  return (
    <div className="w-full h-[300px] bg-zinc-900 rounded-lg p-6 border border-zinc-800">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">Visibility by Engine</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="engine" stroke="#71717a" fontSize={12} />
          <YAxis stroke="#71717a" fontSize={12} domain={[0, 100]} unit="%" />
          <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }} />
          <Bar dataKey="visibilityRate" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={ENGINE_COLORS[entry.engine] || "#71717A"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
