"use client";

import { Chip } from "@heroui/react";

export type TranscriptStatus =
  | "DRAFT"
  | "PAYMENT_PENDING"
  | "PAID"
  | "SUBMITTED"
  | "PROCESSING"
  | "SENT"
  | "CANCELLED";

export function StatusChip({ status }: { status: TranscriptStatus }) {
  const map: Record<
    TranscriptStatus,
    {
      color: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
      label: string;
    }
  > = {
    DRAFT: { color: "default", label: "Draft" },
    PAYMENT_PENDING: { color: "warning", label: "Payment Pending" },
    PAID: { color: "success", label: "Paid" },
    SUBMITTED: { color: "secondary", label: "Submitted" },
    PROCESSING: { color: "primary", label: "Processing" },
    SENT: { color: "success", label: "Sent" },
    CANCELLED: { color: "danger", label: "Cancelled" },
  };

  const { color, label } = map[status];

  return (
    <Chip size="sm" variant="flat" color={color}>
      {label}
    </Chip>
  );
}
