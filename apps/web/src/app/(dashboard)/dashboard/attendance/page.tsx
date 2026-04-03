"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, LogIn, LogOut, Calendar, Users } from "lucide-react";

export default function AttendancePage() {
  const [clockedIn, setClockedIn] = useState(false);

  const todayRecords = [
    { name: "Arjun Patel", clockIn: "09:02 AM", clockOut: "—", status: "present" },
    { name: "Priya Sharma", clockIn: "08:55 AM", clockOut: "—", status: "present" },
    { name: "Rahul Kumar", clockIn: "—", clockOut: "—", status: "on_leave" },
    { name: "Sneha Gupta", clockIn: "09:30 AM", clockOut: "—", status: "late" },
    { name: "Vikram Singh", clockIn: "09:00 AM", clockOut: "—", status: "present" },
  ];

  const leaveRequests = [
    { name: "Rahul Kumar", type: "Sick Leave", from: "Mar 15", to: "Mar 17", days: 3, status: "approved" },
    { name: "Priya Sharma", type: "Casual Leave", from: "Mar 20", to: "Mar 20", days: 1, status: "pending" },
    { name: "Vikram Singh", type: "Privilege Leave", from: "Apr 1", to: "Apr 5", days: 5, status: "pending" },
  ];

  const statusColors: Record<string, "success" | "warning" | "destructive" | "default"> = {
    present: "success",
    late: "warning",
    absent: "destructive",
    on_leave: "default",
    approved: "success",
    pending: "warning",
    rejected: "destructive",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance & Leave</h1>
        <p className="text-muted-foreground">Track attendance, manage leaves, and view schedules</p>
      </div>

      {/* Clock In/Out Card */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
              <p className="text-sm text-muted-foreground">{clockedIn ? "Clocked in at 09:00 AM" : "You haven't clocked in yet"}</p>
            </div>
          </div>
          <Button
            size="lg"
            variant={clockedIn ? "destructive" : "default"}
            onClick={() => setClockedIn(!clockedIn)}
          >
            {clockedIn ? <><LogOut className="mr-2 h-4 w-4" />Clock Out</> : <><LogIn className="mr-2 h-4 w-4" />Clock In</>}
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Present Today", value: "231", icon: Users, color: "text-green-600" },
          { label: "On Leave", value: "12", icon: Calendar, color: "text-yellow-600" },
          { label: "Late Arrivals", value: "5", icon: Clock, color: "text-orange-600" },
          { label: "Absent", value: "5", icon: Users, color: "text-red-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Today&apos;s Attendance</TabsTrigger>
          <TabsTrigger value="leaves">Leave Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Log</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-sm font-medium">Employee</th>
                    <th className="p-3 text-left text-sm font-medium">Clock In</th>
                    <th className="p-3 text-left text-sm font-medium">Clock Out</th>
                    <th className="p-3 text-left text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayRecords.map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-3 text-sm font-medium">{r.name}</td>
                      <td className="p-3 text-sm">{r.clockIn}</td>
                      <td className="p-3 text-sm">{r.clockOut}</td>
                      <td className="p-3"><Badge variant={statusColors[r.status]}>{r.status.replace("_", " ")}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-sm font-medium">Employee</th>
                    <th className="p-3 text-left text-sm font-medium">Type</th>
                    <th className="p-3 text-left text-sm font-medium">Duration</th>
                    <th className="p-3 text-left text-sm font-medium">Days</th>
                    <th className="p-3 text-left text-sm font-medium">Status</th>
                    <th className="p-3 text-left text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map((l, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-3 text-sm font-medium">{l.name}</td>
                      <td className="p-3 text-sm">{l.type}</td>
                      <td className="p-3 text-sm">{l.from} - {l.to}</td>
                      <td className="p-3 text-sm">{l.days}</td>
                      <td className="p-3"><Badge variant={statusColors[l.status]}>{l.status}</Badge></td>
                      <td className="p-3">
                        {l.status === "pending" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="default">Approve</Button>
                            <Button size="sm" variant="outline">Reject</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
