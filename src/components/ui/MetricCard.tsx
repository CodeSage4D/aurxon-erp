import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isUpwardPositive: boolean;
    isUp: boolean;
  };
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  onClick,
}) => {
  return (
    <div className="metric-card" onClick={onClick} role={onClick ? 'button' : undefined}>
      <div className="metric-card-top">
        <span className="metric-label">{label}</span>
        <div className="metric-icon-wrap">{icon}</div>
      </div>
      <div className="metric-value">{value}</div>
      {(subtext || trend) && (
        <div className="metric-sub">
          {trend && (
            <span
              className={
                (trend.isUp && trend.isUpwardPositive) || (!trend.isUp && !trend.isUpwardPositive)
                  ? 'trend-up'
                  : 'trend-down'
              }
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              {trend.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {trend.value}
            </span>
          )}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
