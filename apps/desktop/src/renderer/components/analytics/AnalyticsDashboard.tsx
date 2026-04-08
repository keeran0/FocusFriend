/**
 * AnalyticsDashboard - Single Page View
 * All analytics displayed on one organized page
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getAnalyticsSummary,
  getWeekComparison,
  getWeeklyStats,
  getMonthlyStats,
  getProductivityTrend,
  formatDuration,
  type AnalyticsSummary,
  type WeeklyStats,
  type MonthlyStats,
} from './analyticsData';

export function AnalyticsDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [weekComparison, setWeekComparison] = useState<ReturnType<typeof getWeekComparison> | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [monthYear, setMonthYear] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const loadData = useCallback(() => {
    setSummary(getAnalyticsSummary());
    setWeekComparison(getWeekComparison());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  const weekData = useMemo(() => getWeeklyStats(0), [refreshKey]);
  const monthData = useMemo(
    () => getMonthlyStats(monthYear.year, monthYear.month),
    [monthYear, refreshKey]
  );
  const trendData = useMemo(() => getProductivityTrend('week'), [refreshKey]);
  const monthlyTrend = useMemo(() => getProductivityTrend('month'), [refreshKey]);

  const navigateMonth = (delta: number) => {
    setMonthYear(prev => {
      let newMonth = prev.month + delta;
      let newYear = prev.year;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
      return { year: newYear, month: newMonth };
    });
  };

  if (!summary) return null;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.subtitle}>Your focus insights</span>
        <button onClick={() => setRefreshKey(k => k + 1)} style={styles.refreshBtn}>
          ↻
        </button>
      </div>

      {/* Scrollable Content */}
      <div style={styles.content}>
        {/* === SECTION 1: Key Stats === */}
        <div style={styles.statsGrid}>
          <StatCard
            label="Today"
            value={formatDuration(summary.today.focusMinutes)}
            sub={`${summary.today.sessions} sessions`}
            icon="📅"
            color="#4ADE80"
          />
          <StatCard
            label="This Week"
            value={formatDuration(summary.thisWeek.totalMinutes)}
            sub={
              weekComparison
                ? `${weekComparison.changePercent >= 0 ? '+' : ''}${weekComparison.changePercent}% vs last week`
                : ''
            }
            icon="📊"
            color="#4ADE80"
            trend={weekComparison?.trend}
          />
          <StatCard
            label="Current Streak"
            value={`${summary.streak.current}`}
            sub={`Best: ${summary.streak.longest} days`}
            icon="🔥"
            color="#FB923C"
          />
          <StatCard
            label="All Time"
            value={formatDuration(summary.allTime.totalMinutes)}
            sub={`${summary.allTime.totalSessions} sessions`}
            icon="⭐"
            color="#A78BFA"
          />
        </div>

        {/* === SECTION 2: Weekly Overview === */}
        <Section
          title="This Week"
          subtitle={`${weekData.weekStart.slice(5)} - ${weekData.weekEnd.slice(5)}`}
        >
          <div style={styles.weeklyContent}>
            <div style={styles.weeklyStats}>
              <MiniStat value={formatDuration(weekData.totalMinutes)} label="Total" />
              <MiniStat value={String(weekData.activeDays)} label="Active Days" />
              <MiniStat value={formatDuration(weekData.avgDailyMinutes)} label="Daily Avg" />
              <MiniStat value={String(weekData.totalSessions)} label="Sessions" />
            </div>
            <WeeklyBarChart weekData={weekData} />
          </div>
        </Section>

        {/* === SECTION 3: Trends (left) + Heatmap (right) === */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, minHeight: 280 }}>
          {/* Left column - Stacked Trends */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ ...styles.card, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: 8 }}>
                <h3 style={styles.cardTitle}>Monthly Trend</h3>
                <span style={styles.cardSubtitle}>Last 6 months</span>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <TrendChart data={monthlyTrend} />
              </div>
            </div>
            <div style={{ ...styles.card, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: 8 }}>
                <h3 style={styles.cardTitle}>Weekly Trend</h3>
                <span style={styles.cardSubtitle}>Last 8 weeks</span>
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <TrendChart data={trendData} />
              </div>
            </div>
          </div>

          {/* Right column - Heatmap */}
          <div style={{ ...styles.card, display: 'flex', flexDirection: 'column' }}>
            <div style={styles.cardHeader}>
              <div>
                <h3 style={styles.cardTitle}>
                  {monthData.monthName} {monthYear.year}
                </h3>
                <span style={styles.cardSubtitle}>
                  {monthData.activeDays} active days • {formatDuration(monthData.totalMinutes)}{' '}
                  total
                </span>
              </div>
              <div style={styles.navBtns}>
                <button style={styles.navBtn} onClick={() => navigateMonth(-1)}>
                  ←
                </button>
                <button
                  style={styles.navBtn}
                  onClick={() =>
                    setMonthYear({
                      year: new Date().getFullYear(),
                      month: new Date().getMonth() + 1,
                    })
                  }
                >
                  Today
                </button>
                <button style={styles.navBtn} onClick={() => navigateMonth(1)}>
                  →
                </button>
              </div>
            </div>
            <div
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <MonthlyHeatmap monthData={monthData} year={monthYear.year} month={monthYear.month} />
            </div>
          </div>
        </div>

        {/* === SECTION 4: Time of Day (Full Width) === */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h3 style={styles.cardTitle}>Peak Focus Hours</h3>
              <span style={styles.cardSubtitle}>Last 30 days</span>
            </div>
            <span style={styles.badge}>{summary.timeOfDay.preferredPeriod}</span>
          </div>
          <TimeOfDayChart timeOfDay={summary.timeOfDay} />
        </div>

        {/* === SECTION 6: Session Insights === */}
        <Section title="Session Insights">
          <div style={styles.insightsGrid}>
            <InsightCard
              icon="⏱️"
              title="Avg Session"
              value={formatDuration(
                Math.round(summary.allTime.totalMinutes / (summary.allTime.totalSessions || 1))
              )}
              color="#22D3EE"
            />
            <InsightCard
              icon="📈"
              title="Best Day"
              value={weekData.bestDay ? formatDuration(weekData.bestDay.minutes) : '—'}
              sub={
                weekData.bestDay
                  ? new Date(weekData.bestDay.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                    })
                  : ''
              }
              color="#4ADE80"
            />
            <InsightCard
              icon="🎯"
              title="Peak Hour"
              value={summary.timeOfDay.peakLabel}
              color="#A78BFA"
            />
            <InsightCard
              icon="📊"
              title="Completion"
              value={`${Math.round((summary.today.completedSessions / (summary.today.sessions || 1)) * 100)}%`}
              sub="Today"
              color="#FB923C"
            />
          </div>
        </Section>

        {/* === SECTION 7: Focus Tips === */}
        <div style={styles.tipsSection}>
          <div style={styles.tipCard}>
            <span style={styles.tipIcon}>💡</span>
            <div>
              <h4 style={styles.tipTitle}>Productivity Tip</h4>
              <p style={styles.tipText}>
                You're most productive in the{' '}
                <strong style={{ color: '#4ADE80' }}>{summary.timeOfDay.preferredPeriod}</strong>.
                Schedule your most challenging tasks around{' '}
                <strong style={{ color: '#4ADE80' }}>{summary.timeOfDay.peakLabel}</strong> for best
                results.
              </p>
            </div>
          </div>
          {summary.streak.current > 0 && (
            <div style={{ ...styles.tipCard, borderColor: '#FB923C33' }}>
              <span style={styles.tipIcon}>🔥</span>
              <div>
                <h4 style={styles.tipTitle}>Keep it going!</h4>
                <p style={styles.tipText}>
                  You're on a{' '}
                  <strong style={{ color: '#FB923C' }}>{summary.streak.current} day streak</strong>.
                  {summary.streak.current < summary.streak.longest
                    ? ` Only ${summary.streak.longest - summary.streak.current} more days to beat your record!`
                    : ` You're at your best streak ever!`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTS
// ============================================

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>{title}</h3>
        {subtitle && <span style={styles.sectionSubtitle}>{subtitle}</span>}
      </div>
      <div style={styles.card}>{children}</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
}) {
  return (
    <div style={{ ...styles.statCard, borderTopColor: color }}>
      <div style={styles.statHeader}>
        <span style={styles.statIcon}>{icon}</span>
        <span style={styles.statLabel}>{label}</span>
      </div>
      <div style={styles.statValue}>{value}</div>
      {sub && (
        <div
          style={{
            ...styles.statSub,
            color: trend === 'up' ? '#4ADE80' : trend === 'down' ? '#F87171' : '#737373',
          }}
        >
          {trend === 'up' && '↑ '}
          {trend === 'down' && '↓ '}
          {sub}
        </div>
      )}
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div style={styles.miniStat}>
      <span style={styles.miniStatValue}>{value}</span>
      <span style={styles.miniStatLabel}>{label}</span>
    </div>
  );
}

function InsightCard({
  icon,
  title,
  value,
  sub,
  color,
}: {
  icon: string;
  title: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div style={styles.insightCard}>
      <div style={{ ...styles.insightIcon, backgroundColor: `${color}20`, color }}>{icon}</div>
      <div style={styles.insightContent}>
        <span style={styles.insightTitle}>{title}</span>
        <span style={styles.insightValue}>{value}</span>
        {sub && <span style={styles.insightSub}>{sub}</span>}
      </div>
    </div>
  );
}

function WeeklyBarChart({ weekData }: { weekData: WeeklyStats }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const max = Math.max(...weekData.days.map(d => d.focusMinutes), 30);
  const todayIdx = (new Date().getDay() + 6) % 7;

  return (
    <div style={styles.barChart}>
      {weekData.days.map((d, i) => (
        <div
          key={i}
          style={styles.barCol}
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <span
            style={{
              ...styles.barValue,
              opacity: hoveredIdx === i || d.focusMinutes > 0 ? 1 : 0,
              color: hoveredIdx === i ? '#4ADE80' : '#737373',
              fontWeight: hoveredIdx === i ? 600 : 400,
            }}
          >
            {formatDuration(d.focusMinutes)}
          </span>
          <div style={styles.barTrack}>
            <div
              style={{
                ...styles.bar,
                height: `${Math.max((d.focusMinutes / max) * 100, 4)}%`,
                background:
                  i === todayIdx
                    ? 'linear-gradient(180deg, #22D3EE, #0EA5E9)'
                    : 'linear-gradient(180deg, #4ADE80, #22C55E)',
                transform: hoveredIdx === i ? 'scaleX(1.1)' : 'scaleX(1)',
                transition: 'transform 0.15s ease',
              }}
            />
          </div>
          <span
            style={{
              ...styles.barDay,
              color: i === todayIdx ? '#22D3EE' : hoveredIdx === i ? '#fff' : '#525252',
            }}
          >
            {days[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ data }: { data: ReturnType<typeof getProductivityTrend> }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const values = data.data.map(d => d.value);
  const max = Math.max(...values, 60);

  // ViewBox dimensions - will scale to fill container
  const W = 400,
    H = 120;
  const pad = { l: 36, r: 12, t: 20, b: 24 };
  const chartW = W - pad.l - pad.r;
  const chartH = H - pad.t - pad.b;

  const pts = values.map((v, i) => ({
    x: pad.l + (i / (values.length - 1 || 1)) * chartW,
    y: pad.t + chartH - (v / max) * chartH,
    value: v,
    label: data.data[i].label,
  }));

  const pathD = pts
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = pts[i - 1];
      const cpx = (prev.x + p.x) / 2;
      return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
    })
    .join(' ');

  const areaD =
    pathD + ` L ${pts[pts.length - 1].x} ${pad.t + chartH} L ${pts[0].x} ${pad.t + chartH} Z`;

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 80, position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: '100%' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4ADE80" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="trendLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="50%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, max / 2, max].map((v, i) => {
          const y = pad.t + chartH - (v / max) * chartH;
          return (
            <g key={i}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#2A2A2A" strokeWidth="1" />
              <text x={pad.l - 6} y={y + 4} textAnchor="end" fill="#525252" fontSize="10">
                {formatDuration(Math.round(v))}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#trendFill)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#trendLine)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points with hover areas */}
        {pts.map((p, i) => (
          <g
            key={i}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{ cursor: 'pointer' }}
          >
            {/* Invisible larger hit area */}
            <circle cx={p.x} cy={p.y} r="15" fill="transparent" />
            {/* Visible point */}
            <circle cx={p.x} cy={p.y} r={hoveredIdx === i ? 6 : 4} fill="#4ADE80" />
            <circle cx={p.x} cy={p.y} r={hoveredIdx === i ? 2.5 : 1.5} fill="#fff" />
            {/* X-axis label */}
            <text x={p.x} y={H - 6} textAnchor="middle" fill="#525252" fontSize="9">
              {p.label}
            </text>
            {/* Tooltip on hover */}
            {hoveredIdx === i && (
              <g>
                <rect
                  x={p.x - 28}
                  y={p.y - 28}
                  width="56"
                  height="20"
                  rx="4"
                  fill="#1A1A1A"
                  stroke="#4ADE80"
                  strokeWidth="1"
                />
                <text
                  x={p.x}
                  y={p.y - 14}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="10"
                  fontWeight="600"
                >
                  {formatDuration(p.value)}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

function MonthlyHeatmap({
  monthData,
  year,
  month,
}: {
  monthData: MonthlyStats;
  year: number;
  month: number;
}) {
  const [hoveredDay, setHoveredDay] = useState<{ dayNum: number; minutes: number } | null>(null);
  const COLORS = ['#1F1F1F', '#1E3A2F', '#236644', '#2A9D5A', '#4ADE80'];
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getIntensity = (m: number) => (m === 0 ? 0 : m < 15 ? 1 : m < 30 ? 2 : m < 60 ? 3 : 4);

  let startDay = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const weeks: ((typeof monthData.days)[0] | null)[][] = [];
  let week: ((typeof monthData.days)[0] | null)[] = new Array(startDay).fill(null);

  monthData.days.forEach(day => {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  });
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const todayDate = today.getDate();

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Hover tooltip */}
      {hoveredDay && (
        <div
          style={{
            position: 'absolute',
            top: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1A1A1A',
            border: '1px solid #4ADE80',
            borderRadius: 6,
            padding: '4px 10px',
            zIndex: 10,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 600 }}>
            {monthData.monthName} {hoveredDay.dayNum}: {formatDuration(hoveredDay.minutes)}
          </span>
        </div>
      )}

      {/* Weekday headers */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}
      >
        {DAYS.map((d, i) => (
          <div
            key={i}
            style={{ textAlign: 'center', fontSize: '0.65rem', color: '#737373', fontWeight: 500 }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid - flex: 1 to fill remaining space */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {weeks.map((wk, wi) => (
          <div
            key={wi}
            style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}
          >
            {wk.map((day, di) => {
              if (!day) return <div key={di} style={{ borderRadius: 4 }} />;
              const dayNum = parseInt(day.date.split('-')[2]);
              const isToday = isCurrentMonth && dayNum === todayDate;
              const isHovered = hoveredDay?.dayNum === dayNum;
              return (
                <div
                  key={di}
                  onMouseEnter={() => setHoveredDay({ dayNum, minutes: day.focusMinutes })}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{
                    backgroundColor: COLORS[getIntensity(day.focusMinutes)],
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isToday
                      ? 'inset 0 0 0 2px #22D3EE'
                      : isHovered
                        ? 'inset 0 0 0 2px #4ADE80'
                        : 'none',
                    cursor: 'pointer',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: day.focusMinutes > 0 ? '#fff' : '#555',
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                    zIndex: isHovered ? 5 : 1,
                  }}
                >
                  {dayNum}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginTop: 10,
          fontSize: '0.6rem',
          color: '#525252',
        }}
      >
        <span>Less</span>
        {COLORS.map((c, i) => (
          <div key={i} style={{ width: 14, height: 14, backgroundColor: c, borderRadius: 3 }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

function TimeOfDayChart({ timeOfDay }: { timeOfDay: AnalyticsSummary['timeOfDay'] }) {
  const periods = [
    {
      name: 'Morning',
      icon: '🌅',
      minutes: timeOfDay.morningMinutes,
      hours: '5am-12pm',
      color: '#FB923C',
    },
    {
      name: 'Afternoon',
      icon: '☀️',
      minutes: timeOfDay.afternoonMinutes,
      hours: '12pm-5pm',
      color: '#FBBF24',
    },
    {
      name: 'Evening',
      icon: '🌆',
      minutes: timeOfDay.eveningMinutes,
      hours: '5pm-9pm',
      color: '#A78BFA',
    },
    {
      name: 'Night',
      icon: '🌙',
      minutes: timeOfDay.nightMinutes,
      hours: '9pm-5am',
      color: '#6366F1',
    },
  ];
  const total = periods.reduce((s, p) => s + p.minutes, 0) || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {periods.map(p => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1rem', width: 24 }}>{p.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: '0.7rem', color: '#A3A3A3' }}>{p.name}</span>
              <span style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 600 }}>
                {formatDuration(p.minutes)}
              </span>
            </div>
            <div style={{ height: 6, background: '#2A2A2A', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(p.minutes / total) * 100}%`,
                  backgroundColor: p.color,
                  borderRadius: 3,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// STYLES
// ============================================

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    borderBottom: '1px solid #2A2A2A',
    flexShrink: 0,
  },
  subtitle: { fontSize: '0.8rem', color: '#737373' },
  refreshBtn: {
    width: 28,
    height: 28,
    background: '#1C1C1C',
    border: '1px solid #2A2A2A',
    borderRadius: 6,
    color: '#737373',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  content: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },

  // Stats Grid
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 },
  statCard: {
    background: '#1A1A1A',
    border: '1px solid #2A2A2A',
    borderTop: '3px solid',
    borderRadius: 10,
    padding: 12,
  },
  statHeader: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 },
  statIcon: { fontSize: '0.9rem' },
  statLabel: {
    fontSize: '0.6rem',
    fontWeight: 600,
    color: '#737373',
    textTransform: 'uppercase' as const,
  },
  statValue: { fontSize: '1.3rem', fontWeight: 700 },
  statSub: { fontSize: '0.6rem', marginTop: 4 },

  // Section
  section: { display: 'flex', flexDirection: 'column', gap: 8 },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: '0 4px',
  },
  sectionTitle: { margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#fff' },
  sectionSubtitle: { fontSize: '0.7rem', color: '#525252' },

  // Card
  card: { background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: 14 },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: { margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#fff' },
  cardSubtitle: { fontSize: '0.65rem', color: '#737373' },
  navBtns: { display: 'flex', gap: 4 },
  navBtn: {
    padding: '4px 10px',
    background: '#2A2A2A',
    border: '1px solid #3A3A3A',
    borderRadius: 4,
    color: '#A3A3A3',
    fontSize: '0.65rem',
    cursor: 'pointer',
  },
  badge: {
    padding: '4px 10px',
    background: '#7C3AED',
    borderRadius: 10,
    fontSize: '0.6rem',
    fontWeight: 600,
    textTransform: 'capitalize' as const,
  },

  // Two Column
  twoColumn: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },

  // Weekly
  weeklyContent: { display: 'flex', flexDirection: 'column', gap: 12 },
  weeklyStats: { display: 'flex', gap: 20 },
  miniStat: { display: 'flex', flexDirection: 'column' },
  miniStatValue: { fontSize: '1rem', fontWeight: 700 },
  miniStatLabel: { fontSize: '0.55rem', color: '#737373', textTransform: 'uppercase' as const },

  // Bar Chart
  barChart: { display: 'flex', gap: 8, height: 100, alignItems: 'flex-end' },
  barCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  barValue: { fontSize: '0.55rem', color: '#737373', height: 12 },
  barTrack: { flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' },
  bar: { width: '100%', borderRadius: '3px 3px 0 0', minHeight: 3 },
  barDay: { fontSize: '0.6rem' },

  // Insights
  insightsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 },
  insightCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    background: '#222',
    borderRadius: 8,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
  },
  insightContent: { display: 'flex', flexDirection: 'column' },
  insightTitle: { fontSize: '0.6rem', color: '#737373', textTransform: 'uppercase' as const },
  insightValue: { fontSize: '0.95rem', fontWeight: 700 },
  insightSub: { fontSize: '0.55rem', color: '#525252' },

  // Tips
  tipsSection: { display: 'flex', flexDirection: 'column', gap: 10 },
  tipCard: {
    display: 'flex',
    gap: 12,
    padding: 14,
    background: '#1A1A1A',
    border: '1px solid #4ADE8033',
    borderRadius: 10,
  },
  tipIcon: { fontSize: '1.2rem' },
  tipTitle: { margin: '0 0 4px', fontSize: '0.75rem', fontWeight: 600 },
  tipText: { margin: 0, fontSize: '0.7rem', color: '#A3A3A3', lineHeight: 1.5 },
};

export default AnalyticsDashboard;
