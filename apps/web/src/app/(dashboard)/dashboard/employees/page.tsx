"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, Download, Upload } from "lucide-react";
import api from "@/lib/api";
import { getInitials, formatDate } from "@/lib/utils";
import type { Employee } from "@/types";

const statusColors: Record<string, "success" | "warning" | "destructive" | "secondary" | "default"> = {
  active: "success",
  inactive: "secondary",
  on_leave: "warning",
  terminated: "destructive",
  probation: "default",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get("/core-hr/employees");
        setEmployees(data.data || []);
      } catch {
        // Demo data
        setEmployees([
          { id: "1", employeeCode: "EMP001", firstName: "Arjun", lastName: "Patel", email: "arjun@srp.com", departmentId: "1", department: { id: "1", name: "Engineering", code: "ENG" }, positionId: "1", position: { id: "1", title: "Senior Developer", code: "SR-DEV", departmentId: "1" }, dateOfJoining: "2023-01-15", status: "active", employmentType: "full_time" },
          { id: "2", employeeCode: "EMP002", firstName: "Priya", lastName: "Sharma", email: "priya@srp.com", departmentId: "2", department: { id: "2", name: "Marketing", code: "MKT" }, positionId: "2", position: { id: "2", title: "Marketing Manager", code: "MKT-MGR", departmentId: "2" }, dateOfJoining: "2023-03-20", status: "active", employmentType: "full_time" },
          { id: "3", employeeCode: "EMP003", firstName: "Rahul", lastName: "Kumar", email: "rahul@srp.com", departmentId: "1", department: { id: "1", name: "Engineering", code: "ENG" }, positionId: "3", position: { id: "3", title: "DevOps Engineer", code: "DEVOPS", departmentId: "1" }, dateOfJoining: "2023-06-01", status: "on_leave", employmentType: "full_time" },
          { id: "4", employeeCode: "EMP004", firstName: "Sneha", lastName: "Gupta", email: "sneha@srp.com", departmentId: "3", department: { id: "3", name: "HR", code: "HR" }, positionId: "4", position: { id: "4", title: "HR Business Partner", code: "HRBP", departmentId: "3" }, dateOfJoining: "2022-11-10", status: "active", employmentType: "full_time" },
          { id: "5", employeeCode: "EMP005", firstName: "Vikram", lastName: "Singh", email: "vikram@srp.com", departmentId: "4", department: { id: "4", name: "Sales", code: "SALES" }, positionId: "5", position: { id: "5", title: "Sales Executive", code: "SALES-EXE", departmentId: "4" }, dateOfJoining: "2024-01-08", status: "probation", employmentType: "full_time" },
        ]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = employees.filter(
    (e) =>
      `${e.firstName} ${e.lastName} ${e.employeeCode} ${e.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Manage your organization&apos;s workforce</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Upload className="mr-2 h-4 w-4" />Import</Button>
          <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>
          <Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Employee</Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search employees..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" />Filter</Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({employees.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({employees.filter((e) => e.status === "active").length})</TabsTrigger>
          <TabsTrigger value="on_leave">On Leave ({employees.filter((e) => e.status === "on_leave").length})</TabsTrigger>
          <TabsTrigger value="probation">Probation ({employees.filter((e) => e.status === "probation").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-4 text-left text-sm font-medium">Employee</th>
                      <th className="p-4 text-left text-sm font-medium">Department</th>
                      <th className="p-4 text-left text-sm font-medium">Position</th>
                      <th className="p-4 text-left text-sm font-medium">Joined</th>
                      <th className="p-4 text-left text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((emp) => (
                      <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="text-xs">{getInitials(`${emp.firstName} ${emp.lastName}`)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{emp.firstName} {emp.lastName}</p>
                              <p className="text-xs text-muted-foreground">{emp.employeeCode} &middot; {emp.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm">{emp.department?.name || "—"}</td>
                        <td className="p-4 text-sm">{emp.position?.title || "—"}</td>
                        <td className="p-4 text-sm text-muted-foreground">{formatDate(emp.dateOfJoining)}</td>
                        <td className="p-4">
                          <Badge variant={statusColors[emp.status] || "secondary"}>
                            {emp.status.replace("_", " ")}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">No employees found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
