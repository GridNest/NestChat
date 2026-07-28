import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
  gray: 'bg-gray-50 text-gray-600',
};

export function StatsCard({ title, value, change, changeLabel, icon, color = 'blue' }: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 p-4 sm:p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 tracking-tight truncate">{value}</p>
          {change !== undefined && (
            <div className="flex items-center flex-wrap gap-1 mt-2">
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${change >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {change >= 0 ? '+' : ''}{change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-gray-400 truncate">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-2.5 sm:p-3 rounded-xl flex-shrink-0 ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

