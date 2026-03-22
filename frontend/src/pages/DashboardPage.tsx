import React from 'react';
import { motion } from 'framer-motion';
import { Header } from '../components/Header';
import { EnergyOverview } from '../components/EnergyOverview';
import { RoomSection } from '../components/RoomSection';
import { AiTips } from '../components/AiTips';
import { useHomeData } from '../hooks/useHomeData';
export function DashboardPage() {
  const { data, toggleDevice } = useHomeData();
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      exit={{
        opacity: 0,
        y: -10
      }}
      transition={{
        duration: 0.3
      }}
      className="max-w-6xl mx-auto px-4 py-6 md:py-8">

      <Header
        homeName={data.homeName}
        monthlyCost={data.monthlyCost}
        costTrend={data.costTrend}
        currentDate={data.currentDate} />


      <EnergyOverview data={data} />

      <div className="space-y-2 mt-10">
        {data.rooms.map((room) =>
        <RoomSection
          key={room.id}
          room={room}
          onToggleDevice={toggleDevice} />

        )}
      </div>

      <div className="mt-12">
        <AiTips tips={data.aiTips} />
      </div>
    </motion.div>);

}