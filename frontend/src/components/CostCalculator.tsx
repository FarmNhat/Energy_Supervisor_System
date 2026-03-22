import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  Tv,
  Lamp,
  Fan,
  Refrigerator,
  AirVent,
  Monitor,
  Speaker,
  Wind,
  WashingMachine,
  Coffee,
  Lightbulb,
  Power,
  AlertTriangle } from
'lucide-react';
import { Device, DeviceIconType } from '../hooks/useHomeData';
const iconMap: Record<DeviceIconType, React.ElementType> = {
  Tv,
  Lamp,
  Fan,
  Refrigerator,
  AirVent,
  Monitor,
  Speaker,
  Purifier: Wind,
  Dishwasher: WashingMachine,
  CoffeeMaker: Coffee,
  Lightbulb
};
interface CostCalculatorProps {
  devices: Device[];
}
export function CostCalculator({ devices }: CostCalculatorProps) {
  const [rate, setRate] = useState(0.12);
  const [hoursPerDevice, setHoursPerDevice] = useState<Record<string, number>>(
    () => {
      const initial: Record<string, number> = {};
      devices.forEach((d) => {
        initial[d.id] = d.isOn ? 8 : 0;
      });
      return initial;
    }
  );
  const updateHours = (deviceId: string, hours: number) => {
    setHoursPerDevice((prev) => ({
      ...prev,
      [deviceId]: Math.min(24, Math.max(0, hours))
    }));
  };
  const calculations = useMemo(() => {
    const deviceCosts = devices.map((device) => {
      const hours = hoursPerDevice[device.id] || 0;
      const dailyKwh = device.powerDraw / 1000 * hours;
      const dailyCost = dailyKwh * rate;
      return {
        device,
        hours,
        dailyKwh,
        dailyCost
      };
    });
    const totalDailyCost = deviceCosts.reduce((sum, d) => sum + d.dailyCost, 0);
    const monthlyCost = totalDailyCost * 30;
    const yearlyCost = totalDailyCost * 365;
    return {
      deviceCosts,
      totalDailyCost,
      monthlyCost,
      yearlyCost
    };
  }, [devices, hoursPerDevice, rate]);
  return (
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
        type: 'spring',
        stiffness: 300,
        damping: 24,
        delay: 0.4
      }}
      className="bg-white rounded-2xl shadow-soft p-6">

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-warmgreen-50 text-warmgreen-600 rounded-xl">
          <Calculator className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-heading font-bold text-gray-900">
          Energy Cost Calculator
        </h3>
      </div>

      {/* Rate Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Electricity Rate
        </label>
        <div className="relative max-w-xs">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            $
          </span>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
            step="0.01"
            min="0"
            className="w-full pl-8 pr-16 py-2.5 rounded-xl border border-cream-300 focus:border-warmgreen-400 focus:ring-2 focus:ring-warmgreen-200 outline-none transition-all" />

          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            /kWh
          </span>
        </div>
      </div>

      {/* Device Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-cream-200">
              <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">
                Device
              </th>
              <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">
                Power
              </th>
              <th className="text-center py-3 px-2 text-sm font-medium text-gray-500">
                Hours/Day
              </th>
              <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">
                Daily Cost
              </th>
            </tr>
          </thead>
          <tbody>
            {calculations.deviceCosts.map(({ device, hours, dailyCost }) => {
              const Icon = iconMap[device.iconType] || Power;
              return (
                <tr
                  key={device.id}
                  className="border-b border-cream-100 last:border-0">

                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-900">
                        {device.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm text-gray-600">
                      {device.powerDraw}W
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <input
                      type="number"
                      value={hours}
                      onChange={(e) =>
                      updateHours(device.id, parseFloat(e.target.value) || 0)
                      }
                      min="0"
                      max="24"
                      step="0.5"
                      className="w-16 mx-auto block text-center py-1.5 px-2 rounded-lg border border-cream-300 focus:border-warmgreen-400 focus:ring-1 focus:ring-warmgreen-200 outline-none text-sm" />

                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className="text-sm font-medium text-warmgreen-600">
                      ${dailyCost.toFixed(2)}
                    </span>
                  </td>
                </tr>);

            })}
          </tbody>
        </table>
      </div>

      {/* Results */}
      <div className="bg-cream-50 rounded-xl p-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500 mb-1">Daily</p>
            <p className="text-xl font-heading font-bold text-gray-900">
              ${calculations.totalDailyCost.toFixed(2)}
            </p>
          </div>
          <div className="border-x border-cream-200">
            <p className="text-sm text-gray-500 mb-1">Monthly</p>
            <p className="text-2xl font-heading font-bold text-warmgreen-600">
              ${calculations.monthlyCost.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Yearly</p>
            <p className="text-xl font-heading font-bold text-gray-900">
              ${calculations.yearlyCost.toFixed(2)}
            </p>
          </div>
        </div>

        {calculations.monthlyCost > 100 &&
        <motion.div
          initial={{
            opacity: 0,
            height: 0
          }}
          animate={{
            opacity: 1,
            height: 'auto'
          }}
          className="mt-4 p-4 bg-amber-50 rounded-xl flex items-start gap-3">

            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Tip:</span> Your projected monthly
              cost is above $100. Consider reducing usage on high-power devices
              like AC units or dishwashers during peak hours.
            </p>
          </motion.div>
        }
      </div>
    </motion.div>);

}