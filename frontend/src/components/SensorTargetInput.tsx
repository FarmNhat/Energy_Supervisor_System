import React, { useEffect, useState } from 'react';
import { SensorCardData, SensorKind } from '../hooks/useHomeData';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '');
const CONFIG_URL = `${API_BASE_URL}/api/config/current`;

interface RangeValue {
  min: string;
  max: string;
}

const defaultRanges: Record<SensorKind, RangeValue> = {
  temperature: { min: '20', max: '26' },
  humidity: { min: '40', max: '60' },
  light: { min: '30', max: '80' },
  voltage: { min: '3.0', max: '3.6' },
};

interface SensorTargetInputProps {
  sensor: SensorCardData;
  compact?: boolean;
}

export function SensorTargetInput({ sensor, compact = false }: SensorTargetInputProps) {
  const [syncError, setSyncError] = useState<string | null>(null);
  const [range, setRange] = useState<RangeValue>(() => defaultRanges[sensor.id]);

  useEffect(() => {
    let cancelled = false;
    setRange(defaultRanges[sensor.id]);

    const loadBackendRange = async () => {
      try {
        const response = await fetch(CONFIG_URL, { cache: 'no-store' });

        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const config = payload?.config_summary?.automation_rules_json?.[sensor.id];
        const min = Number(config?.min);
        const max = Number(config?.max);

        if (!cancelled && Number.isFinite(min) && Number.isFinite(max)) {
          setRange({ min: String(min), max: String(max) });
        }
      } catch {
        // Keep local fallback when the backend is unavailable.
      }
    };

    loadBackendRange();

    return () => {
      cancelled = true;
    };
  }, [sensor.id]);

  const updateRange = (key: keyof RangeValue, value: string) => {
    setRange((previous) => ({ ...previous, [key]: value }));
  };

  const syncRange = async () => {
    const min = Number(range.min);
    const max = Number(range.max);

    if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
      setSyncError('Invalid');
      return;
    }

    setSyncError(null);

    try {
      const response = await fetch(CONFIG_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          automation_rules_json: {
            [sensor.id]: {
              min,
              max,
              unit: sensor.unit || undefined,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Range sync failed with ${response.status}`);
      }

      window.dispatchEvent(new Event('energy-supervisor-config-updated'));
    } catch {
      setSyncError('Unsynced');
    }
  };

  const step = sensor.id === 'voltage' ? '0.05' : sensor.id === 'temperature' ? '0.5' : '1';

  return (
    <div>
      <label
        className={`inline-flex items-center gap-2 rounded-2xl border border-cream-200 bg-white ${
          compact ? 'px-3 py-1.5' : 'px-3 py-2'
        }`}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
          Range
        </span>
        <input
          type="number"
          aria-label={`${sensor.label} minimum range`}
          value={range.min}
          onChange={(event) => updateRange('min', event.target.value)}
          onBlur={syncRange}
          step={step}
          disabled={sensor.enabled === false}
          className={`w-12 bg-transparent text-right font-heading font-bold text-gray-950 outline-none disabled:text-gray-400 ${
            compact ? 'text-sm' : 'text-base'
          }`}
        />
        <span className="text-xs font-semibold text-gray-400">-</span>
        <input
          type="number"
          aria-label={`${sensor.label} maximum range`}
          value={range.max}
          onChange={(event) => updateRange('max', event.target.value)}
          onBlur={syncRange}
          step={step}
          disabled={sensor.enabled === false}
          className={`w-12 bg-transparent text-right font-heading font-bold text-gray-950 outline-none disabled:text-gray-400 ${
            compact ? 'text-sm' : 'text-base'
          }`}
        />
        {sensor.unit && <span className="text-xs font-semibold text-gray-500">{sensor.unit}</span>}
      </label>
      {syncError && (
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-coral-600">
          {syncError}
        </p>
      )}
    </div>
  );
}
