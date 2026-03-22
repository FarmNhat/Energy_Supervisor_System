import React from 'react';
import { Home, TrendingDown, TrendingUp } from 'lucide-react';
interface HeaderProps {
  homeName: string;
  monthlyCost: number;
  costTrend: number;
  currentDate: string;
}
export function Header({
  homeName,
  monthlyCost,
  costTrend,
  currentDate
}: HeaderProps) {
  const isTrendDown = costTrend < 0;
  return (
    <header className="bg-white/60 backdrop-blur-md border-b border-cream-200 rounded-2xl p-4 md:p-6 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-warmgreen-100 text-warmgreen-600 rounded-xl">
          <Home className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">
            {homeName}
          </h1>
          <p className="text-sm text-gray-500 font-body">{currentDate}</p>
        </div>
      </div>

      <div className="flex flex-col items-start sm:items-end">
        <p className="text-sm text-gray-500 font-body mb-1">
          Estimated Cost (This Month)
        </p>
        <div className="flex items-center gap-3">
          <span className="text-3xl font-heading font-bold text-gray-900">
            ${monthlyCost.toFixed(2)}
          </span>
          <div
            className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${isTrendDown ? 'bg-warmgreen-50 text-warmgreen-600' : 'bg-coral-50 text-coral-600'}`}>

            {isTrendDown ?
            <TrendingDown className="w-4 h-4" /> :

            <TrendingUp className="w-4 h-4" />
            }
            <span>{Math.abs(costTrend)}%</span>
          </div>
        </div>
      </div>
    </header>);

}