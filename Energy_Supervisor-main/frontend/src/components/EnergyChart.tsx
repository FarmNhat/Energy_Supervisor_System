import React from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer } from
'recharts';
const hourlyData = [
{
  hour: '12am',
  watts: 280
},
{
  hour: '1am',
  watts: 250
},
{
  hour: '2am',
  watts: 220
},
{
  hour: '3am',
  watts: 200
},
{
  hour: '4am',
  watts: 210
},
{
  hour: '5am',
  watts: 280
},
{
  hour: '6am',
  watts: 520
},
{
  hour: '7am',
  watts: 850
},
{
  hour: '8am',
  watts: 1100
},
{
  hour: '9am',
  watts: 920
},
{
  hour: '10am',
  watts: 680
},
{
  hour: '11am',
  watts: 620
},
{
  hour: '12pm',
  watts: 580
},
{
  hour: '1pm',
  watts: 550
},
{
  hour: '2pm',
  watts: 520
},
{
  hour: '3pm',
  watts: 580
},
{
  hour: '4pm',
  watts: 720
},
{
  hour: '5pm',
  watts: 1050
},
{
  hour: '6pm',
  watts: 1350
},
{
  hour: '7pm',
  watts: 1480
},
{
  hour: '8pm',
  watts: 1320
},
{
  hour: '9pm',
  watts: 980
},
{
  hour: '10pm',
  watts: 650
},
{
  hour: '11pm',
  watts: 420
}];

export function EnergyChart() {
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
        delay: 0.1
      }}
      className="bg-white rounded-2xl shadow-soft p-6 h-full">

      <h3 className="text-lg font-heading font-bold text-gray-900 mb-4">
        Today's Usage Pattern
      </h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={hourlyData}
            margin={{
              top: 10,
              right: 10,
              left: -10,
              bottom: 0
            }}>

            <defs>
              <linearGradient id="wattGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7AB893" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7AB893" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#9CA3AF',
                fontSize: 12
              }}
              interval={5} />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: '#9CA3AF',
                fontSize: 12
              }}
              tickFormatter={(value) => `${value}W`}
              width={50} />

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
              formatter={(value: number) => [`${value}W`, 'Power']} />

            <Area
              type="monotone"
              dataKey="watts"
              stroke="#549F75"
              strokeWidth={2}
              fill="url(#wattGradient)" />

          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>);

}