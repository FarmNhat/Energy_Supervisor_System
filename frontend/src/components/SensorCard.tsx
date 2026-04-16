import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Droplets, SunMedium, Thermometer } from 'lucide-react';
import { SensorCardData, SensorKind, SensorSeverity } from '../hooks/useHomeData';
import { SensorTargetInput } from './SensorTargetInput';

interface SensorCardProps {
  sensor: SensorCardData;
  delay?: number;
}

const sensorTheme: Record<
  SensorKind,
  {
    icon: React.ElementType;
    iconClassName: string;
    glowClassName: string;
    fillClassName: string;
  }
> = {
  temperature: {
    icon: Thermometer,
    iconClassName: 'bg-coral-50 text-coral-500',
    glowClassName:
      'bg-[radial-gradient(circle_at_top_left,_rgba(240,138,129,0.28),_transparent_38%)]',
    fillClassName: 'bg-coral-400',
  },
  humidity: {
    icon: Droplets,
    iconClassName: 'bg-[#E6F9FE] text-[#0891B2]',
    glowClassName:
      'bg-[radial-gradient(circle_at_top_left,_rgba(0,200,255,0.24),_transparent_38%)]',
    fillClassName: 'bg-[#00C8FF]',
  },
  light: {
    icon: SunMedium,
    iconClassName: 'bg-amber-50 text-amber-500',
    glowClassName:
      'bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.26),_transparent_40%)]',
    fillClassName: 'bg-amber-400',
  },
  voltage: {
    icon: Activity,
    iconClassName: 'bg-warmgreen-50 text-warmgreen-600',
    glowClassName:
      'bg-[radial-gradient(circle_at_top_left,_rgba(122,184,147,0.28),_transparent_38%)]',
    fillClassName: 'bg-warmgreen-500',
  },
};

const severityClassNames: Record<SensorSeverity, string> = {
  healthy: 'border-warmgreen-100 bg-warmgreen-50 text-warmgreen-700',
  warning: 'border-amber-100 bg-amber-50 text-amber-700',
  critical: 'border-coral-100 bg-coral-50 text-coral-700',
};

export function SensorCard({ sensor, delay = 0 }: SensorCardProps) {
  const theme = sensorTheme[sensor.id];
  const Icon = theme.icon;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur-sm"
    >
      <div className={`absolute inset-0 ${theme.glowClassName}`} />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">
            {sensor.label}
          </p>
          <p className="mt-2 max-w-xs text-sm leading-6 text-gray-600">
            {sensor.description}
          </p>
        </div>
        <div className={`rounded-2xl p-3 ${theme.iconClassName}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <div className="relative mt-10 flex items-end justify-between gap-4">
        <div>
          <p className="font-heading text-5xl font-extrabold tracking-tight text-gray-950">
            {sensor.displayValue}
            <span className="ml-1 text-xl font-semibold text-gray-500">{sensor.unit}</span>
          </p>
          <div className="mt-3">
            <SensorTargetInput sensor={sensor} />
          </div>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${severityClassNames[sensor.severity]}`}
        >
          {sensor.statusLabel}
        </span>
      </div>

      <div className="relative mt-6">
        <div className="h-2 overflow-hidden rounded-full bg-cream-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${sensor.fillPercent}%` }}
            transition={{ duration: 0.6, delay: delay + 0.1 }}
            className={`h-full rounded-full ${theme.fillClassName}`}
          />
        </div>
      </div>
    </motion.article>
  );
}
