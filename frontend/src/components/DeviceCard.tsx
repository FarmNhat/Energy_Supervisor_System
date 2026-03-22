import React from 'react';
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
interface DeviceCardProps {
  device: Device;
  onToggle: (id: string) => void;
}
export function DeviceCard({ device, onToggle }: DeviceCardProps) {
  const Icon = iconMap[device.iconType] || Power;
  const isHighPower = device.powerDraw > 500;
  return (
    <motion.div
      variants={{
        hidden: {
          opacity: 0,
          y: 20
        },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 24
          }
        }
      }}
      className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-300 ${device.isOn ? 'bg-white shadow-soft hover:shadow-md' : 'bg-cream-200/50 shadow-none opacity-80'}`}>

      {/* Active Indicator Border */}
      {device.isOn &&
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${isHighPower ? 'bg-amber-400' : 'bg-warmgreen-400'}`} />

      }

      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-2.5 rounded-xl ${device.isOn ? isHighPower ? 'bg-amber-50 text-amber-600' : 'bg-warmgreen-50 text-warmgreen-600' : 'bg-cream-300/50 text-gray-500'}`}>

          <Icon className="w-6 h-6" strokeWidth={2} />
        </div>

        {/* Custom Toggle Switch */}
        <button
          onClick={() => onToggle(device.id)}
          className={`relative w-12 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warmgreen-500 ${device.isOn ? 'bg-warmgreen-500' : 'bg-gray-300'}`}
          aria-pressed={device.isOn}
          aria-label={`Toggle ${device.name}`}>

          <motion.div
            layout
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30
            }}
            className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm"
            style={{
              x: device.isOn ? 20 : 0
            }} />

        </button>
      </div>

      <div>
        <h3
          className={`font-heading font-bold text-lg mb-1 ${device.isOn ? 'text-gray-900' : 'text-gray-600'}`}>

          {device.name}
        </h3>
        <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
          <span
            className={`inline-block w-2 h-2 rounded-full ${device.isOn ? isHighPower ? 'bg-amber-500' : 'bg-warmgreen-500' : 'bg-gray-400'}`} />

          {device.isOn ? `${device.powerDraw}W drawing` : 'Off'}
        </p>
      </div>
    </motion.div>);

}