"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Globe,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Bell,
  Link2,
  Download,
  ExternalLink,
} from "lucide-react";
import { holidayService, notificationService } from "@/services/api-services";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import type { Holiday } from "@/types";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const HOLIDAY_TYPES = [
  { value: "public", label: "Public Holiday" },
  { value: "restricted", label: "Restricted Holiday" },
  { value: "optional", label: "Optional Holiday" },
];

const HOLIDAY_TYPE_COLORS: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  public: "success",
  restricted: "warning",
  optional: "secondary",
};

const ALL_COUNTRIES = "__all_countries__";
const ALL_STATES = "__all_states__";
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateOnlyString(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escICS(value: string) {
  return value.replace(/[\\;,\n]/g, (ch) => {
    if (ch === "\\") return "\\\\";
    if (ch === ";") return "\\;";
    if (ch === ",") return "\\,";
    return "\\n";
  });
}

export default function HolidaysPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const companyId = user?.company_id;
  const role = user?.role || "employee";
  const isAdmin = ["super_admin", "company_admin", "hr_manager"].includes(role);

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(toDateOnlyString(new Date()));
  const [filterCountry, setFilterCountry] = useState("");
  const [filterState, setFilterState] = useState("");
  const [calendarReminders, setCalendarReminders] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    date: "",
    holiday_type: "public",
    country: "",
    state: "",
    description: "",
    is_paid: true,
  });

  const fetchHolidays = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const params: Record<string, string | number> = { year };
      if (filterCountry) params.country = filterCountry;
      if (filterState) params.state = filterState;
      const res = await holidayService.list(params);
      setHolidays(res.data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load holidays", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [companyId, year, filterCountry, filterState, toast]);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  useEffect(() => {
    const saved = window.localStorage.getItem("hrms-holiday-calendar-reminders");
    setCalendarReminders(saved === "true");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("hrms-holiday-calendar-reminders", String(calendarReminders));
  }, [calendarReminders]);

  useEffect(() => {
    if (!calendarReminders) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const now = new Date();
    const next14Days = new Date(now);
    next14Days.setDate(now.getDate() + 14);

    holidays.forEach((holiday) => {
      const holidayDate = new Date(`${holiday.date}T00:00:00`);
      if (holidayDate < now || holidayDate > next14Days) return;

      const key = `hrms-holiday-reminded-${holiday.business_id}-${holiday.date}`;
      if (window.localStorage.getItem(key)) return;

      new Notification("Upcoming holiday", {
        body: `${holiday.name} on ${holidayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      });
      window.localStorage.setItem(key, "1");
    });
  }, [holidays, calendarReminders]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", date: "", holiday_type: "public", country: "", state: "", description: "", is_paid: true });
    setDialogOpen(true);
  };

  const openEdit = (h: Holiday) => {
    setEditing(h);
    setForm({
      name: h.name,
      date: h.date,
      holiday_type: h.holiday_type,
      country: h.country || "",
      state: h.state || "",
      description: h.description || "",
      is_paid: h.is_paid,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!companyId || !form.name || !form.date) return;
    setSaving(true);
    try {
      const payload = { ...form, company_id: companyId };
      if (editing) {
        await holidayService.update(editing.business_id, payload);
        toast({ title: "Holiday updated" });
      } else {
        await holidayService.create(payload);
        toast({ title: "Holiday created" });
      }
      setDialogOpen(false);
      fetchHolidays();
    } catch {
      toast({ title: "Error", description: "Failed to save holiday", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await holidayService.delete(id);
      toast({ title: "Holiday deleted" });
      fetchHolidays();
    } catch {
      toast({ title: "Error", description: "Failed to delete holiday", variant: "destructive" });
    }
  };

  // Unique countries/states from data for filter options
  const countries = [...new Set(holidays.map((h) => h.country).filter(Boolean))] as string[];
  const states = [...new Set(holidays.map((h) => h.state).filter(Boolean))] as string[];

  const monthHolidays = holidays
    .filter((h) => new Date(h.date).getMonth() === month)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const holidaysByDate = monthHolidays.reduce<Record<string, Holiday[]>>((acc, holiday) => {
    if (!acc[holiday.date]) acc[holiday.date] = [];
    acc[holiday.date].push(holiday);
    return acc;
  }, {});

  const selectedDateHolidays = holidaysByDate[selectedDate] ?? [];

  const firstDay = new Date(year, month, 1).getDay();
  const monthDays = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendarCells: Array<{ date: string; day: number; inCurrentMonth: boolean }> = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const d = new Date(year, month - 1, day);
    calendarCells.push({ date: toDateOnlyString(d), day, inCurrentMonth: false });
  }
  for (let day = 1; day <= monthDays; day++) {
    const d = new Date(year, month, day);
    calendarCells.push({ date: toDateOnlyString(d), day, inCurrentMonth: true });
  }
  while (calendarCells.length % 7 !== 0) {
    const d = new Date(year, month + 1, calendarCells.length - (firstDay + monthDays) + 1);
    calendarCells.push({ date: toDateOnlyString(d), day: d.getDate(), inCurrentMonth: false });
  }

  const todayStr = toDateOnlyString(new Date());

  function navigateMonth(direction: "prev" | "next") {
    if (direction === "prev") {
      if (month === 0) {
        setYear((y) => y - 1);
        setMonth(11);
      } else {
        setMonth((m) => m - 1);
      }
      return;
    }
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  async function toggleReminders(enabled: boolean) {
    if (!enabled) {
      setCalendarReminders(false);
      toast({ title: "Calendar reminders off" });
      return;
    }

    if (!("Notification" in window)) {
      toast({ title: "Not supported", description: "Browser notifications are not supported here", variant: "destructive" });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast({ title: "Permission denied", description: "Allow notifications to enable calendar reminders", variant: "destructive" });
      return;
    }

    setCalendarReminders(true);
    toast({ title: "Calendar reminders on", description: "Upcoming holidays will trigger browser alerts" });
    await notificationService.list({ page_size: 1 }).catch(() => void 0);
  }

  function generateIcsContent(items: Holiday[]) {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//SRP AI HRMS//Holiday Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    items.forEach((holiday) => {
      const dtStart = holiday.date.replaceAll("-", "");
      const d = new Date(`${holiday.date}T00:00:00`);
      d.setDate(d.getDate() + 1);
      const dtEnd = toDateOnlyString(d).replaceAll("-", "");
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${holiday.business_id}@srp-hrms`);
      lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`);
      lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
      lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
      lines.push(`SUMMARY:${escICS(holiday.name)}`);
      lines.push(`DESCRIPTION:${escICS(holiday.description || `${holiday.holiday_type} holiday`)}`);
      lines.push("END:VEVENT");
    });

    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }

  function downloadIcs(items: Holiday[]) {
    if (!items.length) {
      toast({ title: "No holidays", description: "No holidays available to export", variant: "destructive" });
      return;
    }

    const ics = generateIcsContent(items);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hrms-holidays-${year}-${String(month + 1).padStart(2, "0")}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "ICS file downloaded" });
  }

  function openGoogleCalendar(holiday: Holiday) {
    const start = holiday.date.replaceAll("-", "");
    const d = new Date(`${holiday.date}T00:00:00`);
    d.setDate(d.getDate() + 1);
    const end = toDateOnlyString(d).replaceAll("-", "");
    const text = encodeURIComponent(holiday.name);
    const details = encodeURIComponent(holiday.description || "Holiday from SRP AI HRMS");
    const location = encodeURIComponent([holiday.state, holiday.country].filter(Boolean).join(", "));
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}`, "_blank");
  }

  function openOutlookCalendar(holiday: Holiday) {
    const start = new Date(`${holiday.date}T09:00:00`).toISOString();
    const end = new Date(`${holiday.date}T17:00:00`).toISOString();
    const subject = encodeURIComponent(holiday.name);
    const body = encodeURIComponent(holiday.description || "Holiday from SRP AI HRMS");
    const location = encodeURIComponent([holiday.state, holiday.country].filter(Boolean).join(", "));
    window.open(`https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${subject}&body=${body}&startdt=${encodeURIComponent(start)}&enddt=${encodeURIComponent(end)}&location=${location}`, "_blank");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Holiday Calendar</h1>
          <p className="text-muted-foreground">Advanced monthly planning with calendar sync and reminders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => downloadIcs(monthHolidays)}>
            <Download className="h-4 w-4 mr-2" /> Export ICS
          </Button>
          {isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Add Holiday
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Year</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 21 }, (_, i) => 2020 + i).map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Month</Label>
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, idx) => (
                    <SelectItem key={m} value={String(idx)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Country</Label>
              <Select
                value={filterCountry || ALL_COUNTRIES}
                onValueChange={(v) => setFilterCountry(v === ALL_COUNTRIES ? "" : v)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_COUNTRIES}>All countries</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">State</Label>
              <Select
                value={filterState || ALL_STATES}
                onValueChange={(v) => setFilterState(v === ALL_STATES ? "" : v)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All states" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATES}>All states</SelectItem>
                  {states.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 ml-auto text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{monthHolidays.length} in {MONTHS[month]}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-200/60 bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-blue-900">Calendar Connections</p>
              <p className="text-sm text-blue-800/80">Sync holidays to external calendars and trigger advance reminders for upcoming events.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadIcs(monthHolidays)}>
                <Link2 className="h-4 w-4 mr-1" /> iCal / Apple
              </Button>
              <Button variant="outline" size="sm" onClick={() => selectedDateHolidays[0] ? openGoogleCalendar(selectedDateHolidays[0]) : toast({ title: "Select a holiday date first", variant: "destructive" })}>
                <ExternalLink className="h-4 w-4 mr-1" /> Google Calendar
              </Button>
              <Button variant="outline" size="sm" onClick={() => selectedDateHolidays[0] ? openOutlookCalendar(selectedDateHolidays[0]) : toast({ title: "Select a holiday date first", variant: "destructive" })}>
                <ExternalLink className="h-4 w-4 mr-1" /> Outlook
              </Button>
              <Button
                size="sm"
                variant={calendarReminders ? "default" : "outline"}
                onClick={() => toggleReminders(!calendarReminders)}
              >
                <Bell className="h-4 w-4 mr-1" /> {calendarReminders ? "Reminders On" : "Enable Reminders"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : monthHolidays.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No holidays found for {MONTHS[month]} {year}</p>
            {isAdmin && <Button variant="outline" className="mt-4" onClick={openCreate}>Add your first holiday</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth("prev")}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="text-lg">{MONTHS[month]} {year}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth("next")}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {WEEK_DAYS.map((d) => (
                  <div key={d} className="rounded-md p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell) => {
                  const dayItems = holidaysByDate[cell.date] ?? [];
                  const isSelected = selectedDate === cell.date;
                  const isToday = cell.date === todayStr;
                  return (
                    <button
                      key={cell.date}
                      onClick={() => setSelectedDate(cell.date)}
                      className={[
                        "min-h-[86px] rounded-lg border p-2 text-left transition-colors",
                        cell.inCurrentMonth ? "bg-background hover:bg-accent" : "bg-muted/40 text-muted-foreground",
                        isSelected ? "border-blue-500 ring-1 ring-blue-400" : "border-border",
                      ].join(" ")}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`text-sm ${isToday ? "font-semibold text-blue-700" : ""}`}>{cell.day}</span>
                        {dayItems.length > 0 && (
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px]">{dayItems.length}</Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        {dayItems.slice(0, 2).map((holiday) => (
                          <div key={holiday.business_id} className="truncate rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700">
                            {holiday.name}
                          </div>
                        ))}
                        {dayItems.length > 2 && <div className="text-[10px] text-muted-foreground">+{dayItems.length - 2} more</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selected Date Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">
                  {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </p>
                <p className="text-xs text-muted-foreground">{selectedDateHolidays.length} holiday(s) on this date</p>
              </div>

              {selectedDateHolidays.length === 0 ? (
                <p className="text-sm text-muted-foreground">No holiday on the selected date.</p>
              ) : (
                <div className="space-y-3">
                  {selectedDateHolidays.map((h) => (
                    <div key={h.business_id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{h.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant={HOLIDAY_TYPE_COLORS[h.holiday_type] || "secondary"}>{h.holiday_type}</Badge>
                            {h.is_paid && <Badge variant="outline" className="text-[10px]">Paid</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {isAdmin && (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(h)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(h.business_id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {h.country && <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" />{h.country}</span>}
                        {h.state && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{h.state}</span>}
                      </div>
                      {h.description && <p className="mt-2 text-xs text-muted-foreground">{h.description}</p>}
                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openGoogleCalendar(h)}>Google</Button>
                        <Button variant="outline" size="sm" onClick={() => openOutlookCalendar(h)}>Outlook</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator />
              <div>
                <p className="mb-2 text-sm font-medium">Month Timeline</p>
                <div className="max-h-64 space-y-2 overflow-auto pr-1">
                  {monthHolidays.map((h) => (
                    <button
                      key={h.business_id}
                      onClick={() => setSelectedDate(h.date)}
                      className="w-full rounded-md border p-2 text-left hover:bg-accent"
                    >
                      <p className="text-sm font-medium">{new Date(`${h.date}T00:00:00`).toLocaleDateString("en-US", { day: "numeric", month: "short" })} - {h.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{h.holiday_type}</p>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Holiday" : "Add Holiday"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Holiday Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Independence Day" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Date *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.holiday_type} onValueChange={(v) => setForm({ ...form, holiday_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HOLIDAY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Country</Label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="e.g. India" />
              </div>
              <div className="space-y-1">
                <Label>State</Label>
                <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="e.g. Karnataka" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_paid"
                checked={form.is_paid}
                onChange={(e) => setForm({ ...form, is_paid: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="is_paid">Paid Holiday</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.date}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
