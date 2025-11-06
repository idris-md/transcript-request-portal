"use client";

import useSWR from "swr";
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
} from "@heroui/react";
import { StatusChip } from "@/components/StatusChip";
// import { StatusChip } from "@/components/StatusChip"; // from earlier

const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

export default function DashboardPage() {
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Transcript Dashboard</h1>
          <p className="text-sm opacity-75">
            View your transcript requests, track their status, and see your payment
            history.
          </p>
        </div>
        <Button  color="primary">
          <a href="/requests/new">New Transcript Request</a>
        </Button>
      </header>

      {/* Requests card */}
      <Card className="border border-default-200/60 shadow-sm">
        <CardHeader className="flex items-center justify-between gap-2">
          <div>
            <p className="text-base font-medium">Your Transcript Requests</p>
            <p className="text-xs opacity-70">
              Each request shows its current status. Click &quot;Open&quot; for
              more details and timeline.
            </p>
          </div>
        </CardHeader>
        <CardBody>
          {reqError && (
            <p className="text-sm text-danger">
              Failed to load requests. Please refresh the page.
            </p>
          )}

          {loadingRequests ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          ) : (
            <Table aria-label="Transcript requests table">
              <TableHeader>
                <TableColumn>ID</TableColumn>
                <TableColumn>Scope</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Created</TableColumn>
                <TableColumn>-</TableColumn>
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
                    <TableCell>
                      {new Date(item.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button  size="sm" variant="flat">
                        <a href={`/requests/${item.id}`}>Open</a>
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
        <CardHeader>
          <div>
            <p className="text-base font-medium">Payment History</p>
            <p className="text-xs opacity-70">
              All payments made through Paystack for transcript requests.
            </p>
          </div>
        </CardHeader>
        <CardBody>
          {payError && (
            <p className="text-sm text-danger">
              Failed to load payments. Please refresh the page.
            </p>
          )}

          {loadingPayments ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          ) : (
            <Table aria-label="Payment history table">
              <TableHeader>
                <TableColumn>Reference</TableColumn>
                <TableColumn>Amount</TableColumn>
                <TableColumn>Status</TableColumn>
                <TableColumn>Paid At</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent="You have not made any transcript payments yet."
                items={payments ?? []}
              >
                {(p) => (
                  <TableRow key={p.reference}>
                    <TableCell>{p.reference}</TableCell>
                    <TableCell>
                      ₦{(p.amount_kobo / 100).toLocaleString()}
                    </TableCell>
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
                    <TableCell>
                      {p.paid_at
                        ? new Date(p.paid_at).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
