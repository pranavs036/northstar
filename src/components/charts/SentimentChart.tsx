"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface SentimentChartProps {
  positive: number;
  neutral: number;
  negative: number;
}

export function SentimentChart({ positive, neutral, negative }: SentimentChartProps) {
  const data = [
    { name: "Positive", count: positive, color: "#10B981" },
    { name: "Neutral", count: neutral, color: "#71717A" },
    { name: "Negative", count: negative, color: "#EF4444" },
  ];

  return (
    <div className="w-full h-[250px] bg-zinc-900 rounded-lg p-6 border border-zinc-800">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">Brand Sentiment</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
          <YAxis stroke="#71717a" fontSize={12} />
          <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
