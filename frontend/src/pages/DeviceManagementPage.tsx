import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, RadioTower } from 'lucide-react';
import { useHomeData } from '../hooks/useHomeData';

const alertClassNames = {
  info: 'border-gray-200 bg-white text-gray-700',
  warning: 'border-amber-100 bg-amber-50 text-amber-700',
  critical: 'border-coral-100 bg-coral-50 text-coral-700',
};

const sensorStateClassNames = {
  healthy: 'bg-warmgreen-50 text-warmgreen-700',
  warning: 'bg-amber-50 text-amber-700',
  critical: 'bg-coral-50 text-coral-700',
};

export function DeviceManagementPage() {
  const { data, sensorAlerts, sensorTransport } = useHomeData();
  const liveMonitorAlerts = sensorAlerts.slice(0, 5);

  const systemStages = [
    {
      id: '01',
      title: 'ESP32 sensors',
      detail: 'Temperature, humidity, light, and voltage channels are sampled on the node every 2 seconds.',
    },
    {
      id: '02',
      title: 'MQTT broker',
      detail: `The node publishes to ${sensorTransport.topic} on ${sensorTransport.brokerLabel}.`,
    },
    {
      id: '03',
      title: 'Python backend',
      detail: 'FastAPI ingests MQTT directly for storage and alerts, while json_gen.py keeps a fallback sensors.json feed.',
    },
    {
      id: '04',
      title: 'Operator UI',
      detail:
        sensorTransport.pollIntervalSeconds === 0
          ? `The frontend is attached to the backend WebSocket stream and keeps ${sensorTransport.receiverUrl} as the REST fallback.`
          : `The frontend polls ${sensorTransport.receiverUrl} every ${sensorTransport.pollIntervalSeconds} seconds and falls back to the JSON feed if the API is unavailable.`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-6xl px-4 py-6 md:py-8"
    >
      <section className="rounded-[32px] bg-gray-950 px-6 py-7 text-white shadow-soft md:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-gray-300">
              <Cpu className="h-3.5 w-3.5" />
              Sensor Operations
            </div>
            <h1 className="mt-4 font-heading text-3xl font-extrabold md:text-5xl">
              A readout for the real node, not a fake appliance grid.
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">Fixed channels</p>
              <p className="mt-2 font-heading text-3xl font-extrabold text-white">4</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">Stream state</p>
              <p className="mt-2 font-heading text-2xl font-extrabold text-white">
                {data.sensorSummary.state}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">MQTT topic</p>
              <p className="mt-2 text-sm font-semibold text-white">{sensorTransport.topic}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">Receiver</p>
              <p className="mt-2 text-sm font-semibold text-white">{sensorTransport.receiverUrl}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Channel Inventory</p>
              <h2 className="mt-3 font-heading text-2xl font-bold text-gray-950">
                Four sensor
              </h2>
            </div>
            <div className="rounded-2xl bg-gray-950 p-3 text-white">
              <RadioTower className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {data.sensors.map((sensor, index) => (
              <motion.article
                key={sensor.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="rounded-[26px] border border-cream-200 bg-cream-50/70 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-heading font-bold text-gray-950">{sensor.label}</h3>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${sensorStateClassNames[sensor.severity]}`}
                      >
                        {sensor.statusLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{sensor.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                      <span className="rounded-full bg-white px-3 py-1">{sensor.sourceLabel}</span>
                      <span className="rounded-full bg-white px-3 py-1">{sensor.rangeLabel}</span>
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="font-heading text-4xl font-extrabold tracking-tight text-gray-950">
                      {sensor.displayValue}
                      <span className="ml-1 text-base font-semibold text-gray-500">{sensor.unit}</span>
                    </p>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-gray-600 md:ml-auto">
                      {sensor.helperText}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Transport Path</p>
                <h2 className="font-heading text-2xl font-bold text-gray-950">End-to-end data flow</h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {systemStages.map((stage) => (
                <div key={stage.id} className="flex gap-4 rounded-[24px] border border-cream-200 bg-cream-50/70 p-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gray-950 font-heading text-sm font-bold text-white">
                    {stage.id}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-900">
                      {stage.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{stage.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur-sm">
            <div className="flex items-center gap-3">
  
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Latest signals</p>
                <h2 className="font-heading text-2xl font-bold text-gray-950">Live-monitor</h2>
              </div>
            </div>

            <div className="mt-6 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
              {liveMonitorAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-[22px] border p-4 ${alertClassNames[alert.level]}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">{alert.level}</p>
                  <h3 className="mt-2 font-heading text-lg font-bold">{alert.title}</h3>
                  <p className="mt-2 text-sm leading-6">{alert.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-warmgreen-50 p-3 text-warmgreen-600">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Receiver Notes</p>
                <h2 className="font-heading text-2xl font-bold text-gray-950">Current assumptions</h2>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm leading-6 text-gray-600">
              <p>Temperature is displayed using the incoming payload scale and auto-detects Celsius vs Fahrenheit when needed.</p>
              <p>Light is treated as a relative 0-100 signal, not an absolute lux measurement.</p>
              <p>
                Voltage mode: <span className="font-semibold text-gray-900">{sensorTransport.voltageMode}</span>.
                {sensorTransport.voltageMode === 'raw_adc'
                  ? ' The current firmware feed is unscaled, so the UI avoids pretending it is a physical voltage.'
                  : ' The feed looks like a converted voltage reading and is displayed in volts.'}
              </p>
            </div>
          </section>
        </div>
      </section>
    </motion.div>
  );
}
