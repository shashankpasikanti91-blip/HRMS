"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Mail, Phone, Building2, Calendar, MapPin, Briefcase, UploadCloud, FileText, Trash2, Download, Loader2, Clock3, Camera } from "lucide-react";
import { employeeService, attendanceService, leaveService, documentService } from "@/services/api-services";
import { useAuthStore } from "@/store/auth-store";
import { useToast } from "@/hooks/use-toast";
import { getInitials, formatDate } from "@/lib/utils";
import type { AttendanceRecord, Document, Employee, LeaveRequest } from "@/types";

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const employeeId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { toast } = useToast();
  const { user: authUser } = useAuthStore();
  const canManage = ["super_admin", "company_admin", "hr_manager"].includes(authUser?.role || "");
  const [activeTab, setActiveTab] = useState<string>(() => searchParams?.get("tab") || "overview");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequest[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [documentType, setDocumentType] = useState("contract");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadEmployeeData = useCallback(async () => {
    if (!employeeId) return;

    setLoading(true);
    try {
      const emp = await employeeService.getById(employeeId);
      setEmployee(emp);

      const [attendanceRes, leaveRes, docsRes] = await Promise.allSettled([
        attendanceService.getByEmployee(emp.business_id, { page_size: 10 }),
        leaveService.getByEmployee(emp.id),
        documentService.list({ employee_id: emp.id, page_size: 20 }),
      ]);

      setAttendanceHistory(attendanceRes.status === "fulfilled" ? attendanceRes.value.data ?? [] : []);
      setLeaveHistory(leaveRes.status === "fulfilled" ? leaveRes.value : []);
      setDocuments(docsRes.status === "fulfilled" ? docsRes.value.data ?? [] : []);
    } catch {
      toast({ title: "Error", description: "Could not load employee details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [employeeId, toast]);

  useEffect(() => {
    loadEmployeeData();
  }, [loadEmployeeData]);

  function onPickFile(file: File | null) {
    setSelectedFile(file);
    if (file && !uploadTitle) {
      setUploadTitle(file.name.replace(/\.[^.]+$/, ""));
    }
  }

  async function handleUpload() {
    if (!employee || !selectedFile) {
      toast({ title: "Missing file", description: "Choose a file to upload first.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("employee_id", employee.id);
      formData.append("document_type", documentType);
      formData.append("title", uploadTitle || selectedFile.name);

      const uploaded = await documentService.upload(formData);
      setDocuments((prev) => [uploaded, ...prev]);
      setSelectedFile(null);
      setUploadTitle("");
      toast({ title: "Uploaded", description: "Document uploaded successfully.", variant: "success" });
    } catch {
      toast({ title: "Upload failed", description: "Could not upload the document.", variant: "destructive" });
    } finally {
      setUploading(false);
      setDragActive(false);
    }
  }

  async function handleDeleteDocument(businessId: string) {
    try {
      await documentService.delete(businessId);
      setDocuments((prev) => prev.filter((doc) => doc.business_id !== businessId));
      toast({ title: "Deleted", description: "Document removed successfully.", variant: "success" });
    } catch {
      toast({ title: "Delete failed", description: "Could not remove the document.", variant: "destructive" });
    }
  }

  async function handlePhotoUpload(file: File) {
    if (!employee) return;
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file", description: "Please upload JPG, PNG, WEBP, or GIF images", variant: "destructive" });
      return;
    }
    setUploadingPhoto(true);
    try {
      const updated = await employeeService.uploadPhoto(employee.business_id, file);
      setEmployee((prev) => prev ? { ...prev, profile_photo_url: updated.profile_photo_url } : prev);
      toast({ title: "Photo Updated", description: "Profile photo uploaded successfully", variant: "success" });
    } catch {
      toast({ title: "Upload Failed", description: "Could not upload profile photo", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  }

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
          <h1 className="text-3xl font-bold tracking-tight">{employee.full_name}</h1>
          <p className="text-muted-foreground">{employee.employee_code} &middot; {employee.designation || "No position"}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  {employee.profile_photo_url && (
                    <AvatarImage src={employee.profile_photo_url} alt={employee.full_name} />
                  )}
                  <AvatarFallback className="text-xl">{getInitials(employee.full_name)}</AvatarFallback>
                </Avatar>
                {canManage && (
                <button
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </button>
                )}
                {canManage && (
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handlePhotoUpload(e.target.files[0]);
                  }}
                />
                )}
              </div>
              <h2 className="mt-4 text-lg font-semibold">{employee.full_name}</h2>
              <p className="text-sm text-muted-foreground">{employee.designation || "Employee"}</p>
              <Badge className="mt-2" variant={employee.employment_status === "active" ? "success" : employee.employment_status === "on_leave" ? "warning" : "secondary"}>
                {employee.employment_status.replace("_", " ")}
              </Badge>
            </div>
            <Separator className="my-4" />
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{employee.work_email}</span>
              </div>
              {employee.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{employee.department_name || "No department"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {formatDate(employee.joining_date)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{employee.employment_type?.replace("_", " ") || "Full time"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{employee.branch_name || employee.location || "Location not added"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                      <p className="font-medium">{employee.employee_code}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gender</p>
                      <p className="font-medium">{employee.gender || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">{employee.date_of_birth ? formatDate(employee.date_of_birth) : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Manager</p>
                      <p className="font-medium">{employee.manager_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Nationality</p>
                      <p className="font-medium">{employee.nationality || "—"}</p>
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
                      <p className="font-medium">{employee.department_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Position</p>
                      <p className="font-medium">{employee.designation || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Employment Type</p>
                      <p className="font-medium capitalize">{employee.employment_type?.replace("_", " ") || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Work Mode</p>
                      <p className="font-medium">{employee.work_mode?.replace("_", " ") || "Hybrid"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Visa / Immigration */}
              <Card>
                <CardHeader>
                  <CardTitle>Visa & Immigration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Visa Status</p>
                      <p className="font-medium">
                        {employee.visa_status ? (
                          <Badge variant={
                            employee.visa_status === "valid" ? "success" :
                            employee.visa_status === "expired" ? "destructive" :
                            employee.visa_status === "pending" ? "warning" : "secondary"
                          }>
                            {employee.visa_status}
                          </Badge>
                        ) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Visa Type</p>
                      <p className="font-medium">{employee.visa_type || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Visa Expiry</p>
                      <p className="font-medium">
                        {employee.visa_expiry_date ? (
                          <>
                            {formatDate(employee.visa_expiry_date)}
                            {new Date(employee.visa_expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && (
                              <Badge className="ml-2" variant="destructive">Expiring Soon</Badge>
                            )}
                          </>
                        ) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Passport Number</p>
                      <p className="font-medium">{employee.passport_number || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Passport Expiry</p>
                      <p className="font-medium">
                        {employee.passport_expiry_date ? (
                          <>
                            {formatDate(employee.passport_expiry_date)}
                            {new Date(employee.passport_expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) && (
                              <Badge className="ml-2" variant="destructive">Expiring Soon</Badge>
                            )}
                          </>
                        ) : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Address */}
              <Card>
                <CardHeader>
                  <CardTitle>Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Address Line 1</p>
                      <p className="font-medium">{employee.address_line_1 || "—"}</p>
                    </div>
                    {employee.address_line_2 && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Address Line 2</p>
                        <p className="font-medium">{employee.address_line_2}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">City</p>
                      <p className="font-medium">{employee.city || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">State</p>
                      <p className="font-medium">{employee.state || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Country</p>
                      <p className="font-medium">{employee.country || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Postal Code</p>
                      <p className="font-medium">{employee.postal_code || "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Bank Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Bank Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Bank Name</p>
                      <p className="font-medium">{employee.bank_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Account Number</p>
                      <p className="font-medium">{employee.bank_account_number ? `••••${employee.bank_account_number.slice(-4)}` : "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">IFSC Code</p>
                      <p className="font-medium">{employee.bank_ifsc_code || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Branch</p>
                      <p className="font-medium">{employee.bank_branch || "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Attendance</CardTitle>
                  <CardDescription>Latest check-ins, working hours, and statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  {attendanceHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-3 text-left text-sm font-medium">Date</th>
                            <th className="p-3 text-left text-sm font-medium">Clock In</th>
                            <th className="p-3 text-left text-sm font-medium">Clock Out</th>
                            <th className="p-3 text-left text-sm font-medium">Hours</th>
                            <th className="p-3 text-left text-sm font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendanceHistory.map((record) => (
                            <tr key={record.id} className="border-b last:border-0">
                              <td className="p-3 text-sm">{formatDate(record.attendance_date)}</td>
                              <td className="p-3 text-sm">{record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : "—"}</td>
                              <td className="p-3 text-sm">{record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : "—"}</td>
                              <td className="p-3 text-sm">{record.total_hours ? `${record.total_hours.toFixed(1)}h` : "—"}</td>
                              <td className="p-3 text-sm"><Badge variant="secondary">{record.status.replace("_", " ")}</Badge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground">
                      <Clock3 className="mx-auto mb-2 h-8 w-8" />
                      <p>No attendance history found for this employee.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leave" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Leave History</CardTitle>
                  <CardDescription>Recent requests and approval status</CardDescription>
                </CardHeader>
                <CardContent>
                  {leaveHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-3 text-left text-sm font-medium">Type</th>
                            <th className="p-3 text-left text-sm font-medium">Duration</th>
                            <th className="p-3 text-left text-sm font-medium">Days</th>
                            <th className="p-3 text-left text-sm font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaveHistory.map((leave) => (
                            <tr key={leave.id} className="border-b last:border-0">
                              <td className="p-3 text-sm">{leave.leave_type}</td>
                              <td className="p-3 text-sm">{formatDate(leave.start_date)} - {formatDate(leave.end_date)}</td>
                              <td className="p-3 text-sm">{leave.total_days || "—"}</td>
                              <td className="p-3 text-sm"><Badge variant="secondary">{leave.status}</Badge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">No leave history found.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-4 space-y-4">
              {canManage && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload Documents</CardTitle>
                  <CardDescription>Drag and drop employee files or select them manually</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragActive(true);
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                      onPickFile(e.dataTransfer.files?.[0] ?? null);
                    }}
                    className={`rounded-xl border-2 border-dashed p-6 text-center transition ${dragActive ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <UploadCloud className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">Drop a file here or browse from your device</p>
                    <p className="mt-1 text-xs text-muted-foreground">Contracts, IDs, certificates, and onboarding documents are supported.</p>
                    <Input
                      type="file"
                      className="mt-4"
                      onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Document title</Label>
                      <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Employment contract" />
                    </div>
                    <div className="space-y-2">
                      <Label>Document type</Label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="id_proof">ID Proof</SelectItem>
                          <SelectItem value="certificate">Certificate</SelectItem>
                          <SelectItem value="policy_acknowledgement">Policy Acknowledgement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{selectedFile?.name || "No file selected yet"}</p>
                      {selectedFile && <p className="text-xs text-muted-foreground">{Math.round(selectedFile.size / 1024)} KB</p>}
                    </div>
                    <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
                      {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Upload
                    </Button>
                  </div>
                </CardContent>
              </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Document Library</CardTitle>
                  <CardDescription>Files mapped to this employee profile</CardDescription>
                </CardHeader>
                <CardContent>
                  {documents.length > 0 ? (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <div className="rounded-md bg-primary/10 p-2">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground">{doc.document_type || "General"} • {doc.verification_status || "pending"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => window.open(doc.file_url, "_blank", "noopener,noreferrer")}>
                              <Download className="h-4 w-4" />
                            </Button>
                            {canManage && (
                            <Button variant="outline" size="icon" onClick={() => handleDeleteDocument(doc.business_id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">No documents uploaded yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
