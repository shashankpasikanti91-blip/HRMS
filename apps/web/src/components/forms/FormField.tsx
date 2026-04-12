"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type {
  FieldValues,
  UseFormRegister,
  FieldError,
  Path,
  Control,
  Controller,
} from "react-hook-form";
import { Controller as RHFController } from "react-hook-form";

/* -------------------------------------------------------------------------- */
/*  FormField – Reusable form field with label, error, and various input types */
/* -------------------------------------------------------------------------- */

interface BaseFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  register?: UseFormRegister<T>;
  control?: Control<T>;
  error?: FieldError;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  description?: string;
}

/* --- Text / Email / Phone / Number / Password / Date --- */

interface InputFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  type?: "text" | "email" | "password" | "number" | "tel" | "date" | "time" | "url";
  placeholder?: string;
}

export function FormInput<T extends FieldValues>({
  name,
  label,
  register,
  error,
  type = "text",
  placeholder,
  required,
  className,
  disabled,
  description,
}: InputFieldProps<T>) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder ?? label}
        disabled={disabled}
        {...(register ? register(name, { required: required ? `${label} is required` : false }) : {})}
      />
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}

/* --- Textarea --- */

interface TextareaFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  placeholder?: string;
  rows?: number;
}

export function FormTextarea<T extends FieldValues>({
  name,
  label,
  register,
  error,
  placeholder,
  rows = 3,
  required,
  className,
  disabled,
}: TextareaFieldProps<T>) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Textarea
        id={name}
        placeholder={placeholder ?? label}
        rows={rows}
        disabled={disabled}
        {...(register ? register(name) : {})}
      />
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}

/* --- Select --- */

interface SelectFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function FormSelect<T extends FieldValues>({
  name,
  label,
  control,
  error,
  options,
  placeholder,
  required,
  className,
  disabled,
}: SelectFieldProps<T>) {
  if (!control) return null;
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <RHFController
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            disabled={disabled}
            value={field.value as string}
            onValueChange={field.onChange}
          >
            <SelectTrigger id={name}>
              <SelectValue placeholder={placeholder ?? `Select ${label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}

/* --- Switch --- */

interface SwitchFieldProps<T extends FieldValues> extends BaseFieldProps<T> {}

export function FormSwitch<T extends FieldValues>({
  name,
  label,
  control,
  error,
  className,
  disabled,
  description,
}: SwitchFieldProps<T>) {
  if (!control) return null;
  return (
    <div className={cn("flex items-center justify-between rounded-lg border p-3", className)}>
      <div className="space-y-0.5">
        <Label htmlFor={name} className="text-sm font-medium">
          {label}
        </Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <RHFController
        name={name}
        control={control}
        render={({ field }) => (
          <Switch
            id={name}
            checked={field.value as boolean}
            onCheckedChange={field.onChange}
            disabled={disabled}
          />
        )}
      />
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}
