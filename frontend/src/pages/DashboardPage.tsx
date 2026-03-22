import React from 'react';
import { motion } from 'framer-motion';
import { SensorCard } from '../components/SensorCard';
import { useHomeData } from '../hooks/useHomeData';

export function DashboardPage() {
  const { data } = useHomeData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-6xl px-4 py-6 md:py-8"
    >
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.sensors.map((sensor, index) => (
          <SensorCard key={sensor.id} sensor={sensor} delay={0.05 * (index + 1)} />
        ))}
      </section>
    </motion.div>
  );
}
