import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
interface LightLevelIndicatorProps {
  percentage: number;
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
}
export function LightLevelIndicator({
  percentage,
  timeOfDay
}: LightLevelIndicatorProps) {
  const isDaytime = timeOfDay === 'Morning' || timeOfDay === 'Afternoon';
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
        duration: 0.5,
        delay: 0.2
      }}
      className="bg-white rounded-2xl p-5 shadow-soft flex flex-col justify-center">

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full ${isDaytime ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'}`}>

            {isDaytime ?
            <Sun className="w-5 h-5" /> :

            <Moon className="w-5 h-5" />
            }
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Natural Light</p>
            <p className="text-sm font-heading font-bold text-gray-900">
              {timeOfDay}
            </p>
          </div>
        </div>
        <span className="text-xl font-heading font-bold text-gray-900">
          {percentage}%
        </span>
      </div>

      <div className="w-full h-2 bg-cream-100 rounded-full overflow-hidden">
        <motion.div
          initial={{
            width: 0
          }}
          animate={{
            width: `${percentage}%`
          }}
          transition={{
            duration: 1,
            delay: 0.5,
            type: 'spring'
          }}
          className={`h-full rounded-full ${isDaytime ? 'bg-amber-400' : 'bg-indigo-400'}`} />

      </div>
    </motion.div>);

}