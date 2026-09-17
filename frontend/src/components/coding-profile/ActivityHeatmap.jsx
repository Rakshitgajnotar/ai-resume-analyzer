import { useState } from 'react';

function ActivityHeatmap({ data = [], activeDaysCount = 0, currentStreak = 0, maxStreak = 0 }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  let calendarArray = [];
  if (Array.isArray(data)) {
    calendarArray = data;
  } else if (data && typeof data === 'object') {
    calendarArray = Object.entries(data).map(([timestamp, count]) => {
      const ts = Number(timestamp);
      const dateStr = !isNaN(ts) ? new Date(ts * 1000).toISOString().split('T')[0] : timestamp;
      return { date: dateStr, count: Number(count) };
    });
  }

  const countMap = {};
  let computedActiveDays = 0;
  for (const d of calendarArray) {
    if (d.date && d.count > 0) {
      countMap[d.date] = d.count;
      computedActiveDays++;
    }
  }

  const totalActive = activeDaysCount || computedActiveDays || Object.keys(countMap).length;

  const getColor = (count) => {
    if (!count || count === 0) return 'rgba(255, 255, 255, 0.06)';
    if (count <= 2) return '#065f46';
    if (count <= 5) return '#059669';
    if (count <= 10) return '#10b981';
    return '#34d399';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const weeks = [];
  const current = new Date(startDate);
  while (current <= today) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = current.toISOString().split('T')[0];
      const count = countMap[dateStr] ?? 0;
      week.push({ date: dateStr, count });
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  const cellSize = 12;
  const cellGap = 3;
  const totalWidth = weeks.length * (cellSize + cellGap) + 36;
  const totalHeight = 7 * (cellSize + cellGap) + 28;

  const monthLabels = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const d = new Date(week[0].date);
    if (d.getMonth() !== lastMonth) {
      lastMonth = d.getMonth();
      monthLabels.push({ month: months[lastMonth], x: wi * (cellSize + cellGap) + 36 });
    }
  });

  return (
    <div className="rounded-2xl p-6 bg-slate-900/60 border border-slate-800 space-y-6 relative">
      {/* Header & Badges */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span>📅 Active Days & Streak Tracker</span>
          </div>
          <h3 className="text-xl font-black text-white">Submission Activity Calendar</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <span className="text-[10px] font-bold text-emerald-400 block uppercase">Active Days</span>
            <span className="text-base font-black text-white">{totalActive} Days</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
            <span className="text-[10px] font-bold text-amber-400 block uppercase">Current Streak</span>
            <span className="text-base font-black text-white">{currentStreak} Days 🔥</span>
          </div>
          {maxStreak > 0 && (
            <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
              <span className="text-[10px] font-bold text-purple-400 block uppercase">Max Streak</span>
              <span className="text-base font-black text-white">{maxStreak} Days 🏆</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Floating Hover Status Display Bar */}
      <div className="min-h-[32px] flex items-center justify-between px-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800">
        {hoveredCell ? (
          <div className="flex items-center justify-between w-full text-xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: getColor(hoveredCell.count) }}
              />
              <span className="text-white font-bold">{formatDate(hoveredCell.date)}</span>
            </div>
            <div className="font-extrabold text-emerald-400">
              {hoveredCell.count > 0 ? (
                <span>{hoveredCell.count} submission{hoveredCell.count > 1 ? 's' : ''}</span>
              ) : (
                <span className="text-slate-500 font-medium">No submissions</span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-xs text-slate-500 italic">
            💡 Hover or click on any day box below to view exact submission details
          </span>
        )}
      </div>

      {/* SVG Grid */}
      <div className="overflow-x-auto pb-2 relative">
        <svg width={totalWidth} height={totalHeight} className="block mx-auto">
          {/* Months */}
          {monthLabels.map((m, i) => (
            <text key={i} x={m.x} y={12} fill="#94a3b8" fontSize="10" fontWeight="600" fontFamily="system-ui">
              {m.month}
            </text>
          ))}

          {/* Days */}
          {['Mon', 'Wed', 'Fri'].map((day, i) => (
            <text key={i} x={6} y={32 + i * 2 * (cellSize + cellGap)} fill="#64748b" fontSize="9" fontWeight="600" fontFamily="system-ui">
              {day}
            </text>
          ))}

          {/* Cells */}
          {weeks.map((week, wi) =>
            week.map((day, di) => {
              const isHovered = hoveredCell?.date === day.date;
              return (
                <rect
                  key={`${wi}-${di}`}
                  x={36 + wi * (cellSize + cellGap)}
                  y={22 + di * (cellSize + cellGap)}
                  width={cellSize}
                  height={cellSize}
                  rx={3}
                  fill={getColor(day.count)}
                  stroke={isHovered ? '#ffffff' : 'none'}
                  strokeWidth={isHovered ? 1.5 : 0}
                  className="cursor-pointer transition-all duration-150 hover:opacity-90"
                  onMouseEnter={() => setHoveredCell(day)}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={() => setHoveredCell(day)}
                />
              );
            })
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
        <span>Less</span>
        {[0, 2, 5, 10].map((c) => (
          <div key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(c) }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

export default ActivityHeatmap;
