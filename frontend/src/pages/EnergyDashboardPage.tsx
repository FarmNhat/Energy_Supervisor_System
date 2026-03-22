import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Clock3, DatabaseZap, Download, ShieldAlert } from 'lucide-react';
import { TelemetryCalculatorPanel } from '../components/TelemetryCalculatorPanel';
import { TelemetrySparkCard } from '../components/TelemetrySparkCard';
import { useHomeData } from '../hooks/useHomeData';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '');

export function EnergyDashboardPage() {
  const { data, latestSnapshot, sensorAlerts, sensorHistory, sensorTransport } = useHomeData();
  const recentPackets = sensorHistory.slice(-8).reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-6xl px-4 py-6 md:py-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-950 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white">
            <BarChart3 className="h-3.5 w-3.5" />
            Telemetry Analytics
          </div>
          <h1 className="mt-4 font-heading text-3xl font-extrabold text-gray-950 md:text-5xl">
            Live stream history for the four real sensor channels.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600 md:text-base">
            The analytics layer now uses the actual receiver feed and builds a rolling in-browser
            history instead of static appliance charts.
          </p>
        </div>

        <a
          href={`${API_BASE_URL}/api/reports/export?limit=240`}
          className="inline-flex items-center gap-2 rounded-full border border-gray-900 px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
          target="_blank"
          rel="noreferrer"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      <section className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-soft backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-warmgreen-50 p-3 text-warmgreen-600">
              <DatabaseZap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Packets</p>
              <p className="font-heading text-3xl font-extrabold text-gray-950">
                {sensorTransport.updateCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-soft backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Connection</p>
              <p className="font-heading text-3xl font-extrabold capitalize text-gray-950">
                {sensorTransport.connectionState}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-soft backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-500">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Freshness</p>
              <p className="font-heading text-2xl font-extrabold text-gray-950">
                {data.sensorSummary.freshnessLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-soft backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-coral-50 p-3 text-coral-500">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Active alerts</p>
              <p className="font-heading text-3xl font-extrabold text-gray-950">
                {sensorAlerts.filter((alert) => alert.level !== 'info').length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TelemetrySparkCard
          label="Temperature"
          unit={sensorTransport.temperatureUnit}
          value={latestSnapshot.temperature}
          displayValue={latestSnapshot.temperature.toFixed(1)}
          description="Rolling trend from the DHT temperature channel."
          color="#EB6559"
          dataKey="temperature"
          history={sensorHistory}
          delay={0.05}
        />
        <TelemetrySparkCard
          label="Humidity"
          unit="%"
          value={latestSnapshot.humidity}
          displayValue={latestSnapshot.humidity.toFixed(1)}
          description="Relative humidity over the recent in-browser window."
          color="#00C8FF"
          dataKey="humidity"
          history={sensorHistory}
          delay={0.1}
        />
        <TelemetrySparkCard
          label="Light"
          unit="%"
          value={latestSnapshot.light}
          displayValue={latestSnapshot.light.toFixed(1)}
          description="Normalized light sensor intensity from the firmware feed."
          color="#F59E0B"
          dataKey="light"
          history={sensorHistory}
          delay={0.15}
        />
        <TelemetrySparkCard
          label="Voltage Feed"
          unit={sensorTransport.voltageMode === 'raw_adc' ? 'ADC' : 'V'}
          value={latestSnapshot.voltage}
          displayValue={
            sensorTransport.voltageMode === 'raw_adc'
              ? latestSnapshot.voltage.toFixed(0)
              : latestSnapshot.voltage.toFixed(2)
          }
          description="Current voltage channel mode inferred from the receiver payload."
          color="#549F75"
          dataKey="voltage"
          history={sensorHistory}
          delay={0.2}
        />
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Recent Packets</p>
          <h2 className="mt-3 font-heading text-2xl font-bold text-gray-950">
            Latest telemetry samples
          </h2>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-cream-200">
            <div className="grid grid-cols-[1.1fr_repeat(4,minmax(0,1fr))] bg-gray-950 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-300">
              <span>Timestamp</span>
              <span>Temp</span>
              <span>Humidity</span>
              <span>Light</span>
              <span>Voltage</span>
            </div>

            <div className="divide-y divide-cream-200 bg-white">
              {recentPackets.length > 0 ? (
                recentPackets.map((packet) => (
                  <div
                    key={packet.sequence}
                    className="grid grid-cols-[1.1fr_repeat(4,minmax(0,1fr))] px-4 py-3 text-sm text-gray-700"
                  >
                    <span className="font-medium text-gray-900">
                      {packet.timestamp ?? packet.chartLabel}
                    </span>
                    <span>{packet.temperature.toFixed(1)}</span>
                    <span>{packet.humidity.toFixed(1)}%</span>
                    <span>{packet.light.toFixed(1)}%</span>
                    <span>
                      {sensorTransport.voltageMode === 'raw_adc'
                        ? packet.voltage.toFixed(0)
                        : packet.voltage.toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-sm text-gray-500">
                  No live packets yet. Start the receiver and publisher to populate the history.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Stream Interpretation</p>
            <h2 className="mt-3 font-heading text-2xl font-bold text-gray-950">
              Current feed assumptions
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-6 text-gray-600">
              <p>
                Temperature unit in use:{' '}
                <span className="font-semibold text-gray-950">{sensorTransport.temperatureUnit}</span>
              </p>
              <p>
                Voltage presentation:{' '}
                <span className="font-semibold text-gray-950">{sensorTransport.voltageMode}</span>
              </p>
              <p>
                Stale threshold:{' '}
                <span className="font-semibold text-gray-950">
                  {sensorTransport.staleAfterSeconds} seconds
                </span>
              </p>
              <p>
                Receiver endpoint:{' '}
                <span className="font-semibold text-gray-950">{sensorTransport.receiverUrl}</span>
              </p>
              <p>
                Realtime mode:{' '}
                <span className="font-semibold text-gray-950">
                  {sensorTransport.pollIntervalSeconds === 0 ? 'WebSocket live stream' : 'HTTP polling'}
                </span>
              </p>
            </div>
          </section>

          <TelemetryCalculatorPanel
            latestSnapshot={latestSnapshot}
            temperatureUnit={sensorTransport.temperatureUnit}
            voltageMode={sensorTransport.voltageMode}
          />
        </div>
      </section>
    </motion.div>
  );
}
