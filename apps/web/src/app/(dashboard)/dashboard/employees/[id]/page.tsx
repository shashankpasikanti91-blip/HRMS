"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Mail, Phone, Building2, Calendar, MapPin, Briefcase } from "lucide-react";
import { employeeService, attendanceService } from "@/services/api-services";
import { useToast } from "@/hooks/use-toast";
import { getInitials, formatDate, formatCurrency } from "@/lib/utils";
import type { Employee } from "@/types";

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const emp = await employeeService.getById(params.id as string);
        setEmployee(emp);
      } catch {
        toast({ title: "Error", description: "Could not load employee details", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    if (params.id) load();
  }, [params.id, toast]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">Employee not found</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{employee.firstName} {employee.lastName}</h1>
          <p className="text-muted-foreground">{employee.employeeCode} &middot; {employee.position?.title || "No position"}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-xl">{getInitials(`${employee.firstName} ${employee.lastName}`)}</AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-lg font-semibold">{employee.firstName} {employee.lastName}</h2>
              <p className="text-sm text-muted-foreground">{employee.position?.title}</p>
              <Badge className="mt-2" variant={employee.status === "active" ? "success" : employee.status === "on_leave" ? "warning" : "secondary"}>
                {employee.status.replace("_", " ")}
              </Badge>
            </div>
            <Separator className="my-4" />
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{employee.email}</span>
              </div>
              {employee.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{employee.department?.name || "No department"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {formatDate(employee.dateOfJoining)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{employee.employmentType?.replace("_", " ") || "Full time"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="leave">Leave</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Employee Code</p>
                      <p className="font-medium">{employee.employeeCode}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gender</p>
                      <p className="font-medium">{employee.gender || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">{employee.dateOfBirth ? formatDate(employee.dateOfBirth) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Address</p>
                      <p className="font-medium">{employee.address || "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Employment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Department</p>
                      <p className="font-medium">{employee.department?.name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Position</p>
                      <p className="font-medium">{employee.position?.title || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Employment Type</p>
                      <p className="font-medium capitalize">{employee.employmentType?.replace("_", " ") || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Manager</p>
                      <p className="font-medium">{employee.managerId || "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Attendance</CardTitle>
                  <CardDescription>Last 30 days attendance record</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Attendance records will be displayed here when connected to the attendance service.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leave" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Leave History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Leave requests and balance will be displayed here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                  <CardDescription>Employee documents and certificates</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Document management will be available here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
