"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Megaphone, Loader2 } from "lucide-react";
import { notificationService } from "@/services/api-services";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@/types";

export default function NotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await notificationService.list();
      const items = Array.isArray(result) ? result : (result as { data?: Notification[] })?.data || [];
      setNotifications(items);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markAllRead() {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast({ title: "Done", description: "All notifications marked as read", variant: "success" });
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  }

  async function markRead(businessId: string) {
    try {
      await notificationService.markRead(businessId);
      setNotifications((prev) => prev.map((n) => (n.business_id === businessId ? { ...n, is_read: true } : n)));
    } catch {
      setNotifications((prev) => prev.map((n) => (n.business_id === businessId ? { ...n, is_read: true } : n)));
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">{unreadCount} unread notifications</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" />Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className={`cursor-pointer transition-colors ${!n.is_read ? "border-primary/50 bg-primary/5" : ""}`} onClick={() => !n.is_read && markRead(n.business_id)}>
              <CardContent className="flex items-start gap-4 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${!n.is_read ? "bg-primary/10" : "bg-muted"}`}>
                  {n.category === "announcement" ? <Megaphone className="h-5 w-5 text-primary" /> : <Bell className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${!n.is_read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                    <span className="text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
                </div>
                {!n.is_read && <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bell className="mx-auto mb-2 h-8 w-8" />
            <p>No notifications yet. You&apos;ll see updates here as they come in.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
