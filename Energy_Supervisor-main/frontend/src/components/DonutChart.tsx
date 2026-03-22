import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { EnergyDistribution } from '../hooks/useHomeData';
interface DonutChartProps {
  data: EnergyDistribution[];
}
export function DonutChart({ data }: DonutChartProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.95
      }}
      animate={{
        opacity: 1,
        scale: 1
      }}
      transition={{
        duration: 0.5,
        type: 'spring'
      }}
      className="bg-white rounded-2xl p-6 shadow-soft h-full flex flex-col">

      <h2 className="text-lg font-heading font-bold text-gray-800 mb-4">
        Energy Distribution
      </h2>

      <div className="flex-1 min-h-[200px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              stroke="none">

              {data.map((entry, index) =>
              <Cell key={`cell-${index}`} fill={entry.color} />
              )}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)'
              }}
              itemStyle={{
                color: '#1F2937',
                fontWeight: 500
              }} />

          </PieChart>
        </ResponsiveContainer>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-heading font-bold text-gray-900">
            342
          </span>
          <span className="text-xs text-gray-500 font-medium">kWh total</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {data.map((item) =>
        <div key={item.name} className="flex items-center gap-2">
            <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: item.color
            }} />

            <span className="text-sm text-gray-600 font-medium">
              {item.name}
            </span>
            <span className="text-sm text-gray-400">{item.value}%</span>
          </div>
        )}
      </div>
    </motion.div>);

}