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
import { Calendar, Plus, Pencil, Trash2, Loader2, Globe, MapPin } from "lucide-react";
import { holidayService } from "@/services/api-services";
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

export default function HolidaysPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const companyId = user?.company_id;

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [filterCountry, setFilterCountry] = useState("");
  const [filterState, setFilterState] = useState("");

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

  // Group holidays by month
  const grouped = MONTHS.map((month, idx) => ({
    month,
    items: holidays.filter((h) => new Date(h.date).getMonth() === idx).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  })).filter((g) => g.items.length > 0);

  // Unique countries/states from data for filter options
  const countries = [...new Set(holidays.map((h) => h.country).filter(Boolean))] as string[];
  const states = [...new Set(holidays.map((h) => h.state).filter(Boolean))] as string[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Holiday Calendar</h1>
          <p className="text-muted-foreground">Manage company holidays by country and state</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Add Holiday
        </Button>
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
                  {[year - 1, year, year + 1].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
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
              <span>{holidays.length} holidays</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Holidays by month */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : grouped.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No holidays found for {year}</p>
            <Button variant="outline" className="mt-4" onClick={openCreate}>Add your first holiday</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {grouped.map(({ month, items }) => (
            <Card key={month}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{month} {year}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {items.map((h) => {
                    const d = new Date(h.date);
                    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                    const dayNum = d.getDate();
                    return (
                      <div key={h.business_id} className="flex items-center gap-4 py-3 group">
                        <div className="flex-shrink-0 w-14 text-center">
                          <div className="text-2xl font-bold leading-none">{dayNum}</div>
                          <div className="text-xs text-muted-foreground uppercase">{dayName}</div>
                        </div>
                        <Separator orientation="vertical" className="h-10" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{h.name}</span>
                            <Badge variant={HOLIDAY_TYPE_COLORS[h.holiday_type] || "secondary"}>
                              {h.holiday_type}
                            </Badge>
                            {h.is_paid && <Badge variant="outline" className="text-[10px]">Paid</Badge>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            {h.country && (
                              <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{h.country}</span>
                            )}
                            {h.state && (
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{h.state}</span>
                            )}
                            {h.description && <span>• {h.description}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(h)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(h.business_id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
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
