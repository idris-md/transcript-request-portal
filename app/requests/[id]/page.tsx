"use client";

import useSWR from "swr";
import { useParams } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Skeleton,
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

  const isPaid = request?.status === "PAID";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Transcript Request #{idParam}
          </h1>
          <p className="text-sm opacity-75">
            View the details and current status of this transcript request.
          </p>
        </div>
        {request && <StatusChip status={request.status} />}
      </div>

      {/* Main details card */}
      <Card className="border border-default-200/60 shadow-sm">
        <CardHeader className="flex flex-col gap-1">
          <p className="text-base font-medium">Request details</p>
        </CardHeader>
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
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    Scope
                  </p>
                  <Chip size="sm" variant="flat">
                    {request.scope === "WITHIN_NG"
                      ? "Within Nigeria"
                      : "Outside Nigeria"}
                  </Chip>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    Request email
                  </p>
                  <p className="text-sm">{request.request_email}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    Created at
                  </p>
                  <p className="text-sm">
                    {new Date(request.created_at).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    Current status
                  </p>
                  <StatusChip status={request.status} />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                {/* When payment is successful but destination not yet added */}
                {isPaid && (
                  <Button
                    asChild
                    color="primary"
                    variant="flat"
                    size="sm"
                  >
                    <a href={`/requests/${request.id}/destination`}>
                      Add / edit destination details
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Timeline */}
      <section className="space-y-3">
        <p className="text-sm font-medium">Progress</p>
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
