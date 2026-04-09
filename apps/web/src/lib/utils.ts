import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric", month: "short", day: "numeric",
    }).format(new Date(date));
  } catch {
    return String(date);
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(date));
  } catch {
    return String(date);
  }
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(date));
  } catch {
    return String(date);
  }
}

export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

/** Returns a human-readable status label from a snake_case status string. */
export function statusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Maps a status string to a Tailwind color class for badges. */
export function statusColor(status: string | null | undefined): string {
  if (!status) return "bg-gray-100 text-gray-700";
  const s = status.toLowerCase();
  if (["active", "present", "approved", "hired", "open", "completed"].includes(s))
    return "bg-green-100 text-green-700";
  if (["inactive", "absent", "rejected", "closed", "terminated"].includes(s))
    return "bg-red-100 text-red-700";
  if (["pending", "probation", "screening", "draft", "on_hold"].includes(s))
    return "bg-yellow-100 text-yellow-700";
  if (["late", "shortlisted", "interview", "processing"].includes(s))
    return "bg-blue-100 text-blue-700";
  if (["on_leave", "offer"].includes(s))
    return "bg-purple-100 text-purple-700";
  return "bg-gray-100 text-gray-700";
}

