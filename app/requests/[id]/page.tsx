"use client";

import useSWR from "swr";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Skeleton,
  Divider,
} from "@heroui/react";
import { StatusChip, TranscriptStatus } from "@/components/StatusChip";
import { RequestTimeline, RequestEvent } from "@/components/RequestTimeline";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type RequestDetails = {
  id: number;
  scope: "WITHIN_NG" | "OUTSIDE_NG";
  status: TranscriptStatus;
  request_email: string;
  created_at: string;
};

type Destination = {
  id: number;
  institution_name: string;
  country: string;
  address_line1: string;
  address_line2?: string | null;
  city?: string | null;
  state_region?: string | null;
  postal_code?: string | null;
  email_recipient?: string | null;
  created_at: string;
};

export default function RequestPage() {
  const params = useParams();
  const idParam = params?.id;
  const id = Number(idParam);

  const {
    data: request,
    isLoading: loadingRequest,
    error: requestError,
  } = useSWR<RequestDetails>(
    Number.isFinite(id) ? `/api/requests/${id}` : null,
    fetcher
  );

  const {
    data: events,
    isLoading: loadingEvents,
    error: eventsError,
  } = useSWR<RequestEvent[]>(
    Number.isFinite(id) ? `/api/requests/${id}/events` : null,
    fetcher
  );

  const {
    data: destination,
    isLoading: loadingDestination,
    error: destinationError,
  } = useSWR<Destination | null>(
    Number.isFinite(id) ? `/api/requests/${id}/destination` : null,
    fetcher
  );

  const isPaid = request?.status === "PAID";

  if (!Number.isFinite(id)) {
    return (
      <div className="mx-auto max-w-xl px-4 py-6">
        <p className="text-sm text-danger">Invalid request ID in the URL.</p>
        <Button
          size="sm"
          variant="light"
          className="mt-3"
        >
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      {/* Breadcrumb / top nav */}
      <div className="flex items-center justify-between gap-2">
        <Button
          size="sm"
          variant="light"
        >
          <Link href="/dashboard">← Back to dashboard</Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-default-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">
            Transcript Request #{idParam}
          </h1>
          <p className="text-sm opacity-75">
            See where this transcript is going and track its progress.
          </p>
          {request && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Chip size="sm" variant="flat">
                {request.scope === "WITHIN_NG"
                  ? "Within Nigeria"
                  : "Outside Nigeria"}
              </Chip>
              <Chip size="sm" variant="flat">
                Created: {new Date(request.created_at).toLocaleString()}
              </Chip>
            </div>
          )}
        </div>
        {request && (
          <div className="flex items-center gap-2">
            <StatusChip status={request.status} />
          </div>
        )}
      </div>

      {/* Main request details */}
      <Card className="border border-default-200/60 shadow-sm">
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-medium">Request details</p>
            <p className="text-xs opacity-70">
              Core information about this transcript request.
            </p>
          </div>
          {isPaid && (
            <Chip size="sm" color="success" variant="flat">
              Payment confirmed
            </Chip>
          )}
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
          {loadingRequest && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <Skeleton className="h-4 w-1/3 rounded-md" />
              <Skeleton className="h-4 w-2/3 rounded-md" />
            </div>
          )}

          {requestError && (
            <p className="text-sm text-danger">
              Unable to load this request. It may not exist or you may not have
              access to it.
            </p>
          )}

          {request && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                    Scope
                  </p>
                  <Chip size="sm" variant="flat">
                    {request.scope === "WITHIN_NG"
                      ? "Within Nigeria"
                      : "Outside Nigeria"}
                  </Chip>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                    Request email
                  </p>
                  <p className="text-sm">{request.request_email}</p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                    Created at
                  </p>
                  <p className="text-sm">
                    {new Date(request.created_at).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                    Current status
                  </p>
                  <StatusChip status={request.status} />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-3">
                {isPaid && (
                  <Button
                    color="primary"
                    variant="flat"
                    size="sm"
                  >
                    <Link href={`/requests/${request.id}/destination`}>
                      Add / edit destination details
                    </Link>
                  </Button>
                )}
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Destination section */}
      <Card className="border border-default-200/60 shadow-sm">
        <CardHeader className="flex items-center justify-between gap-2">
          <div>
            <p className="text-base font-medium">Destination address</p>
            <p className="text-xs opacity-70">
              The institution and address where this transcript will be sent.
            </p>
          </div>
          {request && (
            <Chip size="sm" variant="flat">
              {request.scope === "WITHIN_NG"
                ? "Within Nigeria"
                : "Outside Nigeria"}
            </Chip>
          )}
        </CardHeader>
        <Divider />
        <CardBody className="space-y-3">
          {loadingDestination && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-2/3 rounded-md" />
            </div>
          )}

          {destinationError && (
            <p className="text-sm text-danger">
              Unable to load destination details.
            </p>
          )}

          {!loadingDestination && !destination && (
            <p className="text-sm opacity-75">
              No destination has been provided yet.{" "}
              {request?.status === "PAID" && (
                <>
                  Once payment is confirmed, click{" "}
                  <span className="font-medium">
                    &quot;Add / edit destination details&quot;
                  </span>{" "}
                  in the request details above to enter where this transcript
                  should be sent.
                </>
              )}
            </p>
          )}

          {destination && (
            <>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                  Institution
                </p>
                <p className="text-sm font-medium">
                  {destination.institution_name}
                </p>
              </div>

              <Divider className="my-1" />

              <div className="space-y-1 text-sm">
                <p>{destination.address_line1}</p>
                {destination.address_line2 && (
                  <p>{destination.address_line2}</p>
                )}
                {(destination.city || destination.state_region) && (
                  <p>
                    {destination.city && <span>{destination.city}</span>}
                    {destination.city && destination.state_region && ", "}
                    {destination.state_region && (
                      <span>{destination.state_region}</span>
                    )}
                  </p>
                )}
                <p>
                  {destination.postal_code && (
                    <>
                      {destination.postal_code},{" "}
                    </>
                  )}
                  {destination.country}
                </p>
              </div>

              {destination.email_recipient && (
                <div className="pt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                    Recipient email
                  </p>
                  <p className="text-sm">{destination.email_recipient}</p>
                </div>
              )}

              <p className="pt-1 text-[11px] opacity-60">
                Last updated:{" "}
                {new Date(destination.created_at).toLocaleString()}
              </p>
            </>
          )}
        </CardBody>
      </Card>

      {/* Timeline */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Progress</p>
          <p className="text-[11px] opacity-60">
            Shows how this request has moved from payment to dispatch.
          </p>
        </div>
        {loadingEvents ? (
          <Card className="border border-default-200/60 shadow-sm">
            <CardBody className="space-y-2">
              <Skeleton className="h-3 w-1/3 rounded-md" />
              <Skeleton className="h-3 w-2/3 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
            </CardBody>
          </Card>
        ) : eventsError ? (
          <p className="text-sm text-danger">
            Unable to load timeline for this request.
          </p>
        ) : (
          <RequestTimeline events={events ?? []} />
        )}
      </section>
    </div>
  );
}
