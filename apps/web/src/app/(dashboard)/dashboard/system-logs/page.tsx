"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Shield,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/utils";

interface AuditEntry {
  id: string;
  business_id: string;
  entity_type: string;
  entity_id: string;
  entity_business_id: string | null;
  action: string;
  actor_user_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  description: string | null;
  created_at: string | null;
}

interface PageMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  update: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  delete: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  login: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  logout: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const ENTITY_TYPES = [
  "all",
  "employee",
  "user",
  "company",
  "department",
  "attendance",
  "leave",
  "payroll",
  "job",
  "candidate",
  "document",
  "policy",
];

const ACTIONS = ["all", "create", "update", "delete", "login", "logout"];

export default function SystemLogsPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("all");
  const [action, setAction] = useState("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const isAdmin = ["super_admin", "company_admin"].includes(user?.role || "");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        page_size: 25,
      };
      if (entityType !== "all") params.entity_type = entityType;
      if (action !== "all") params.action = action;

      const res = await api.get("/audit-logs", { params });
      setLogs(res.data.data || []);
      setMeta(res.data.meta || null);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, entityType, action, toast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [entityType, action]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Access Denied</h3>
          <p className="text-muted-foreground">
            You do not have permission to view system logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Activity Log</h1>
        <p className="text-muted-foreground">
          View all system events across your organization
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t === "all" ? "All Entities" : t.charAt(0).toUpperCase() + t.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a === "all" ? "All Actions" : a.charAt(0).toUpperCase() + a.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {meta && (
              <span className="ml-auto text-sm text-muted-foreground">
                {meta.total} total entries
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Time</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                  <th className="px-4 py-3 text-left font-medium">Entity</th>
                  <th className="px-4 py-3 text-left font-medium">Entity ID</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                  <th className="px-4 py-3 text-left font-medium">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <Activity className="mx-auto mb-2 h-8 w-8" />
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <>
                      <tr
                        key={log.id}
                        className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() =>
                          setExpandedRow(expandedRow === log.id ? null : log.id)
                        }
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {log.created_at ? timeAgo(log.created_at) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              ACTION_COLORS[log.action] ||
                              "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 capitalize">{log.entity_type}</td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {log.entity_business_id || log.entity_id?.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate">
                          {log.description || "—"}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {log.ip_address || "—"}
                        </td>
                      </tr>
                      {expandedRow === log.id && (
                        <tr key={`${log.id}-detail`} className="border-b bg-muted/20">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              {log.old_values && (
                                <div>
                                  <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                                    Previous Values
                                  </p>
                                  <pre className="rounded bg-muted p-3 text-xs overflow-auto max-h-48">
                                    {JSON.stringify(log.old_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.new_values && (
                                <div>
                                  <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                                    New Values
                                  </p>
                                  <pre className="rounded bg-muted p-3 text-xs overflow-auto max-h-48">
                                    {JSON.stringify(log.new_values, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.user_agent && (
                                <div className="md:col-span-2">
                                  <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                                    User Agent
                                  </p>
                                  <p className="text-xs text-muted-foreground break-all">
                                    {log.user_agent}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                                  Full Timestamp
                                </p>
                                <p className="text-xs">
                                  {log.created_at
                                    ? new Date(log.created_at).toLocaleString()
                                    : "—"}
                                </p>
                              </div>
                              <div>
                                <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                                  Actor ID
                                </p>
                                <p className="text-xs font-mono">
                                  {log.actor_user_id || "System"}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.total_pages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.has_prev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.has_next}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
