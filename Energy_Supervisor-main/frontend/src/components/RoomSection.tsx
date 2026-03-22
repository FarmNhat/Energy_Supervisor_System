import React, { Children } from 'react';
import { motion } from 'framer-motion';
import { Sofa, Bed, CookingPot } from 'lucide-react';
import { Room, RoomIconType } from '../hooks/useHomeData';
import { DeviceCard } from './DeviceCard';
const roomIconMap: Record<RoomIconType, React.ElementType> = {
  Sofa,
  Bed,
  CookingPot
};
interface RoomSectionProps {
  room: Room;
  onToggleDevice: (id: string) => void;
}
const containerVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};
export function RoomSection({ room, onToggleDevice }: RoomSectionProps) {
  const Icon = roomIconMap[room.iconType];
  // Calculate active devices and total power
  const activeDevicesCount = room.devices.filter((d) => d.isOn).length;
  const totalPower = room.devices.reduce(
    (acc, curr) => curr.isOn ? acc + curr.powerDraw : acc,
    0
  );
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 20
      }}
      whileInView={{
        opacity: 1,
        y: 0
      }}
      viewport={{
        once: true,
        margin: '-50px'
      }}
      transition={{
        duration: 0.6
      }}
      className="mb-8">

      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cream-200 text-gray-700 rounded-lg">
            <Icon className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-heading font-bold text-gray-900">
            {room.name}
          </h2>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-500">
            {activeDevicesCount} active • {totalPower}W
          </p>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{
          once: true
        }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

        {room.devices.map((device) =>
        <DeviceCard
          key={device.id}
          device={device}
          onToggle={onToggleDevice} />

        )}
      </motion.div>
    </motion.section>);

}