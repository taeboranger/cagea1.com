"use client";

import { useState } from "react";
import type { MonthlyContributions } from "@/lib/github";

const LEVEL_CLASSES = [
  "bg-line",
  "bg-frost/25",
  "bg-frost/50",
  "bg-frost/75",
  "bg-frost",
];

function levelFor(count: number, max: number) {
  if (count <= 0 || max <= 0) return 0;
  const ratio = count / max;
  return Math.min(4, Math.max(1, Math.ceil(ratio * 4)));
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

interface TooltipState {
  x: number;
  y: number;
  text: string;
}

export default function GithubContributions({
  data,
}: {
  data: MonthlyContributions;
}) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const currentMonth = new Date(data.weeks[0]?.[0]?.date ?? Date.now()).getUTCMonth();
  const monthDays = data.weeks
    .flat()
    .filter((day) => new Date(day.date).getUTCMonth() === currentMonth);
  const max = Math.max(0, ...monthDays.map((day) => day.count));

  function showTooltip(
    e: React.MouseEvent<HTMLSpanElement> | React.FocusEvent<HTMLSpanElement>,
    text: string
  ) {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ x: rect.left + rect.width / 2, y: rect.top, text });
  }

  return (
    <section className="mx-auto w-full max-w-5xl border-t border-line px-6 py-16 sm:px-10">
      <div className="mb-8 flex items-baseline justify-between">
        <h2 className="font-serif text-2xl text-ink">
          {data.monthLabel} 활동
        </h2>
        <span className="font-sans text-sm text-ink-soft">
          {data.totalContributions.toLocaleString()} contributions
        </span>
      </div>

      <div className="flex items-start gap-4 overflow-x-auto pb-2">
        <div className="grid auto-cols-max grid-flow-col grid-rows-7 gap-1">
          {data.weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => {
              const inMonth = new Date(day.date).getUTCMonth() === currentMonth;
              if (!inMonth) {
                return (
                  <span
                    key={`${weekIndex}-${dayIndex}`}
                    className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                  />
                );
              }
              const level = levelFor(day.count, max);
              const text = `${formatDate(day.date)} · 기여 ${day.count}건`;
              return (
                <span
                  key={`${weekIndex}-${dayIndex}`}
                  tabIndex={0}
                  aria-label={text}
                  onMouseEnter={(e) => showTooltip(e, text)}
                  onMouseLeave={() => setTooltip(null)}
                  onFocus={(e) => showTooltip(e, text)}
                  onBlur={() => setTooltip(null)}
                  className={`block h-3 w-3 border border-line sm:h-3.5 sm:w-3.5 ${LEVEL_CLASSES[level]}`}
                />
              );
            })
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 self-end pb-0.5 font-sans text-xs text-mist">
          <span>적음</span>
          {LEVEL_CLASSES.map((cls) => (
            <span key={cls} className={`h-3 w-3 border border-line ${cls}`} />
          ))}
          <span>많음</span>
        </div>
      </div>

      {tooltip && (
        <div
          role="tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-[calc(100%+6px)] whitespace-nowrap border border-line bg-paper-raised px-2 py-1 font-sans text-xs text-ink shadow-sm"
        >
          {tooltip.text}
        </div>
      )}
    </section>
  );
}
