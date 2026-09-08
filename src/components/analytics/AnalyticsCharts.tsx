import React, { useState } from 'react';

// ==================== 1. LINE CHART ====================
export interface LinePoint {
  label: string;
  value: number;
  secondaryValue?: number;
  tooltip?: string;
}

export const AnalyticsLineChart: React.FC<{
  data: LinePoint[];
  height?: number;
  color?: string;
  secondaryColor?: string;
  yAxisLabel?: string;
  showSecondary?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
}> = ({
  data,
  height = 200,
  color = '#e52535',
  secondaryColor = '#3b82f6',
  yAxisLabel,
  showSecondary = false,
  valuePrefix = '',
  valueSuffix = ''
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div style={{ color: '#71717a', fontSize: '0.8rem', padding: '20px', textAlign: 'center' }}>No trend data recorded</div>;
  }

  const values = data.map((d) => d.value);
  const secondaryValues = showSecondary ? data.map((d) => d.secondaryValue || 0) : [];
  const allValues = [...values, ...secondaryValues];

  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;

  const paddingLeft = valuePrefix === '₹' || maxVal >= 1000 ? 55 : 45;
  const paddingRight = 25;
  const paddingTop = 20;
  const paddingBottom = 30;
  const width = 600;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (idx: number) => {
    if (data.length === 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (idx / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - ((val - minVal) / range) * chartHeight;
  };

  const formatValue = (v: number) => {
    if (valuePrefix === '₹') {
      if (Math.abs(v) >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
      if (Math.abs(v) >= 1000) return `₹${Math.round(v / 1000)}k`;
      return `₹${v}`;
    }
    return `${valuePrefix}${v}${valueSuffix}`;
  };

  // Build SVG path
  const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
  const areaPath = data.length > 1
    ? `${points} ${getX(data.length - 1)},${height - paddingBottom} ${paddingLeft},${height - paddingBottom}`
    : '';

  const secondaryPoints = showSecondary ? data.map((d, i) => `${getX(i)},${getY(d.secondaryValue || 0)}`).join(' ') : '';

  return (
    <div style={{ width: '100%', position: 'relative', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', minWidth: '420px', display: 'block' }}
      >
        <defs>
          <linearGradient id={`line-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.33, 0.66, 1].map((ratio, i) => {
          const y = paddingTop + chartHeight * ratio;
          const val = Math.round(maxVal - ratio * range);
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="rgba(255, 255, 255, 0.07)"
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                fill="#71717a"
                fontSize="10"
                textAnchor="end"
                fontFamily="sans-serif"
              >
                {formatValue(val)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        {areaPath && (
          <polygon points={areaPath} fill={`url(#line-grad-${color.replace('#', '')})`} />
        )}

        {/* Primary Line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Secondary Line if enabled */}
        {showSecondary && secondaryPoints && (
          <polyline
            fill="none"
            stroke={secondaryColor}
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={secondaryPoints}
          />
        )}

        {/* Data points & X labels */}
        {data.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.value);
          const isHovered = hoveredIdx === i;

          return (
            <g key={i}>
              {/* Vertical guideline on hover */}
              {isHovered && (
                <line
                  x1={cx}
                  y1={paddingTop}
                  x2={cx}
                  y2={height - paddingBottom}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="1"
                />
              )}

              {/* Point circle */}
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 5 : 3.5}
                fill={isHovered ? '#ffffff' : color}
                stroke={color}
                strokeWidth="2"
                style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />

              {/* Secondary Point if enabled */}
              {showSecondary && d.secondaryValue !== undefined && (
                <circle
                  cx={cx}
                  cy={getY(d.secondaryValue)}
                  r={3}
                  fill={secondaryColor}
                />
              )}

              {/* X label */}
              <text
                x={cx}
                y={height - 10}
                fill={isHovered ? '#ffffff' : '#71717a'}
                fontSize="10"
                fontWeight={isHovered ? 700 : 500}
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1c1d25',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '0.75rem',
            color: '#ffffff',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            pointerEvents: 'none',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span style={{ color: '#a1a1aa' }}>{data[hoveredIdx].label}:</span>
          <strong style={{ color }}>{valuePrefix}{data[hoveredIdx].value}{valueSuffix}</strong>
          {showSecondary && data[hoveredIdx].secondaryValue !== undefined && (
            <span style={{ color: secondaryColor }}>
              (Sec: {valuePrefix}{data[hoveredIdx].secondaryValue}{valueSuffix})
            </span>
          )}
        </div>
      )}
    </div>
  );
};


// ==================== 2. GROUPED BAR CHART ====================
export interface GroupedBarItem {
  groupLabel: string;
  bars: {
    label: string;
    value: number;
    color: string;
  }[];
}

export const GroupedBarChart: React.FC<{
  data: GroupedBarItem[];
  height?: number;
  valueSuffix?: string;
}> = ({ data, height = 220, valueSuffix = '' }) => {
  const [hoveredInfo, setHoveredInfo] = useState<string | null>(null);

  if (!data || data.length === 0) return <div style={{ color: '#71717a', fontSize: '0.8rem', padding: '20px' }}>No grouped data</div>;

  let maxVal = 1;
  data.forEach((g) => g.bars.forEach((b) => { if (b.value > maxVal) maxVal = b.value; }));

  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;
  const width = 640;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const groupWidth = chartWidth / data.length;

  return (
    <div style={{ width: '100%', position: 'relative', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '460px', display: 'block' }}>
        {/* Horizontal grid */}
        {[0, 0.5, 1].map((r, i) => {
          const y = paddingTop + chartHeight * r;
          const val = Math.round(maxVal - r * maxVal);
          return (
            <g key={i}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="3 3" />
              <text x={paddingLeft - 6} y={y + 4} fill="#71717a" fontSize="10" textAnchor="end">{val}</text>
            </g>
          );
        })}

        {/* Groups */}
        {data.map((group, gi) => {
          const gx = paddingLeft + gi * groupWidth;
          const barCount = group.bars.length;
          const barWidth = Math.min(22, (groupWidth * 0.75) / (barCount || 1));
          const offset = (groupWidth - barCount * barWidth) / 2;

          return (
            <g key={gi}>
              {group.bars.map((bar, bi) => {
                const bx = gx + offset + bi * barWidth;
                const barHeight = (bar.value / maxVal) * chartHeight;
                const by = paddingTop + chartHeight - barHeight;

                return (
                  <rect
                    key={bi}
                    x={bx + 1}
                    y={by}
                    width={barWidth - 2}
                    height={Math.max(2, barHeight)}
                    rx="3"
                    fill={bar.color}
                    style={{ cursor: 'pointer', opacity: hoveredInfo && !hoveredInfo.includes(bar.label) ? 0.4 : 1, transition: 'opacity 0.15s' }}
                    onMouseEnter={() => setHoveredInfo(`${group.groupLabel} • ${bar.label}: ${bar.value}${valueSuffix}`)}
                    onMouseLeave={() => setHoveredInfo(null)}
                  />
                );
              })}

              {/* Group X Label */}
              <text
                x={gx + groupWidth / 2}
                y={height - 10}
                fill="#71717a"
                fontSize="10"
                textAnchor="middle"
              >
                {group.groupLabel}
              </text>
            </g>
          );
        })}
      </svg>

      {hoveredInfo && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 10,
          background: '#1c1d25',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '0.75rem',
          color: '#ffffff'
        }}>
          {hoveredInfo}
        </div>
      )}
    </div>
  );
};


