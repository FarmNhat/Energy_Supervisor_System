import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell } from
'recharts';
const weeklyData = [
{
  day: 'Mon',
  kwh: 7.2
},
{
  day: 'Tue',
  kwh: 6.8
},
{
  day: 'Wed',
  kwh: 8.1
},
{
  day: 'Thu',
  kwh: 7.5
},
{
  day: 'Fri',
  kwh: 9.2
},
{
  day: 'Sat',
  kwh: 10.5
},
{
  day: 'Sun',
  kwh: 8.8
}];

const totalKwh = weeklyData.reduce((sum, d) => sum + d.kwh, 0);
const todayIndex = new Date().getDay();
const adjustedTodayIndex = todayIndex === 0 ? 6 : todayIndex - 1;
export function WeeklyBarChart() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 24,
        delay: 0.2
      }}
      className="bg-white rounded-2xl shadow-soft p-6 h-full">

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-heading font-bold text-gray-900">
            Weekly Consumption
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Total:{' '}
            <span className="font-semibold text-warmgreen-600">
              {totalKwh.toFixed(1)} kWh
            </span>
          </p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={weeklyData}
            margin={{
              top: 10,
              right: 10,
              left: -10,
              bottom: 0
            }}>

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#9CA3AF',
                fontSize: 12
              }} />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#9CA3AF',
                fontSize: 12
              }}
              tickFormatter={(value) => `${value}`}
              width={30} />

            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)',
                padding: '12px 16px'
              }}
              itemStyle={{
                color: '#1F2937',
                fontWeight: 500
              }}
              labelStyle={{
                color: '#6B7280',
                marginBottom: 4
              }}
              formatter={(value: number) => [`${value} kWh`, 'Usage']} />

            <Bar dataKey="kwh" radius={[8, 8, 0, 0]}>
              {weeklyData.map((_, index) =>
              <Cell
                key={`cell-${index}`}
                fill={index === adjustedTodayIndex ? '#3F7A59' : '#7AB893'} />

              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>);

}