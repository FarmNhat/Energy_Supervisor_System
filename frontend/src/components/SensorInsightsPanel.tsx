import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface SensorInsightsPanelProps {
  tips: string[];
}

export function SensorInsightsPanel({ tips }: SensorInsightsPanelProps) {
  return (
    <section className="rounded-[32px] bg-gray-950 p-6 text-white shadow-soft md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold text-white">
            Recommendations built for a 4-sensor board.
          </h2>
          <p className="mt-3 text-sm leading-7 text-gray-300">
            The suggestions stay compact because the full live state fits on one page. No hidden
            rooms, no extra tabs, and no paginated widgets.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {tips.map((tip, index) => (
          <motion.div
            key={`${index}-${tip}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06 * index }}
            className="rounded-[24px] border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold text-white">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="flex-1">
                <p className="text-sm leading-7 text-gray-100">{tip}</p>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-gray-500" />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
