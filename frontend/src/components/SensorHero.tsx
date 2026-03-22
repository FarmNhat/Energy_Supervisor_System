import React from 'react';
import {
  Activity,
  Clock3,
  ShieldCheck,
  TriangleAlert,
  Waves,
} from 'lucide-react';
import { SensorSummary } from '../hooks/useHomeData';

interface SensorHeroProps {
  homeName: string;
  currentDate: string;
  summary: SensorSummary;
}

export function SensorHero({ homeName, currentDate, summary }: SensorHeroProps) {
  const StatusIcon = summary.state === 'live' ? ShieldCheck : TriangleAlert;
  const statusText =
    summary.state === 'live'
      ? 'Live receiver connected'
      : summary.state === 'stale'
        ? 'Receiver reachable, data stale'
        : 'Receiver offline';
  const statusDotClassName =
    summary.state === 'live'
      ? 'bg-warmgreen-400 shadow-[0_0_12px_rgba(122,184,147,0.85)]'
      : summary.state === 'stale'
        ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.75)]'
        : 'bg-coral-400 shadow-[0_0_12px_rgba(240,138,129,0.75)]';

  return (
    <section className="relative overflow-hidden rounded-[32px] bg-gray-950 px-6 py-7 text-white shadow-soft md:px-8 md:py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(122,184,147,0.24),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(240,138,129,0.18),_transparent_32%)]" />
      <div className="panel-grid-overlay" />

      <div className="relative grid gap-6 xl:grid-cols-[1.45fr_0.85fr] xl:items-start">
        <div>
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-gray-400">
              {homeName}
            </p>
            <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight text-white md:text-5xl">
              A fixed dashboard for a fixed 4-sensor node.
            </h1>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-100">
              <Activity className="h-4 w-4 text-warmgreen-400" />
              <span>{summary.maxSensors}/{summary.maxSensors} sensor slots fixed</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-100">
              <Clock3 className="h-4 w-4 text-amber-300" />
              <span>{summary.freshnessLabel}</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-100">
              <span className={`h-2.5 w-2.5 rounded-full ${statusDotClassName}`} />
              <span>{statusText}</span>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-gray-400">
                Live status
              </p>
              <h2 className="mt-3 font-heading text-2xl font-bold text-white">
                {summary.headline}
              </h2>
            </div>
            <div
              className={`rounded-2xl p-3 ${
                summary.state === 'live'
                  ? 'bg-warmgreen-500/10 text-warmgreen-300'
                  : summary.state === 'stale'
                    ? 'bg-amber-500/10 text-amber-300'
                    : 'bg-coral-500/10 text-coral-300'
              }`}
            >
              <StatusIcon className="h-6 w-6" />
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-gray-300">{summary.note}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Last packet</p>
              <p className="mt-2 text-sm font-medium text-white">{summary.lastUpdatedLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Calendar</p>
              <p className="mt-2 text-sm font-medium text-white">{currentDate}</p>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-gray-500">
              <Waves className="h-3.5 w-3.5" />
              Watchlist
            </div>
            <ul className="mt-3 grid max-h-40 min-h-40 content-start gap-2 overflow-y-auto pr-1 text-sm text-gray-200">
              {summary.watchlist.map((item) => (
                <li
                  key={item}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 leading-6 break-words"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
