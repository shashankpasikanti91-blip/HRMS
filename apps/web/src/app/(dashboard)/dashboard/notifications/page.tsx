"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, Megaphone } from "lucide-react";
import api from "@/lib/api";
import type { Notification } from "@/types";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: "1", title: "Leave Request Approved", message: "Your leave request for Mar 20-22 has been approved by your manager.", type: "leave", read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: "2", title: "Payroll Processed", message: "March 2025 payroll has been processed. Your payslip is ready.", type: "payroll", read: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: "3", title: "New Goal Assigned", message: "You have been assigned a new goal: Complete API Integration by Apr 15.", type: "performance", read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: "4", title: "Interview Scheduled", message: "Interview scheduled with Alice Brown for Senior Developer position on Mar 18.", type: "recruitment", read: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
    { id: "5", title: "Company Announcement", message: "SRP AI Labs has been selected as a Top 50 AI Company by TechReview.", type: "announcement", read: true, createdAt: new Date(Date.now() - 259200000).toISOString() },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
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
        <Button variant="outline" size="sm" onClick={markAllRead}>
          <CheckCheck className="mr-2 h-4 w-4" />Mark all read
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <Card key={n.id} className={`cursor-pointer transition-colors ${!n.read ? "border-primary/50 bg-primary/5" : ""}`} onClick={() => markRead(n.id)}>
            <CardContent className="flex items-start gap-4 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${!n.read ? "bg-primary/10" : "bg-muted"}`}>
                {n.type === "announcement" ? <Megaphone className="h-5 w-5 text-primary" /> : <Bell className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                  <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>
              </div>
              {!n.read && <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
