import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'blue' | 'teal' | 'emerald' | 'red' | 'orange' | 'purple';
}

export function KPICard({ title, value, icon, trend, trendUp, color = 'blue' }: KPICardProps) {
  const colorStyles = {
    blue: 'bg-blue-50 text-[#0F6CBD]',
    teal: 'bg-teal-50 text-[#14B8A6]',
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">{title}</p>
          <p className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-1">{value}</p>
          {trend && (
            <p className={`text-sm ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorStyles[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
