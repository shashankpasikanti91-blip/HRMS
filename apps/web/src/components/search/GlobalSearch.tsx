"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Building2, Clock, Briefcase, UserCheck, X, ArrowRight, Loader2 } from "lucide-react";
import { searchService } from "@/services/api-services";
import { resolveOpenRoute } from "@/lib/routeHelpers";
import { statusColor, statusLabel } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { SearchResultItem } from "@/types";

const ENTITY_ICONS: Record<string, LucideIcon> = {
  employee: Users,
  department: Building2,
  attendance: Clock,
  job: Briefcase,
  candidate: UserCheck,
  application: Briefcase,
  interview: Clock,
  default: Search,
};

function EntityIcon({ type, className }: { type: string; className?: string }) {
  const Icon: LucideIcon = ENTITY_ICONS[type] ?? ENTITY_ICONS.default;
  return <Icon className={className} />;
}

/** Group results by entity_type */
function groupResults(results: SearchResultItem[]): Record<string, SearchResultItem[]> {
  return results.reduce<Record<string, SearchResultItem[]>>((acc, item) => {
    const key = item.entity_type;
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
}

export default function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── Debounced search ──────────────────────────────────────────────────────
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await searchService.global(q.trim());
      setResults(res.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  // ── Keyboard shortcut (Ctrl/Cmd + K) ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Click outside to close ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Navigate to result ────────────────────────────────────────────────────
  function navigateTo(item: SearchResultItem) {
    const route = resolveOpenRoute(item.open_route);
    router.push(route);
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  // ── Flatten results for keyboard nav ─────────────────────────────────────
  const flat = results;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && flat[selected]) {
      navigateTo(flat[selected]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const grouped = groupResults(results);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* ── Trigger input ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search employees, jobs, candidates… (⌘K)"
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setSelected(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Results dropdown ── */}
      {open && (query.length > 0) && (
        <div className="absolute top-full z-50 mt-1 w-full min-w-[400px] rounded-lg border bg-popover shadow-lg">
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Searching…
            </div>
          )}

          {!loading && results.length === 0 && query.length > 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && Object.entries(grouped).map(([entityType, items]) => {
            // Find the global index of the first item in this group
            const groupStartIdx = flat.findIndex((r) => r.entity_type === entityType);
            return (
              <div key={entityType}>
                {/* Group label */}
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/40">
                  {entityType.replace(/_/g, " ")}
                </div>
                {items.map((item, localIdx) => {
                  const globalIdx = groupStartIdx + localIdx;
                  return (
                    <button
                      key={item.id}
                      className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent ${
                        selected === globalIdx ? "bg-accent" : ""
                      }`}
                      onClick={() => navigateTo(item)}
                      onMouseEnter={() => setSelected(globalIdx)}
                    >
                      {/* Icon */}
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <EntityIcon type={item.entity_type} className="h-3.5 w-3.5" />
                      </span>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{item.title}</span>
                          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            {item.business_id}
                          </span>
                        </div>
                        {item.subtitle && (
                          <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                        )}
                      </div>

                      {/* Status badge + arrow */}
                      <div className="flex shrink-0 items-center gap-2">
                        {item.status && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor(item.status)}`}>
                            {statusLabel(item.status)}
                          </span>
                        )}
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* Footer hint */}
          {results.length > 0 && (
            <div className="border-t px-3 py-1.5 text-[10px] text-muted-foreground">
              ↑↓ to navigate · Enter to open · Esc to close
            </div>
          )}
        </div>
      )}
    </div>
  );
}
