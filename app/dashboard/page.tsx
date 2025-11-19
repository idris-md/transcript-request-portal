"use client";

import React, { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Skeleton,
  Divider,
} from "@heroui/react";
import { StatusChip } from "@/components/StatusChip";
import { siteConfig } from "@/config/site";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Profile = {
  full_name: string;
  matric_no: string;
  department: string | null;
  school: string | null;
  level: string | null;
  entry_session: string | null;
};

type RequestItem = {
  id: number;
  scope: "WITHIN_NG" | "OUTSIDE_NG";
  status:
    | "DRAFT"
    | "PAYMENT_PENDING"
    | "PAID"
    | "SUBMITTED"
    | "PROCESSING"
    | "SENT"
    | "CANCELLED";
  created_at: string;
};

type PaymentItem = {
  reference: string;
  amount_kobo: number;
  status: "INITIATED" | "SUCCESS" | "FAILED";
  paid_at: string | null;
};

type VerifyResult = {
  ok: boolean;
  success: boolean;
  requestId?: number;
  error?: string;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function formatAmountKobo(kobo: number) {
  return `₦${(kobo / 100).toLocaleString()}`;
}

export default function DashboardPage() {
  const { mutate } = useSWRConfig();

  const {
    data: profile,
    isLoading: loadingProfile,
    error: profileError,
  } = useSWR<Profile>("/api/me/profile", fetcher);

  const {
    data: requests,
    isLoading: loadingRequests,
    error: reqError,
  } = useSWR<RequestItem[]>("/api/me/requests", fetcher);

  const {
    data: payments,
    isLoading: loadingPayments,
    error: payError,
  } = useSWR<PaymentItem[]>("/api/me/payments", fetcher);

  const [requeryRef, setRequeryRef] = useState<string | null>(null);
  const [requeryMessage, setRequeryMessage] = useState<string | null>(null);
  const [requeryError, setRequeryError] = useState<string | null>(null);

  async function handleRequery(reference: string) {
    setRequeryRef(reference);
    setRequeryMessage(null);
    setRequeryError(null);

    try {
      const res = await fetch(
        `/api/payments/verify?ref=${encodeURIComponent(reference)}`,
        { cache: "no-store" }
      );
      const json = (await res.json()) as VerifyResult;

      if (!res.ok) {
        setRequeryError(json.error || "Unable to re-check payment.");
      } else {
        if (json.success) {
          setRequeryMessage(
            "Payment verified successfully and request updated."
          );
        } else {
          setRequeryMessage(
            "Payment is still not confirmed as successful. You may try again later."
          );
        }
      }

      // Refresh payments and requests (in case status changed)
      mutate("/api/me/payments");
      mutate("/api/me/requests");
    } catch {
      setRequeryError("Network error while re-checking payment.");
    } finally {
      setRequeryRef(null);
    }
  }

  const firstName = profile?.full_name?.split(" ")?.[0] || "Student";

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6">
      {/* Top bar with logo + actions */}
      <header className="flex flex-col gap-4 border-b border-default-200 pb-4 md:flex-row md:items-center md:justify-between">
        {/* Logo + titles */}
        <div className="flex items-center gap-3">
          {/* University logo */}
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-default-100">
            <Image
              src="/logo.png" // put your logo file in /public/university-logo.png
              alt="University logo"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
            />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold leading-tight">
              {siteConfig.name}
            </h1>
            <p className="text-xs uppercase tracking-wide opacity-70">
              Transcript Request Portal
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="bordered"
            onPress={() => signOut({ callbackUrl: "/" })}
          >
            Logout
          </Button>
          <Button color="primary" size="sm">
            <Link href="/requests/new">New Transcript Request</Link>
          </Button>
        </div>
      </header>

      {/* Student profile summary */}
      <Card className="border border-default-200/60 shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Welcome, {loadingProfile ? "…" : firstName}
            </p>
            <p className="text-xs opacity-70">
              Below is your profile as captured in the transcript system.
            </p>
          </div>
          {profile && (
            <Chip size="sm" variant="flat">
              Matric: {profile.matric_no}
            </Chip>
          )}
        </CardHeader>
        <Divider />
        <CardBody>
          {profileError && (
            <p className="text-sm text-danger">
              Unable to load your profile. Please refresh.
            </p>
          )}

          {loadingProfile ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          ) : profile ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-60">
                  Name
                </p>
                <p className="text-sm">{profile.full_name}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-60">
                  Matric No
                </p>
                <p className="text-sm">{profile.matric_no}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-60">
                  Department
                </p>
                <p className="text-sm">{profile.department || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-60">
                  School / Faculty
                </p>
                <p className="text-sm">{profile.school || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-60">
                  Level
                </p>
                <p className="text-sm">{profile.level || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-60">
                  Entry Session
                </p>
                <p className="text-sm">{profile.entry_session || "—"}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm opacity-70">No profile information found.</p>
          )}
        </CardBody>
      </Card>

      {/* Requests card */}
      <Card className="border border-default-200/60 shadow-sm">
        <CardHeader className="flex items-center justify-between gap-2">
          <div>
            <p className="text-base font-medium">Your Transcript Requests</p>
            <p className="text-xs opacity-70">
              Each request shows its current status. Click &quot;Open&quot; to
              view full details, destination address, and timeline.
            </p>
          </div>
          <Chip size="sm" variant="flat">
            {requests?.length ?? 0} request
            {requests && requests.length === 1 ? "" : "s"}
          </Chip>
        </CardHeader>
        <CardBody>
          {reqError && (
            <p className="mb-2 text-sm text-danger">
              Failed to load requests. Please refresh the page.
            </p>
          )}

          {loadingRequests ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ) : (
            <Table aria-label="Transcript requests table">
              <TableHeader>
                <TableColumn>ID</TableColumn>
                <TableColumn>Scope</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Created</TableColumn>
                <TableColumn align="end">Actions</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent="You don't have any transcript requests yet."
                items={requests ?? []}
              >
                {(item) => (
                  <TableRow key={item.id}>
                    <TableCell>#{item.id}</TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {item.scope === "WITHIN_NG"
                          ? "Within Nigeria"
                          : "Outside Nigeria"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={item.status} />
                    </TableCell>
                    <TableCell>{formatDate(item.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="flat">
                        <Link href={`/requests/${item.id}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Payments card */}
      <Card className="border border-default-200/60 shadow-sm">
        <CardHeader className="flex items-center justify-between gap-2">
          <div>
            <p className="text-base font-medium">Payment History</p>
            <p className="text-xs opacity-70">
              All Paystack payments related to your transcript requests. You can
              re-check pending payments directly from here.
            </p>
          </div>
          <Chip size="sm" variant="flat">
            {payments?.length ?? 0} payment
            {payments && payments.length === 1 ? "" : "s"}
          </Chip>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-3">
          {payError && (
            <p className="text-sm text-danger">
              Failed to load payments. Please refresh the page.
            </p>
          )}

          {loadingPayments ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full rounded-md" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ) : (
            <Table aria-label="Payment history table">
              <TableHeader>
                <TableColumn>Reference</TableColumn>
                <TableColumn>Amount</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Paid At</TableColumn>
                <TableColumn align="end">Actions</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent="You have not made any transcript payments yet."
                items={payments ?? []}
              >
                {(p) => {
                  const isPending =
                    p.status === "INITIATED" || p.status === "FAILED";

                  return (
                    <TableRow key={p.reference}>
                      <TableCell>{p.reference}</TableCell>
                      <TableCell>{formatAmountKobo(p.amount_kobo)}</TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={
                            p.status === "SUCCESS"
                              ? "success"
                              : p.status === "FAILED"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {p.status}
                        </Chip>
                      </TableCell>
                      <TableCell>{formatDate(p.paid_at)}</TableCell>
                      <TableCell className="text-right">
                        {isPending && (
                          <Button
                            size="sm"
                            variant="bordered"
                            isDisabled={requeryRef === p.reference}
                            isLoading={requeryRef === p.reference}
                            onPress={() => handleRequery(p.reference)}
                          >
                            {requeryRef === p.reference
                              ? "Re-checking..."
                              : "Re-check"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                }}
              </TableBody>
            </Table>
          )}

          {(requeryMessage || requeryError) && (
            <div className="rounded-md border border-default-200 bg-default-50 px-3 py-2 text-xs">
              {requeryMessage && (
                <p className="text-success">{requeryMessage}</p>
              )}
              {requeryError && <p className="text-danger">{requeryError}</p>}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
