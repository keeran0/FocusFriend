/**
 * ProductivityTrendChart - FIXED Height Version
 * Tutorial 15: Production Polish
 *
 * FIXES:
 * - Properly respects height prop
 * - Smaller padding and margins
 * - More compact layout
 */

import { useState, useEffect, useMemo } from 'react';
import { getProductivityTrend, formatDuration, type ProductivityTrend } from './analyticsData';

interface ProductivityTrendChartProps {
  period?: 'week' | 'month' | 'quarter';
  height?: number;
  showPeriodSelector?: boolean;
  refreshKey?: number;
  className?: string;
}

export function ProductivityTrendChart({
  period: initialPeriod = 'week',
  height = 120,
  showPeriodSelector = true,
  refreshKey = 0,
  className = '',
}: ProductivityTrendChartProps) {
  const [period, setPeriod] = useState(initialPeriod);
  const [data, setData] = useState<ProductivityTrend | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    setData(getProductivityTrend(period));
  }, [period, refreshKey]);

  // Calculate chart dimensions based on height prop
  const chartHeight = Math.max(height - 60, 40); // Leave room for header

  const { path, areaPath, points, yLabels } = useMemo(() => {
    if (!data || data.data.length === 0) {
      return { path: '', areaPath: '', points: [], yLabels: [] };
    }

    const values = data.data.map(d => d.value);
    const max = Math.max(...values, 60);
    const padding = { left: 40, right: 15, top: 10, bottom: 25 };
    const chartWidth = 400 - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    const pts = values.map((value, index) => ({
      x: padding.left + (index / (values.length - 1 || 1)) * chartWidth,
      y: padding.top + innerHeight - (value / max) * innerHeight,
      value,
      label: data.data[index].label,
    }));

    const pathCommands = pts
      .map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`;
        const prev = pts[i - 1];
        const cpx = (prev.x + p.x) / 2;
        return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
      })
      .join(' ');

    const areaCommands =
      pathCommands +
      ` L ${pts[pts.length - 1].x} ${padding.top + innerHeight}` +
      ` L ${pts[0].x} ${padding.top + innerHeight} Z`;

    // Y-axis labels (3 labels max for compact view)
    const labelCount = 3;
    const labels = Array.from({ length: labelCount }, (_, i) => {
      const value = Math.round((max / (labelCount - 1)) * (labelCount - 1 - i));
      return {
        value,
        y: padding.top + (i / (labelCount - 1)) * innerHeight,
      };
    });

    return { path: pathCommands, areaPath: areaCommands, points: pts, yLabels: labels };
  }, [data, chartHeight]);

  if (!data) return null;

  const trendColor =
    data.trend === 'up' ? '#4ADE80' : data.trend === 'down' ? '#F87171' : '#A3A3A3';

  return (
    <div className={`ptc ${className}`} style={{ height: `${height}px` }}>
      {/* Compact Header */}
      <div className="ptc-header">
        <div className="ptc-title-row">
          <span className="ptc-title">Productivity Trend</span>
          <span className="ptc-trend" style={{ color: trendColor }}>
            {data.percentChange > 0 ? '+' : ''}
            {data.percentChange}% vs previous
          </span>
        </div>
        {showPeriodSelector && (
          <div className="ptc-periods">
            {(['week', 'month', 'quarter'] as const).map(p => (
              <button
                key={p}
                className={`ptc-btn ${period === p ? 'active' : ''}`}
                onClick={() => setPeriod(p)}
              >
                {p === 'week' ? 'Weekly' : p === 'month' ? 'Monthly' : 'Quarterly'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart - FIXED HEIGHT */}
      <div className="ptc-chart" style={{ height: `${chartHeight}px` }}>
        <svg
          viewBox={`0 0 400 ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient id="ptcAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#4ADE80" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ptcLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7DD3FC" />
              <stop offset="50%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#C4B5FD" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yLabels.map((label, i) => (
            <g key={i}>
              <line x1="40" y1={label.y} x2="385" y2={label.y} stroke="#2A2A2A" strokeWidth="1" />
              <text x="35" y={label.y + 3} textAnchor="end" fill="#525252" fontSize="9">
                {formatDuration(label.value)}
              </text>
            </g>
          ))}

          {/* Area */}
          <path d={areaPath} fill="url(#ptcAreaGrad)" />

          {/* Line */}
          <path
            d={path}
            fill="none"
            stroke="url(#ptcLineGrad)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Points */}
          {points.map((point, i) => (
            <g key={i}>
              <rect
                x={point.x - 15}
                y={0}
                width={30}
                height={chartHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredIndex === i ? 5 : 3}
                fill={hoveredIndex === i ? '#FFFFFF' : '#4ADE80'}
                stroke={hoveredIndex === i ? '#4ADE80' : 'none'}
                strokeWidth="2"
              />
              {/* X label */}
              <text x={point.x} y={chartHeight - 5} textAnchor="middle" fill="#525252" fontSize="8">
                {point.label}
              </text>
            </g>
          ))}

          {/* Tooltip */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <text
              x={points[hoveredIndex].x}
              y={points[hoveredIndex].y - 10}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="10"
              fontWeight="600"
            >
              {formatDuration(points[hoveredIndex].value)}
            </text>
          )}
        </svg>
      </div>

      <style>{`
        .ptc {
          background: #1A1A1A;
          border-radius: 10px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .ptc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          flex-shrink: 0;
        }

        .ptc-title-row {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ptc-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: #FFFFFF;
        }

        .ptc-trend {
          font-size: 0.7rem;
          font-weight: 500;
        }

        .ptc-periods {
          display: flex;
          gap: 3px;
        }

        .ptc-btn {
          padding: 4px 8px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 5px;
          font-size: 0.65rem;
          font-weight: 500;
          color: #737373;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ptc-btn:hover {
          color: #A3A3A3;
        }

        .ptc-btn.active {
          color: #FFFFFF;
          background: #2A2A2A;
          border-color: #3A3A3A;
        }

        .ptc-chart {
          flex: 1;
          min-height: 0;
        }
      `}</style>
    </div>
  );
}

export default ProductivityTrendChart;
