import type { LucideIcon } from 'lucide-react';
import React from 'react';

export interface StatCard {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
  iconColor: string;
  loading?: boolean;
}

interface SummaryStatsProps {
  title?: string;
  stats: StatCard[];
  columns?: 3 | 4;
}

const SummaryStats: React.FC<SummaryStatsProps> = ({ 
  stats, 
  columns = 4 
}) => {
  return (
    <div className="space-y-4">
      <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-4`}>
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-xl p-4`}>
            <div className="flex items-center space-x-3">
              {stat.bgColor.includes('bg-white') ? (
                // For white backgrounds - use colored icon containers like RequestManagement
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  stat.iconColor.includes('yellow') ? 'bg-yellow-100' :
                  stat.iconColor.includes('blue') ? 'bg-blue-100' :
                  stat.iconColor.includes('green') ? 'bg-green-100' :
                  stat.iconColor.includes('red') ? 'bg-red-100' :
                  stat.iconColor.includes('purple') ? 'bg-purple-100' :
                  'bg-gray-100'
                }`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              ) : stat.bgColor.includes('border') ? (
                // For colored backgrounds with border (old PayoutManagement style)
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              ) : (
                // For gradient backgrounds (OrderManagement style) - use container
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              )}
              <div>
                {stat.loading ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-300 rounded w-16 mb-1"></div>
                    <div className="h-4 bg-gray-300 rounded w-20"></div>
                  </div>
                ) : (
                  <>
                    <p className={`${stat.textColor} font-bold text-2xl`}>
                      {typeof stat.value === 'number' && stat.value >= 1000 
                        ? stat.value.toLocaleString() 
                        : stat.value
                      }
                    </p>
                    <p className={`${
                      stat.textColor.includes('gray') ? 'text-gray-600' : 
                      stat.textColor.replace('800', '600')
                    } text-sm`}>
                      {stat.label}
                    </p>
                    {stat.description && (
                      <p className={`${
                        stat.textColor.includes('gray') ? 'text-gray-500' : 
                        stat.textColor.replace('800', '500')
                      } text-xs mt-1`}>
                        {stat.description}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummaryStats;
