"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import { notificationService } from "@/services/api-services";
import { resolveOpenRoute } from "@/lib/routeHelpers";
import { timeAgo } from "@/lib/utils";
import type { Notification } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  attendance: "bg-blue-500",
  leave: "bg-yellow-500",
  payroll: "bg-green-500",
  recruitment: "bg-purple-500",
  performance: "bg-pink-500",
  system: "bg-gray-500",
  hr: "bg-orange-500",
};

function categoryColor(category: string): string {
  return CATEGORY_COLORS[category?.toLowerCase()] ?? "bg-gray-400";
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.list({ page_size: 20 });
      setNotifications(data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount + poll every 60 s
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60_000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function markRead(notification: Notification) {
    if (!notification.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      await notificationService.markRead(notification.business_id).catch(() => void 0);
    }
    if (notification.action_url) {
      router.push(resolveOpenRoute(notification.action_url));
      setOpen(false);
    }
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await notificationService.markAllRead().catch(() => void 0);
  }

  return (
    <div ref={containerRef} className="relative">
      {/* ── Bell button ── */}
      <button
        onClick={() => { setOpen((o) => !o); if (!open) loadNotifications(); }}
        className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[380px] rounded-lg border bg-popover shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="py-10 text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            )}

            {!loading && notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => markRead(notif)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent ${
                  !notif.is_read ? "bg-muted/30" : ""
                }`}
              >
                {/* Category dot */}
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${categoryColor(notif.category ?? "system")}`}
                />

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm leading-tight ${!notif.is_read ? "font-medium" : ""}`}>
                    {notif.title}
                  </p>
                  {notif.message && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {notif.message}
                    </p>
                  )}
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {timeAgo(notif.created_at)}
                  </p>
                </div>

                {/* Unread indicator */}
                {!notif.is_read && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
                {notif.is_read && (
                  <Check className="mt-1 h-3 w-3 shrink-0 text-muted-foreground/50" />
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t px-4 py-2">
            <button
              onClick={() => { router.push("/dashboard/notifications"); setOpen(false); }}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
