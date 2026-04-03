"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Users } from "lucide-react";
import api from "@/lib/api";
import type { Department } from "@/types";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get("/core-hr/departments");
        setDepartments(data.data || []);
      } catch {
        setDepartments([
          { id: "1", name: "Engineering", code: "ENG", description: "Software development and engineering", _count: { employees: 82 } },
          { id: "2", name: "Marketing", code: "MKT", description: "Brand, growth, and content marketing", _count: { employees: 28 } },
          { id: "3", name: "Human Resources", code: "HR", description: "People operations and culture", _count: { employees: 22 } },
          { id: "4", name: "Sales", code: "SALES", description: "Revenue generation and client relations", _count: { employees: 45 } },
          { id: "5", name: "Finance", code: "FIN", description: "Financial planning and accounting", _count: { employees: 18 } },
          { id: "6", name: "Operations", code: "OPS", description: "Business operations and logistics", _count: { employees: 53 } },
        ]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">Organizational structure and department management</p>
        </div>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Department</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <Card key={dept.id} className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">{dept.name}</CardTitle>
                <CardDescription>{dept.description || dept.code}</CardDescription>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {dept._count?.employees || 0} employees
                </span>
              </div>
              <Badge variant="outline" className="mt-3">{dept.code}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
