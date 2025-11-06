"use client";

import { Card, CardBody } from "@heroui/react";

export type RequestEvent = {
  status: string;
  note?: string | null;
  created_at: string;
};

export function RequestTimeline({ events }: { events: RequestEvent[] }) {
  if (!events.length) {
    return (
      <Card className="border border-default-200/60 shadow-sm">
        <CardBody>
          <p className="text-sm opacity-70">
            No status updates have been recorded for this request yet.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="border border-default-200/60 shadow-sm">
      <CardBody className="space-y-4">
        <p className="text-sm font-medium">Status timeline</p>
        <ol className="relative border-s ps-6">
          {events.map((e, i) => (
            <li key={i} className="mb-6 ms-4">
              <div className="absolute -start-1.5 mt-1.5 h-3 w-3 rounded-full bg-foreground" />
              <time className="mb-1 block text-xs opacity-70">
                {new Date(e.created_at).toLocaleString()}
              </time>
              <p className="text-sm font-semibold">{e.status}</p>
              {e.note && (
                <p className="text-xs opacity-80 mt-1">{e.note}</p>
              )}
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  );
}
