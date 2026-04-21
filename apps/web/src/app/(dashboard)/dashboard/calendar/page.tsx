"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight, CalendarDays, Info } from "lucide-react";
import { holidayService, attendanceService } from "@/services/api-services";
import { useAuthStore } from "@/store/auth-store";
import type { Holiday } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttendanceRecord {
  id: string;
  attendance_date: string; // "YYYY-MM-DD"
  status: string; // present | absent | late | on_leave | half_day | holiday | weekend
  check_in_time?: string;
  check_out_time?: string;
}

interface CalendarDay {
  date: Date;
  iso: string; // "YYYY-MM-DD"
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  holiday?: Holiday;
  attendance?: AttendanceRecord;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ATTENDANCE_STYLES: Record<string, { cell: string; label: string }> = {
  present:  { cell: "bg-green-50 border-green-200",  label: "Present"  },
  late:     { cell: "bg-yellow-50 border-yellow-200", label: "Late"     },
  absent:   { cell: "bg-red-50 border-red-200",       label: "Absent"   },
  on_leave: { cell: "bg-blue-50 border-blue-200",     label: "On Leave" },
  half_day: { cell: "bg-orange-50 border-orange-200", label: "Half Day" },
};

const HOLIDAY_TYPE_COLORS: Record<string, string> = {
  public_holiday: "bg-red-500",
  optional:       "bg-orange-400",
  restricted:     "bg-purple-400",
  company_event:  "bg-blue-400",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function buildCalendarGrid(year: number, month: number): CalendarDay[] {
  const today = isoDate(new Date());
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const days: CalendarDay[] = [];

  // Pad start with days from previous month
  const startDow = firstDay.getDay();
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, -i);
    const iso = isoDate(d);
    days.push({ date: d, iso, isCurrentMonth: false, isToday: iso === today, isWeekend: d.getDay() === 0 || d.getDay() === 6 });
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month - 1, d);
    const iso = isoDate(date);
    days.push({ date, iso, isCurrentMonth: true, isToday: iso === today, isWeekend: date.getDay() === 0 || date.getDay() === 6 });
  }

  // Pad end to complete 6-row grid (42 cells)
  let fill = 1;
  while (days.length < 42) {
    const d = new Date(year, month, fill++);
    const iso = isoDate(d);
    days.push({ date: d, iso, isCurrentMonth: false, isToday: iso === today, isWeekend: d.getDay() === 0 || d.getDay() === 6 });
  }

  return days;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { user } = useAuthStore();
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const navigateMonth = (dir: -1 | 1) => {
    if (dir === -1) {
      if (month === 1) { setMonth(12); setYear(y => y - 1); }
      else setMonth(m => m - 1);
    } else {
      if (month === 12) { setMonth(1); setYear(y => y + 1); }
      else setMonth(m => m + 1);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [holidayResp, attResp] = await Promise.allSettled([
        holidayService.list({ year, page_size: 200 }),
        attendanceService.getMyHistory({ page_size: 100 }),
      ]);

      if (holidayResp.status === "fulfilled") {
        setHolidays(holidayResp.value.data || []);
      }
      if (attResp.status === "fulfilled") {
        const items = attResp.value.data || [];
        // Filter to records within this month
        const monthStr = `${year}-${String(month).padStart(2, "0")}`;
        setAttendance(items.filter((r: AttendanceRecord) => r.attendance_date?.startsWith(monthStr)));
      }
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { loadData(); }, [loadData]);

  // Build lookup maps
  const holidayMap: Record<string, Holiday> = {};
  holidays.forEach((h) => {
    if (h.date) holidayMap[h.date.substring(0, 10)] = h;
  });

  const attendanceMap: Record<string, AttendanceRecord> = {};
  attendance.forEach((r) => {
    if (r.attendance_date) attendanceMap[r.attendance_date.substring(0, 10)] = r;
  });

  const grid = buildCalendarGrid(year, month);

  // Enrich grid
  const enriched: CalendarDay[] = grid.map((day) => ({
    ...day,
    holiday: holidayMap[day.iso],
    attendance: attendanceMap[day.iso],
  }));

  // Monthly stats
  const currentMonthDays = enriched.filter(d => d.isCurrentMonth);
  const presentCount = currentMonthDays.filter(d => d.attendance?.status === "present").length;
  const lateCount = currentMonthDays.filter(d => d.attendance?.status === "late").length;
  const absentCount = currentMonthDays.filter(d => d.attendance?.status === "absent").length;
  const leaveCount = currentMonthDays.filter(d => d.attendance?.status === "on_leave").length;
  const holidayCount = currentMonthDays.filter(d => d.holiday).length;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground text-sm">Your attendance and company holidays at a glance</p>
        </div>

        {/* Month navigation */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">{MONTHS[month - 1]} {year}</h2>
          <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="ml-2" onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1); }}>
            Today
          </Button>
        </div>

        {/* Summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Present", value: presentCount, color: "text-green-600" },
            { label: "Late",    value: lateCount,    color: "text-yellow-600" },
            { label: "Absent",  value: absentCount,  color: "text-destructive" },
            { label: "On Leave",value: leaveCount,   color: "text-blue-600" },
            { label: "Holidays",value: holidayCount, color: "text-red-500" },
          ].map((s) => (
            <Card key={s.label} className="py-3">
              <CardContent className="p-4 pt-0">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Calendar grid */}
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <>
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {DAY_LABELS.map((d, i) => (
                    <div key={d} className={`text-center text-xs font-semibold pb-2 ${i === 0 || i === 6 ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Cells */}
                <div className="grid grid-cols-7 gap-1">
                  {enriched.map((day) => {
                    const attStyle = day.attendance ? ATTENDANCE_STYLES[day.attendance.status] : null;
                    const holidayDot = day.holiday ? (HOLIDAY_TYPE_COLORS[day.holiday.holiday_type || ""] || "bg-red-500") : null;

                    return (
                      <Tooltip key={day.iso}>
                        <TooltipTrigger asChild>
                          <div
                            className={[
                              "relative min-h-[68px] rounded-lg border p-1.5 transition-colors cursor-default",
                              !day.isCurrentMonth ? "opacity-30" : "",
                              day.isToday ? "ring-2 ring-primary ring-offset-1" : "",
                              day.isWeekend && !attStyle ? "bg-muted/40 border-muted" : "",
                              attStyle ? `${attStyle.cell}` : "border-border",
                              day.holiday && !attStyle ? "bg-red-50/50 border-red-100" : "",
                            ].join(" ")}
                          >
                            {/* Date number */}
                            <span className={[
                              "text-xs font-semibold block",
                              day.isToday ? "text-primary" : "",
                              day.isWeekend && !attStyle ? "text-muted-foreground/50" : "text-foreground",
                            ].join(" ")}>
                              {day.date.getDate()}
                            </span>

                            {/* Holiday dot + name */}
                            {day.holiday && (
                              <div className="mt-0.5 flex items-center gap-1">
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${holidayDot}`} />
                                <span className="text-[9px] leading-tight text-red-700 truncate font-medium">
                                  {day.holiday.name}
                                </span>
                              </div>
                            )}

                            {/* Attendance status */}
                            {day.attendance && (
                              <div className="mt-1">
                                <Badge
                                  variant="outline"
                                  className={[
                                    "text-[9px] px-1 py-0 h-4 font-medium border-0",
                                    day.attendance.status === "present"  ? "bg-green-100 text-green-700"  : "",
                                    day.attendance.status === "late"     ? "bg-yellow-100 text-yellow-700" : "",
                                    day.attendance.status === "absent"   ? "bg-red-100 text-red-700"     : "",
                                    day.attendance.status === "on_leave" ? "bg-blue-100 text-blue-700"   : "",
                                    day.attendance.status === "half_day" ? "bg-orange-100 text-orange-700" : "",
                                  ].join(" ")}
                                >
                                  {ATTENDANCE_STYLES[day.attendance.status]?.label || day.attendance.status}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-[200px]">
                          <p className="font-semibold">{day.date.toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long" })}</p>
                          {day.holiday && <p className="text-red-400 mt-1">🎌 {day.holiday.name} ({day.holiday.holiday_type?.replace("_", " ")})</p>}
                          {day.attendance && (
                            <p className="mt-1 capitalize">Status: {day.attendance.status.replace("_", " ")}
                              {day.attendance.check_in_time && ` · In: ${day.attendance.check_in_time.substring(0, 5)}`}
                              {day.attendance.check_out_time && ` · Out: ${day.attendance.check_out_time.substring(0, 5)}`}
                            </p>
                          )}
                          {day.isWeekend && !day.holiday && !day.attendance && <p className="text-muted-foreground">Weekend</p>}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Info className="h-4 w-4" /> Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attendance</p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(ATTENDANCE_STYLES).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div className={`h-3 w-4 rounded border ${val.cell}`} />
                      <span className="text-xs text-muted-foreground">{val.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-4 rounded border bg-muted/40 border-muted" />
                    <span className="text-xs text-muted-foreground">Weekend</span>
                  </div>
                </div>
              </div>
              <div className="border-l pl-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Holidays</p>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(HOLIDAY_TYPE_COLORS).map(([key, color]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${color}`} />
                      <span className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
