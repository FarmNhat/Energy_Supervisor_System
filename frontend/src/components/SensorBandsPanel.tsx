import React from 'react';
import { ActivitySquare, ScanSearch } from 'lucide-react';
import { SensorCardData, SensorKind, SensorSeverity } from '../hooks/useHomeData';

interface SensorBandsPanelProps {
  sensors: SensorCardData[];
}

const fillClassNames: Record<SensorKind, string> = {
  temperature: 'bg-coral-400',
  humidity: 'bg-[#00C8FF]',
  light: 'bg-amber-400',
  voltage: 'bg-warmgreen-500',
};

const severityClassNames: Record<SensorSeverity, string> = {
  healthy: 'bg-warmgreen-50 text-warmgreen-700',
  warning: 'bg-amber-50 text-amber-700',
  critical: 'bg-coral-50 text-coral-700',
};

export function SensorBandsPanel({ sensors }: SensorBandsPanelProps) {
  return (
    <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur-sm md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-cream-200/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-gray-600">
            <ActivitySquare className="h-3.5 w-3.5" />
            Sensor Bands
          </div>
          <h2 className="mt-4 font-heading text-2xl font-bold text-gray-950">
            Channel
          </h2>
        </div>

      </div>

      <div className="mt-6 space-y-4">
        {sensors.map((sensor) => (
          <div
            key={sensor.id}
            className="rounded-[24px] border border-cream-200 bg-cream-50/70 p-4 md:p-5"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-xl">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-heading font-bold text-gray-900">{sensor.label}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${severityClassNames[sensor.severity]}`}
                  >
                    {sensor.statusLabel}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-gray-600">{sensor.helperText}</p>
              </div>

              <div className="text-left md:text-right">
                <p className="font-heading text-3xl font-extrabold tracking-tight text-gray-950">
                  {sensor.displayValue}
                  <span className="ml-1 text-base font-semibold text-gray-500">{sensor.unit}</span>
                </p>
                <p className="mt-1 text-sm font-medium text-gray-500">{sensor.rangeLabel}</p>
              </div>
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white">
              <div
                className={`h-full rounded-full ${fillClassNames[sensor.id]}`}
                style={{ width: `${sensor.fillPercent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