// ==================== 3. STACKED BAR CHART ====================
export interface StackedBarItem {
  label: string;
  segments: {
    name: string;
    value: number;
    color: string;
  }[];
}

export const StackedBarChart: React.FC<{
  data: StackedBarItem[];
  height?: number;
  valueSuffix?: string;
}> = ({ data, height = 200, valueSuffix = '' }) => {
  const [hovered, setHovered] = useState<string | null>(null);

  if (!data || data.length === 0) return null;

  const totals = data.map((d) => d.segments.reduce((acc, s) => acc + s.value, 0));
  const maxTotal = Math.max(...totals, 1);

  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;
  const width = 600;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const barSlot = chartWidth / data.length;
  const barWidth = Math.min(26, barSlot * 0.6);

  return (
    <div style={{ width: '100%', position: 'relative', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '420px', display: 'block' }}>
        {[0, 0.5, 1].map((r, i) => {
          const y = paddingTop + chartHeight * r;
          const val = Math.round(maxTotal - r * maxTotal);
          return (
            <g key={i}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="3 3" />
              <text x={paddingLeft - 6} y={y + 4} fill="#71717a" fontSize="10" textAnchor="end">{val}</text>
            </g>
          );
        })}

        {data.map((item, idx) => {
          const bx = paddingLeft + idx * barSlot + (barSlot - barWidth) / 2;
          let currentY = paddingTop + chartHeight;

          return (
            <g key={idx}>
              {item.segments.map((seg, si) => {
                const segHeight = (seg.value / maxTotal) * chartHeight;
                currentY -= segHeight;

                return (
                  <rect
                    key={si}
                    x={bx}
                    y={currentY}
                    width={barWidth}
                    height={Math.max(1, segHeight)}
                    fill={seg.color}
                    rx={si === item.segments.length - 1 ? 3 : 0}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHovered(`${item.label} • ${seg.name}: ${seg.value}${valueSuffix}`)}
                    onMouseLeave={() => setHovered(null)}
                  />
                );
              })}

              <text
                x={bx + barWidth / 2}
                y={height - 10}
                fill="#71717a"
                fontSize="10"
                textAnchor="middle"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hovered && (
        <div style={{
          position: 'absolute',
          top: 0,
          right: 10,
          background: '#1c1d25',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '0.75rem',
          color: '#ffffff'
        }}>
          {hovered}
        </div>
      )}
    </div>
  );
};


// ==================== 4. RADAR / SPIDER CHART ====================
export interface RadarMetric {
  axis: string;
  value: number; // 0 to 100
  rawValue?: string;
}

export const RadarSpiderChart: React.FC<{
  metrics: RadarMetric[];
  size?: number;
  fillColor?: string;
  strokeColor?: string;
}> = ({
  metrics,
  size = 240,
  fillColor = 'rgba(229, 37, 53, 0.25)',
  strokeColor = '#e52535'
}) => {
  if (!metrics || metrics.length < 3) return null;

  const center = size / 2;
  const radius = center - 36;
  const count = metrics.length;
  const angleStep = (Math.PI * 2) / count;

  // Compute coordinate
  const getCoordinates = (index: number, valPercent: number) => {
    const angle = index * angleStep - Math.PI / 2; // start top
    const r = (valPercent / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  // Polygon points
  const points = metrics.map((m, i) => {
    const { x, y } = getCoordinates(i, Math.min(100, Math.max(10, m.value)));
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Concentric spider web pentagons */}
        {[0.25, 0.5, 0.75, 1.0].map((ratio, li) => {
          const ringPoints = Array.from({ length: count }).map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const r = ratio * radius;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(' ');

          return (
            <polygon
              key={li}
              points={ringPoints}
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis radial spokes */}
        {metrics.map((m, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const lx = center + radius * Math.cos(angle);
          const ly = center + radius * Math.sin(angle);
          const textX = center + (radius + 18) * Math.cos(angle);
          const textY = center + (radius + 18) * Math.sin(angle);

          return (
            <g key={i}>
              <line
                x1={center}
                y1={center}
                x2={lx}
                y2={ly}
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1"
              />
              <text
                x={textX}
                y={textY + 4}
                fill="#a1a1aa"
                fontSize="9"
                fontWeight={700}
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {m.axis}
              </text>
            </g>
          );
        })}

        {/* Value polygon */}
        <polygon
          points={points}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth="2.5"
        />

        {/* Vertex points */}
        {metrics.map((m, i) => {
          const { x, y } = getCoordinates(i, Math.min(100, Math.max(10, m.value)));
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3.5"
              fill="#ffffff"
              stroke={strokeColor}
              strokeWidth="2"
            />
          );
        })}
      </svg>
    </div>
  );
};


// ==================== 5. BOX PLOT / VARIANCE CHART ====================
export interface BoxPlotData {
  label: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  variance: string;
}

export const BoxPlotConsistencyChart: React.FC<{
  data: BoxPlotData[];
  height?: number;
}> = ({ data, height = 180 }) => {
  if (!data || data.length === 0) return null;

  const allMax = Math.max(...data.map((d) => d.max), 20);
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 30;
  const width = 560;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const slotWidth = chartWidth / data.length;

  const getY = (val: number) => paddingTop + chartHeight - (val / allMax) * chartHeight;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '400px', display: 'block' }}>
        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((r, i) => {
          const y = paddingTop + chartHeight * r;
          const val = Math.round(allMax - r * allMax);
          return (
            <g key={i}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="rgba(255, 255, 255, 0.06)" strokeDasharray="2 2" />
              <text x={paddingLeft - 8} y={y + 4} fill="#71717a" fontSize="10" textAnchor="end">{val} pts</text>
            </g>
          );
        })}

        {data.map((box, i) => {
          const cx = paddingLeft + i * slotWidth + slotWidth / 2;
          const boxWidth = Math.min(32, slotWidth * 0.5);

          const yMin = getY(box.min);
          const yQ1 = getY(box.q1);
          const yMed = getY(box.median);
          const yQ3 = getY(box.q3);
          const yMax = getY(box.max);

          return (
            <g key={i}>
              {/* Whiskers line */}
              <line x1={cx} y1={yMax} x2={cx} y2={yMin} stroke="#a1a1aa" strokeWidth="1.5" />
              {/* Whiskers caps */}
              <line x1={cx - boxWidth / 3} y1={yMax} x2={cx + boxWidth / 3} y2={yMax} stroke="#a1a1aa" strokeWidth="1.5" />
              <line x1={cx - boxWidth / 3} y1={yMin} x2={cx + boxWidth / 3} y2={yMin} stroke="#a1a1aa" strokeWidth="1.5" />

              {/* IQR Box */}
              <rect
                x={cx - boxWidth / 2}
                y={yQ3}
                width={boxWidth}
                height={Math.max(4, yQ1 - yQ3)}
                rx="3"
                fill="rgba(168, 85, 247, 0.25)"
                stroke="#a855f7"
                strokeWidth="1.5"
              />

              {/* Median Line */}
              <line
                x1={cx - boxWidth / 2}
                y1={yMed}
                x2={cx + boxWidth / 2}
                y2={yMed}
                stroke="#e52535"
                strokeWidth="2"
              />

              {/* Player name */}
              <text x={cx} y={height - 10} fill="#ffffff" fontSize="10" fontWeight={700} textAnchor="middle">
                {box.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};


// ==================== 6. DONUT / PIE CHART ====================
export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  subtext?: string;
}

export const DonutChart: React.FC<{
  data: DonutSegment[];
  size?: number;
  innerRadiusRatio?: number;
  centerTitle?: string;
  centerValue?: string;
}> = ({
  data,
  size = 200,
  innerRadiusRatio = 0.65,
  centerTitle,
  centerValue
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const center = size / 2;
  const radius = center - 12;
  const innerRadius = radius * innerRadiusRatio;

  // Build SVG arc paths
  let accumulatedAngle = -Math.PI / 2; // start at top

  const arcs = data.map((item, idx) => {
    const sliceAngle = (item.value / total) * Math.PI * 2;
    const startAngle = accumulatedAngle;
    const endAngle = accumulatedAngle + sliceAngle;
    accumulatedAngle += sliceAngle;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    const ix1 = center + innerRadius * Math.cos(endAngle);
    const iy1 = center + innerRadius * Math.sin(endAngle);
    const ix2 = center + innerRadius * Math.cos(startAngle);
    const iy2 = center + innerRadius * Math.sin(startAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;
    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;

    const percentage = Math.round((item.value / total) * 100);

    return {
      ...item,
      path,
      percentage
    };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {arcs.map((arc, i) => (
            <path
              key={i}
              d={arc.path}
              fill={arc.color}
              style={{
                cursor: 'pointer',
                opacity: hoveredIdx !== null && hoveredIdx !== i ? 0.45 : 1,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        {/* Center label */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: '0.7rem', color: '#71717a' }}>{centerTitle || 'TOTAL'}</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>{centerValue || total}</div>
        </div>
      </div>

      {/* Legend list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '150px' }}>
        {data.map((item, idx) => {
          const pct = Math.round((item.value / total) * 100);
          const isSelected = hoveredIdx === idx;

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
                borderRadius: '6px',
                background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                cursor: 'pointer'
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                <span style={{ fontSize: '0.78rem', color: isSelected ? '#ffffff' : '#a1a1aa' }}>{item.label}</span>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>
                {pct}% <span style={{ fontSize: '0.7rem', color: '#71717a', fontWeight: 400 }}>({item.value})</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// ==================== 7. WATERFALL CHART ====================
export interface WaterfallStep {
  label: string;
  amount: number; // positive = inflow, negative = expense, zero = subtotal/balance
  isTotal?: boolean;
}

export const WaterfallChart: React.FC<{
  steps: WaterfallStep[];
  height?: number;
}> = ({ steps, height = 220 }) => {
  if (!steps || steps.length === 0) return null;

  let running = 0;
  const bars = steps.map((s) => {
    if (s.isTotal) {
      return {
        label: s.label,
        start: 0,
        end: running,
        amount: running,
        type: 'total' as const
      };
    } else {
      const prev = running;
      running += s.amount;
      return {
        label: s.label,
        start: s.amount >= 0 ? prev : running,
        end: s.amount >= 0 ? running : prev,
        amount: s.amount,
        type: s.amount >= 0 ? ('gain' as const) : ('loss' as const)
      };
    }
  });

  const maxVal = Math.max(...bars.map((b) => Math.max(b.start, b.end)), 100000);
  const minVal = Math.min(0, ...bars.map((b) => Math.min(b.start, b.end)));
  const range = maxVal - minVal || 1;

  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  const width = 640;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const slotWidth = chartWidth / steps.length;
  const barWidth = Math.min(32, slotWidth * 0.65);

  const getY = (val: number) => paddingTop + chartHeight - ((val - minVal) / range) * chartHeight;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '460px', display: 'block' }}>
        {/* Zero baseline */}
        <line
          x1={paddingLeft}
          y1={getY(0)}
          x2={width - paddingRight}
          y2={getY(0)}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1"
        />

        {bars.map((b, i) => {
          const cx = paddingLeft + i * slotWidth + (slotWidth - barWidth) / 2;
          const topY = getY(b.end);
          const bottomY = getY(b.start);
          const barH = Math.max(2, Math.abs(bottomY - topY));

          const fillColor = b.type === 'gain' ? '#22c55e' : b.type === 'loss' ? '#e52535' : '#3b82f6';

          return (
            <g key={i}>
              <rect
                x={cx}
                y={topY}
                width={barWidth}
                height={barH}
                rx="3"
                fill={fillColor}
              />

              {/* Amount label */}
              <text
                x={cx + barWidth / 2}
                y={topY - 4}
                fill="#ffffff"
                fontSize="9"
                fontWeight={700}
                textAnchor="middle"
              >
                {b.amount >= 0 ? `+₹${Math.round(b.amount / 1000)}k` : `-₹${Math.round(Math.abs(b.amount) / 1000)}k`}
              </text>

              {/* Step name */}
              <text
                x={cx + barWidth / 2}
                y={height - 12}
                fill="#71717a"
                fontSize="9"
                textAnchor="middle"
              >
                {b.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
