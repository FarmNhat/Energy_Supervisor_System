import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, Power } from 'lucide-react';
import { DeviceControlState, DeviceControlStatus } from '../hooks/useHomeData';

interface DeviceControlPanelProps {
  control: DeviceControlStatus;
  onUpdate: (updates: Partial<DeviceControlState>) => Promise<void>;
}

const controls: Array<{
  key: keyof DeviceControlState;
  label: string;
}> = [
  {
    key: 'device1',
    label: 'Device 1',
  },
  {
    key: 'device2',
    label: 'Device 2',
  },
  {
    key: 'device3',
    label: 'Device 3',
  },
];

export function DeviceControlPanel({ control, onUpdate }: DeviceControlPanelProps) {
  const activeCount = controls.filter((item) => control[item.key] === 1).length;

  return (
    <section className="mt-6 rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-warmgreen-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-warmgreen-700">
            <Cpu className="h-3.5 w-3.5" />
            Control Dashboard
          </div>
          <h2 className="mt-4 font-heading text-3xl font-extrabold text-gray-950">
            Control Dashboard
          </h2>
        </div>

        <div className="rounded-[24px] border border-cream-200 bg-cream-50/80 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Active outputs</p>
          <p className="mt-2 font-heading text-3xl font-extrabold text-gray-950">{activeCount}/3</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {controls.map((item, index) => {
          const isOn = control[item.key] === 1;

          return (
            <motion.article
              key={item.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`rounded-[24px] border p-4 transition-colors ${
                isOn
                  ? 'border-warmgreen-100 bg-warmgreen-50/90'
                  : 'border-cream-200 bg-cream-50/80'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-heading text-xl font-bold text-gray-950">
                    {item.label}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdate({ [item.key]: isOn ? 0 : 1 })}
                  className={`relative h-8 w-14 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warmgreen-500 ${
                    isOn ? 'bg-warmgreen-500' : 'bg-gray-300'
                  }`}
                  aria-label={`Toggle ${item.label}`}
                >
                  <motion.span
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm"
                    style={{ x: isOn ? 24 : 0 }}
                  >
                    <Power className={`h-3.5 w-3.5 ${isOn ? 'text-warmgreen-600' : 'text-gray-400'}`} />
                  </motion.span>
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm">
                <span className="font-medium text-gray-500">State</span>
                <span className={`font-heading font-bold ${isOn ? 'text-warmgreen-700' : 'text-gray-500'}`}>
                  {isOn ? 'ON' : 'OFF'}
                </span>
              </div>
            </motion.article>
          );
        })}
      </div>
      {control.publishError && (
        <p className="mt-5 rounded-2xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">
          {control.publishError}
        </p>
      )}
    </section>
  );
}
