import React from 'react';
import { Thermometer } from 'lucide-react';
import { motion } from 'framer-motion';
interface TemperatureIndicatorProps {
  current: number;
  target: number;
  comfortLevel: 'Comfortable' | 'Warm' | 'Cool';
}
export function TemperatureIndicator({
  current,
  target,
  comfortLevel
}: TemperatureIndicatorProps) {
  const isComfortable = comfortLevel === 'Comfortable';
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
        delay: 0.1
      }}
      className="bg-white rounded-2xl p-5 shadow-soft flex items-center gap-4">

      <div
        className={`p-3 rounded-full ${isComfortable ? 'bg-warmgreen-50 text-warmgreen-500' : 'bg-amber-50 text-amber-500'}`}>

        <Thermometer className="w-8 h-8" />
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-end mb-1">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">
              Indoor Climate
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-bold text-gray-900">
                {current}°
              </span>
              <span className="text-sm text-gray-400 font-medium">
                Target {target}°
              </span>
            </div>
          </div>
        </div>
        <p
          className={`text-sm font-medium ${isComfortable ? 'text-warmgreen-600' : 'text-amber-600'}`}>

          {comfortLevel}
        </p>
      </div>
    </motion.div>);

}