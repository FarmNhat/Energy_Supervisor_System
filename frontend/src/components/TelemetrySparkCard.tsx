import React from 'react';
import { motion } from 'framer-motion';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TelemetryPoint } from '../hooks/useHomeData';

interface TelemetrySparkCardProps {
  label: string;
  unit: string;
  value: number;
  displayValue: string;
  description: string;
  color: string;
  dataKey: 'temperature' | 'humidity' | 'light' | 'voltage';
  history: TelemetryPoint[];
  delay?: number;
}

const getDomain = (history: TelemetryPoint[], dataKey: TelemetrySparkCardProps['dataKey']) => {
  const values = history.map((entry) => entry[dataKey]);

  if (values.length === 0) {
    return [0, 100];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max(1, (max - min) * 0.2);

  if (min === max) {
    return [min - padding, max + padding];
  }

  return [min - padding, max + padding];
};

export function TelemetrySparkCard({
  label,
  unit,
  value,
  displayValue,
  description,
  color,
  dataKey,
  history,
  delay = 0,
}: TelemetrySparkCardProps) {
  const chartData = history.length > 0 ? history : [{ chartLabel: 'Now', [dataKey]: value }];
  const [minDomain, maxDomain] = getDomain(history.length > 0 ? history : [], dataKey);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-soft backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
            {label}
          </p>
          <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
        </div>
        <div
          className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
          style={{
            backgroundColor: `${color}18`,
            color,
          }}
        >
          Live
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <p className="font-heading text-4xl font-extrabold tracking-tight text-gray-950">
          {displayValue}
          <span className="ml-1 text-base font-semibold text-gray-500">{unit}</span>
        </p>
      </div>

      <div className="mt-5 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.28} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="chartLabel" hide />
            <YAxis hide domain={[minDomain, maxDomain]} />
            <Tooltip
              contentStyle={{
                borderRadius: '16px',
                border: '1px solid rgba(17, 24, 39, 0.08)',
                boxShadow: '0 16px 40px -20px rgba(15, 23, 42, 0.35)',
              }}
              formatter={(nextValue: number) => [`${nextValue.toFixed(unit === 'V' ? 2 : 1)} ${unit}`, label]}
              labelFormatter={(nextLabel) => `Sample ${nextLabel}`}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#spark-${dataKey})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.article>
  );
}
