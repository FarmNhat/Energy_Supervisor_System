import React, { Children } from 'react';
import { motion } from 'framer-motion';
import {
  Tv,
  Lamp,
  Fan,
  Refrigerator,
  AirVent,
  Monitor,
  Speaker,
  Wind,
  WashingMachine,
  Coffee,
  Lightbulb,
  Power } from
'lucide-react';
import { Device, DeviceIconType } from '../hooks/useHomeData';
const iconMap: Record<DeviceIconType, React.ElementType> = {
  Tv,
  Lamp,
  Fan,
  Refrigerator,
  AirVent,
  Monitor,
  Speaker,
  Purifier: Wind,
  Dishwasher: WashingMachine,
  CoffeeMaker: Coffee,
  Lightbulb
};
interface DevicePowerBreakdownProps {
  devices: Device[];
}
const containerVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};
const itemVariants = {
  hidden: {
    opacity: 0,
    x: -20
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24
    }
  }
};
export function DevicePowerBreakdown({ devices }: DevicePowerBreakdownProps) {
  const activeDevices = devices.
  filter((d) => d.isOn).
  sort((a, b) => b.powerDraw - a.powerDraw);
  const maxPower = Math.max(...activeDevices.map((d) => d.powerDraw), 1);
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
        delay: 0.3
      }}
      className="bg-white rounded-2xl shadow-soft p-6">

      <h3 className="text-lg font-heading font-bold text-gray-900 mb-6">
        Active Device Power Draw
      </h3>

      {activeDevices.length === 0 ?
      <p className="text-gray-500 text-center py-8">No active devices</p> :

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4">

          {activeDevices.map((device) => {
          const Icon = iconMap[device.iconType] || Power;
          const isHighPower = device.powerDraw > 500;
          const barWidth = device.powerDraw / maxPower * 100;
          return (
            <motion.div
              key={device.id}
              variants={itemVariants}
              className="flex items-center gap-4">

                <div
                className={`p-2 rounded-lg flex-shrink-0 ${isHighPower ? 'bg-amber-50 text-amber-600' : 'bg-warmgreen-50 text-warmgreen-600'}`}>

                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {device.name}
                    </span>
                    <span
                    className={`text-sm font-bold ${isHighPower ? 'text-amber-600' : 'text-warmgreen-600'}`}>

                      {device.powerDraw}W
                    </span>
                  </div>
                  <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
                    <motion.div
                    initial={{
                      width: 0
                    }}
                    animate={{
                      width: `${barWidth}%`
                    }}
                    transition={{
                      duration: 0.8,
                      delay: 0.2,
                      ease: 'easeOut'
                    }}
                    className={`h-full rounded-full ${isHighPower ? 'bg-amber-400' : 'bg-warmgreen-400'}`} />

                  </div>
                </div>
              </motion.div>);

        })}
        </motion.div>
      }
    </motion.div>);

}