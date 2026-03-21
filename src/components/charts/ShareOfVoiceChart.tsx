"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ShareOfVoice } from "@/lib/utils/share-of-voice";

const COLORS = ["#10B981", "#EF4444", "#F59E0B", "#6366F1", "#8B5CF6", "#EC4899"];

interface ShareOfVoiceChartProps {
  data: ShareOfVoice[];
  brandDomain: string;
}

export function ShareOfVoiceChart({ data, brandDomain }: ShareOfVoiceChartProps) {
  const chartData = data.map((d) => ({
    name: d.brandDomain === brandDomain ? `${d.brandDomain} (You)` : d.brandDomain,
    value: d.percentage,
  }));

  return (
    <div className="w-full h-[350px] bg-zinc-900 rounded-lg p-6 border border-zinc-800">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">Share of Voice</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
