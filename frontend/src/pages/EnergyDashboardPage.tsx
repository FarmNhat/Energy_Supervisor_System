import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Zap, Clock, TrendingDown, DollarSign } from 'lucide-react';
import { useHomeData } from '../hooks/useHomeData';
import { EnergyChart } from '../components/EnergyChart';
import { WeeklyBarChart } from '../components/WeeklyBarChart';
import { DevicePowerBreakdown } from '../components/DevicePowerBreakdown';
import { CostCalculator } from '../components/CostCalculator';
export function EnergyDashboardPage() {
  const { devices } = useHomeData();
  const currentPower = devices.
  filter((d) => d.isOn).
  reduce((sum, d) => sum + d.powerDraw, 0);
  // Mock projected cost based on current usage
  const projectedMonthlyCost = (currentPower / 1000 * 8 * 30 * 0.12).toFixed(
    2
  );
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      exit={{
        opacity: 0,
        y: -10
      }}
      transition={{
        duration: 0.3
      }}
      className="max-w-6xl mx-auto px-4 py-6 md:py-8">

      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-warmgreen-100 text-warmgreen-600 rounded-xl">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          Energy Analytics
        </h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.05
          }}
          className="bg-white rounded-2xl shadow-soft p-5">

          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-warmgreen-50 text-warmgreen-600 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-500 font-medium">
              Current Power
            </span>
          </div>
          <p className="text-2xl font-heading font-bold text-gray-900">
            {currentPower}
            <span className="text-base font-normal text-gray-500 ml-1">W</span>
          </p>
        </motion.div>

        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.1
          }}
          className="bg-white rounded-2xl shadow-soft p-5">

          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-50 text-amber-500 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-500 font-medium">
              Today's Usage
            </span>
          </div>
          <p className="text-2xl font-heading font-bold text-gray-900">
            8.4
            <span className="text-base font-normal text-gray-500 ml-1">
              kWh
            </span>
          </p>
        </motion.div>

        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.15
          }}
          className="bg-white rounded-2xl shadow-soft p-5">

          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-warmgreen-50 text-warmgreen-600 rounded-lg">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-500 font-medium">This Week</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-heading font-bold text-gray-900">
              52.1
              <span className="text-base font-normal text-gray-500 ml-1">
                kWh
              </span>
            </p>
            <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-warmgreen-50 text-warmgreen-600">
              -12%
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{
            opacity: 0,
            y: 20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            delay: 0.2
          }}
          className="bg-white rounded-2xl shadow-soft p-5">

          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-coral-50 text-coral-500 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-sm text-gray-500 font-medium">
              Projected Cost
            </span>
          </div>
          <p className="text-2xl font-heading font-bold text-gray-900">
            ${projectedMonthlyCost}
            <span className="text-base font-normal text-gray-500 ml-1">
              /mo
            </span>
          </p>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <EnergyChart />
        <WeeklyBarChart />
      </div>

      {/* Device Breakdown */}
      <div className="mb-8">
        <DevicePowerBreakdown devices={devices} />
      </div>

      {/* Cost Calculator */}
      <CostCalculator devices={devices} />
    </motion.div>);

}