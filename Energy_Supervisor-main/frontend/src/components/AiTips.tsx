import React, { Children } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Sparkles } from 'lucide-react';
interface AiTipsProps {
  tips: string[];
}
const containerVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
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
export function AiTips({ tips }: AiTipsProps) {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-6 px-2">
        <Sparkles className="w-5 h-5 text-amber-500" />
        <h2 className="text-xl font-heading font-bold text-gray-900">
          Smart Suggestions
        </h2>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{
          once: true
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {tips.map((tip, index) =>
        <motion.div
          key={index}
          variants={itemVariants}
          className="bg-amber-50/80 border border-amber-100/50 rounded-xl p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow">

            <div className="flex-shrink-0 mt-1">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Lightbulb className="w-4 h-4" />
              </div>
            </div>
            <p className="text-gray-700 font-medium text-sm leading-relaxed">
              {tip}
            </p>
          </motion.div>
        )}
      </motion.div>
    </section>);

}