import React, { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { SensorSnapshot } from '../hooks/useHomeData';

interface TelemetryCalculatorPanelProps {
  latestSnapshot: SensorSnapshot;
  temperatureUnit: '°C' | '°F';
  voltageMode: 'volts' | 'raw_adc';
}

type TargetKey = 'temperature' | 'humidity' | 'light' | 'voltage';

interface TargetState {
  temperature: number;
  humidity: number;
  light: number;
  voltage: number;
}

const buildDefaultTargets = (
  temperatureUnit: TelemetryCalculatorPanelProps['temperatureUnit'],
  voltageMode: TelemetryCalculatorPanelProps['voltageMode'],
): TargetState => ({
  temperature: temperatureUnit === '°F' ? 72 : 22,
  humidity: 50,
  light: 60,
  voltage: voltageMode === 'raw_adc' ? 2048 : 3.3,
});

const tolerances = {
  temperature: {
    celsius: 2,
    fahrenheit: 3.5,
  },
  humidity: 8,
  light: 12,
  voltage: {
    volts: 0.2,
    raw_adc: 180,
  },
};

function formatReading(
  key: TargetKey,
  value: number,
  temperatureUnit: TelemetryCalculatorPanelProps['temperatureUnit'],
  voltageMode: TelemetryCalculatorPanelProps['voltageMode'],
) {
  if (key === 'temperature') {
    return `${value.toFixed(1)}${temperatureUnit}`;
  }

  if (key === 'humidity' || key === 'light') {
    return `${value.toFixed(1)}%`;
  }

  if (voltageMode === 'raw_adc') {
    return `${value.toFixed(0)} ADC`;
  }

  return `${value.toFixed(2)}V`;
}

export function TelemetryCalculatorPanel({
  latestSnapshot,
  temperatureUnit,
  voltageMode,
}: TelemetryCalculatorPanelProps) {
  const [targets, setTargets] = useState<TargetState>(() =>
    buildDefaultTargets(temperatureUnit, voltageMode),
  );

  const rows = useMemo(() => {
    const nextRows = [
      {
        id: 'temperature' as const,
        label: 'Temperature',
        live: latestSnapshot.temperature,
        target: targets.temperature,
        tolerance:
          temperatureUnit === '°F'
            ? tolerances.temperature.fahrenheit
            : tolerances.temperature.celsius,
      },
      {
        id: 'humidity' as const,
        label: 'Humidity',
        live: latestSnapshot.humidity,
        target: targets.humidity,
        tolerance: tolerances.humidity,
      },
      {
        id: 'light' as const,
        label: 'Light',
        live: latestSnapshot.light,
        target: targets.light,
        tolerance: tolerances.light,
      },
      {
        id: 'voltage' as const,
        label: voltageMode === 'raw_adc' ? 'Voltage Feed' : 'Voltage',
        live: latestSnapshot.voltage,
        target: targets.voltage,
        tolerance:
          voltageMode === 'raw_adc' ? tolerances.voltage.raw_adc : tolerances.voltage.volts,
      },
    ];

    return nextRows.map((row) => {
      const drift = row.live - row.target;
      const withinBand = Math.abs(drift) <= row.tolerance;
      return {
        ...row,
        drift,
        withinBand,
        status: withinBand ? 'Aligned' : drift > 0 ? 'Above target' : 'Below target',
      };
    });
  }, [latestSnapshot, targets, temperatureUnit, voltageMode]);

  const alignedCount = rows.filter((row) => row.withinBand).length;

  const updateTarget = (key: TargetKey, nextValue: string) => {
    const parsed = Number.parseFloat(nextValue);
    setTargets((previous) => ({
      ...previous,
      [key]: Number.isFinite(parsed) ? parsed : 0,
    }));
  };

  return (
    <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-warmgreen-50 p-3 text-warmgreen-600">
          <Calculator className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Live calculator</p>
          <h2 className="mt-3 font-heading text-2xl font-bold text-gray-950">
            Telemetry calculator
          </h2>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Adjust the reference values and compare them against the latest sensor packet without
            leaving the analytics page.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <label className="rounded-[24px] border border-cream-200 bg-cream-50/80 p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Temperature target
          </span>
          <input
            type="number"
            value={targets.temperature}
            onChange={(event) => updateTarget('temperature', event.target.value)}
            step={temperatureUnit === '°F' ? '1' : '0.5'}
            className="mt-3 w-full rounded-2xl border border-cream-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200"
          />
        </label>

        <label className="rounded-[24px] border border-cream-200 bg-cream-50/80 p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Humidity target
          </span>
          <input
            type="number"
            value={targets.humidity}
            onChange={(event) => updateTarget('humidity', event.target.value)}
            step="1"
            className="mt-3 w-full rounded-2xl border border-cream-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200"
          />
        </label>

        <label className="rounded-[24px] border border-cream-200 bg-cream-50/80 p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            Light target
          </span>
          <input
            type="number"
            value={targets.light}
            onChange={(event) => updateTarget('light', event.target.value)}
            step="1"
            className="mt-3 w-full rounded-2xl border border-cream-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200"
          />
        </label>

        <label className="rounded-[24px] border border-cream-200 bg-cream-50/80 p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            {voltageMode === 'raw_adc' ? 'Voltage ADC target' : 'Voltage target'}
          </span>
          <input
            type="number"
            value={targets.voltage}
            onChange={(event) => updateTarget('voltage', event.target.value)}
            step={voltageMode === 'raw_adc' ? '10' : '0.05'}
            className="mt-3 w-full rounded-2xl border border-cream-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200"
          />
        </label>
      </div>

      <div className="mt-6 rounded-[24px] border border-warmgreen-100 bg-warmgreen-50/80 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-warmgreen-700">Reference summary</p>
        <p className="mt-2 font-heading text-3xl font-extrabold text-gray-950">
          {alignedCount}/4
        </p>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          sensor channels are currently within the comparison tolerance against your reference set.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex flex-col gap-3 rounded-[24px] border border-cream-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h3 className="font-heading text-lg font-bold text-gray-950">{row.label}</h3>
              <p className="mt-1 text-sm text-gray-600">
                Live {formatReading(row.id, row.live, temperatureUnit, voltageMode)} against target{' '}
                {formatReading(row.id, row.target, temperatureUnit, voltageMode)}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-heading text-2xl font-extrabold text-gray-950">
                {row.drift >= 0 ? '+' : ''}
                {formatReading(row.id, row.drift, temperatureUnit, voltageMode)}
              </p>
              <p
                className={`mt-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                  row.withinBand ? 'text-warmgreen-700' : 'text-coral-600'
                }`}
              >
                {row.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
