"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
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
  Download,
  Upload,
  Sparkles,
} from "lucide-react";
import { holidayService } from "@/services/api-services";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import type { Holiday } from "@/types";

// ─── National Holiday Presets ────────────────────────────────────────────────

interface NHDay { name: string; month: number; day: number; type: string; desc?: string }
const NATIONAL_HOLIDAYS: Record<string, NHDay[]> = {
  India: [
    { name: "New Year's Day", month: 1, day: 1, type: "public" },
    { name: "Republic Day", month: 1, day: 26, type: "public", desc: "National holiday" },
    { name: "Holi", month: 3, day: 14, type: "restricted", desc: "Date varies" },
    { name: "Good Friday", month: 4, day: 18, type: "public", desc: "Date varies" },
    { name: "Eid ul-Fitr", month: 4, day: 10, type: "public", desc: "Date varies (moon sighting)" },
    { name: "Independence Day", month: 8, day: 15, type: "public", desc: "India's Independence Day" },
    { name: "Eid ul-Adha / Bakrid", month: 6, day: 17, type: "public", desc: "Date varies" },
    { name: "Muharram", month: 7, day: 17, type: "restricted", desc: "Date varies" },
    { name: "Janmashtami", month: 8, day: 16, type: "restricted", desc: "Date varies" },
    { name: "Ganesh Chaturthi", month: 8, day: 27, type: "restricted", desc: "Date varies" },
    { name: "Gandhi Jayanti", month: 10, day: 2, type: "public", desc: "Mahatma Gandhi's birthday" },
    { name: "Dussehra", month: 10, day: 13, type: "public", desc: "Date varies" },
    { name: "Mawlid / Milad-un-Nabi", month: 9, day: 16, type: "restricted", desc: "Date varies" },
    { name: "Diwali", month: 10, day: 20, type: "public", desc: "Festival of Lights — date varies" },
    { name: "Diwali Holiday", month: 10, day: 21, type: "restricted", desc: "Day after Diwali" },
    { name: "Guru Nanak Jayanti", month: 11, day: 5, type: "public", desc: "Date varies" },
    { name: "Christmas Day", month: 12, day: 25, type: "public" },
  ],
  Malaysia: [
    { name: "New Year's Day", month: 1, day: 1, type: "public" },
    { name: "Chinese New Year (Day 1)", month: 1, day: 29, type: "public", desc: "Date varies" },
    { name: "Chinese New Year (Day 2)", month: 1, day: 30, type: "public", desc: "Date varies" },
    { name: "Hari Raya Aidilfitri (Day 1)", month: 4, day: 10, type: "public", desc: "Date varies" },
    { name: "Hari Raya Aidilfitri (Day 2)", month: 4, day: 11, type: "public", desc: "Date varies" },
    { name: "Labour Day", month: 5, day: 1, type: "public" },
    { name: "Wesak Day", month: 5, day: 12, type: "public", desc: "Date varies" },
    { name: "Hari Raya Aidiladha", month: 6, day: 17, type: "public", desc: "Date varies" },
    { name: "Awal Muharram", month: 7, day: 7, type: "public", desc: "Islamic New Year — date varies" },
    { name: "National Day / Hari Merdeka", month: 8, day: 31, type: "public" },
    { name: "Malaysia Day", month: 9, day: 16, type: "public" },
    { name: "Maulidur Rasul", month: 9, day: 16, type: "public", desc: "Date varies" },
    { name: "Deepavali", month: 10, day: 20, type: "public", desc: "Date varies" },
    { name: "Christmas Day", month: 12, day: 25, type: "public" },
  ],
  Singapore: [
    { name: "New Year's Day", month: 1, day: 1, type: "public" },
    { name: "Chinese New Year (Day 1)", month: 1, day: 29, type: "public", desc: "Date varies" },
    { name: "Chinese New Year (Day 2)", month: 1, day: 30, type: "public", desc: "Date varies" },
    { name: "Hari Raya Puasa", month: 4, day: 10, type: "public", desc: "Date varies" },
    { name: "Good Friday", month: 4, day: 18, type: "public", desc: "Date varies" },
    { name: "Labour Day", month: 5, day: 1, type: "public" },
    { name: "Vesak Day", month: 5, day: 12, type: "public", desc: "Date varies" },
    { name: "Hari Raya Haji", month: 6, day: 17, type: "public", desc: "Date varies" },
    { name: "National Day", month: 8, day: 9, type: "public" },
    { name: "Deepavali", month: 10, day: 20, type: "public", desc: "Date varies" },
    { name: "Christmas Day", month: 12, day: 25, type: "public" },
  ],
  UAE: [
    { name: "New Year's Day", month: 1, day: 1, type: "public" },
    { name: "Eid ul-Fitr (Day 1)", month: 4, day: 10, type: "public", desc: "Date varies" },
    { name: "Eid ul-Fitr (Day 2)", month: 4, day: 11, type: "public", desc: "Date varies" },
    { name: "Eid ul-Fitr (Day 3)", month: 4, day: 12, type: "public", desc: "Date varies" },
    { name: "Arafat Day (Eid ul-Adha Eve)", month: 6, day: 16, type: "public", desc: "Date varies" },
    { name: "Eid ul-Adha (Day 1)", month: 6, day: 17, type: "public", desc: "Date varies" },
    { name: "Eid ul-Adha (Day 2)", month: 6, day: 18, type: "public", desc: "Date varies" },
    { name: "Islamic New Year", month: 7, day: 7, type: "public", desc: "Date varies" },
    { name: "Prophet's Birthday", month: 9, day: 16, type: "public", desc: "Date varies" },
    { name: "UAE National Day", month: 12, day: 2, type: "public" },
    { name: "UAE National Day (Day 2)", month: 12, day: 3, type: "public" },
  ],
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
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

function toDateOnlyString(date: Date): string {
  const y = date.getFullYear();
  const mo = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

export default function HolidaysPage() {
  const router = useRouter();
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

  // National holidays import
  const [nhDialogOpen, setNhDialogOpen] = useState(false);
  const [nhCountry, setNhCountry] = useState("India");
  const [nhYear, setNhYear] = useState(new Date().getFullYear());
  const [nhSelected, setNhSelected] = useState<Set<number>>(new Set());
  const [nhImporting, setNhImporting] = useState(false);

  function nhToggleAll() {
    const list = NATIONAL_HOLIDAYS[nhCountry] ?? [];
    if (nhSelected.size === list.length) setNhSelected(new Set());
    else setNhSelected(new Set(list.map((_, i) => i)));
  }

  function nhToggle(idx: number) {
    setNhSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

  async function handleNhImport() {
    const list = NATIONAL_HOLIDAYS[nhCountry] ?? [];
    const toImport = [...nhSelected].map((i) => list[i]);
    if (!toImport.length) return;
    setNhImporting(true);
    let ok = 0;
    for (const h of toImport) {
      try {
        const dateStr = `${nhYear}-${String(h.month).padStart(2, "0")}-${String(h.day).padStart(2, "0")}`;
        await holidayService.create({
          name: h.name, date: dateStr, holiday_type: h.type,
          country: nhCountry, description: h.desc, is_paid: h.type === "public",
        });
        ok++;
      } catch { /* skip duplicates */ }
    }
    setNhImporting(false);
    toast({ title: "Import complete", description: `${ok} holidays imported for ${nhCountry} ${nhYear}`, variant: ok > 0 ? "success" : "destructive" });
    setNhDialogOpen(false);
    fetchHolidays();
  }

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

  function handleExportCSV() {
    if (!monthHolidays.length) {
      toast({ title: "No holidays", description: "No holidays to export for this month", variant: "destructive" });
      return;
    }
    const header = "Name,Date,Type,Country,State,Paid,Description";
    const rows = monthHolidays.map((h) =>
      [`"${h.name}"`, h.date, h.holiday_type, h.country || "", h.state || "", h.is_paid ? "Yes" : "No", `"${h.description || ""}"`].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `holidays-${year}-${String(month + 1).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${monthHolidays.length} holidays exported as CSV` });
  }

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
      if (month === 0) { setYear((y) => y - 1); setMonth(11); } else setMonth((m) => m - 1);
    } else {
      if (month === 11) { setYear((y) => y + 1); setMonth(0); } else setMonth((m) => m + 1);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Holiday Calendar</h1>
          <p className="text-muted-foreground">View and manage company holidays by month</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />Export CSV
          </Button>
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/holidays/import")}>
              <Upload className="h-4 w-4 mr-2" />Import CSV
            </Button>
          )}
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => { setNhSelected(new Set()); setNhDialogOpen(true); }}>
              <Sparkles className="h-4 w-4 mr-2" />National Holidays
            </Button>
          )}
          {isAdmin && (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />Add Holiday
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Year</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
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
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, idx) => <SelectItem key={m} value={String(idx)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Country</Label>
              <Select value={filterCountry || ALL_COUNTRIES} onValueChange={(v) => setFilterCountry(v === ALL_COUNTRIES ? "" : v)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All countries" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_COUNTRIES}>All countries</SelectItem>
                  {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">State</Label>
              <Select value={filterState || ALL_STATES} onValueChange={(v) => setFilterState(v === ALL_STATES ? "" : v)}>
                <SelectTrigger className="w-40"><SelectValue placeholder="All states" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATES}>All states</SelectItem>
                  {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : monthHolidays.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">No holidays found for {MONTHS[month]} {year}</p>
            <p className="text-sm text-muted-foreground mt-1">Use filters to browse other months or add holidays.</p>
            {isAdmin && (
              <Button variant="outline" className="mt-4" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />Add Holiday
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth("prev")}><ChevronLeft className="h-5 w-5" /></Button>
                <CardTitle className="text-lg">{MONTHS[month]} {year}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth("next")}><ChevronRight className="h-5 w-5" /></Button>
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
                        {dayItems.length > 0 && <Badge variant="outline" className="h-5 px-1.5 text-[10px]">{dayItems.length}</Badge>}
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
                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(h)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(h.business_id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {h.country && <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" />{h.country}</span>}
                        {h.state && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{h.state}</span>}
                      </div>
                      {h.description && <p className="mt-2 text-xs text-muted-foreground">{h.description}</p>}
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
                      <p className="text-sm font-medium">
                        {new Date(`${h.date}T00:00:00`).toLocaleDateString("en-US", { day: "numeric", month: "short" })} — {h.name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">{h.holiday_type}</p>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                    {HOLIDAY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
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
                <Label>State / Region</Label>
                <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="e.g. Karnataka" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_paid" checked={form.is_paid} onChange={(e) => setForm({ ...form, is_paid: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
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

      {/* National Holidays Import Dialog */}
      <Dialog open={nhDialogOpen} onOpenChange={setNhDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Import National Holidays</DialogTitle>
            <DialogDescription>
              Select official public holidays for a country and year. Approximate dates for lunar/Islamic events.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 items-end shrink-0">
            <div className="space-y-1">
              <Label className="text-xs">Country</Label>
              <Select value={nhCountry} onValueChange={(v) => { setNhCountry(v); setNhSelected(new Set()); }}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(NATIONAL_HOLIDAYS).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Year</Label>
              <Select value={String(nhYear)} onValueChange={(v) => setNhYear(Number(v))}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="sm" onClick={nhToggleAll} className="mb-0.5">
              {nhSelected.size === (NATIONAL_HOLIDAYS[nhCountry]?.length ?? 0) ? "Deselect All" : "Select All"}
            </Button>
            <span className="text-sm text-muted-foreground mb-1 ml-auto">{nhSelected.size} selected</span>
          </div>
          <div className="flex-1 overflow-y-auto border rounded-lg divide-y">
            {(NATIONAL_HOLIDAYS[nhCountry] ?? []).map((h, idx) => {
              const dateStr = `${nhYear}-${String(h.month).padStart(2, "0")}-${String(h.day).padStart(2, "0")}`;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 cursor-pointer"
                  onClick={() => nhToggle(idx)}
                >
                  <Checkbox checked={nhSelected.has(idx)} onCheckedChange={() => nhToggle(idx)} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{h.name}</span>
                    {h.desc && <span className="ml-2 text-xs text-muted-foreground">{h.desc}</span>}
                  </div>
                  <Badge variant={h.type === "public" ? "success" : h.type === "restricted" ? "warning" : "secondary"} className="text-[10px] shrink-0">
                    {h.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono shrink-0">{dateStr}</span>
                </div>
              );
            })}
          </div>
          <DialogFooter className="shrink-0">
            <Button variant="outline" onClick={() => setNhDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleNhImport} disabled={nhSelected.size === 0 || nhImporting}>
              {nhImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import {nhSelected.size > 0 ? nhSelected.size : ""} Holiday{nhSelected.size !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
