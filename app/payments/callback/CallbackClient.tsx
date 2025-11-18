// app/payments/callback/CallbackClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
  Chip,
  Spinner,
} from "@heroui/react";

type VerifyResult = {
  ok: boolean;
  success: boolean;
  requestId?: number;
  error?: string;
};

export default function CallbackClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<
    "loading" | "success" | "failed" | "error"
  >("loading");
  const [message, setMessage] = useState<string>(
    "Verifying your payment. Please wait..."
  );
  const [requestId, setRequestId] = useState<number | null>(null);

  useEffect(() => {
    async function verify() {
      const reference =
        searchParams.get("reference") || searchParams.get("trxref");

      if (!reference) {
        setStatus("error");
        setMessage("No payment reference was provided in the callback URL.");
        return;
      }

      try {
        const res = await fetch(
          `/api/payments/verify?ref=${encodeURIComponent(reference)}`,
          { cache: "no-store" }
        );
        const json = (await res.json()) as VerifyResult;

        if (!res.ok) {
          setStatus("error");
          setMessage(
            json.error ||
              "We could not verify this payment. Please try re-checking from your dashboard."
          );
          return;
        }

        if (json.success) {
          setStatus("success");
          setMessage(
            "Payment verified successfully. Your transcript request has been updated."
          );
          if (json.requestId) setRequestId(json.requestId);
        } else {
          setStatus("failed");
          setMessage(
            "Payment is not confirmed as successful. You may re-check from your dashboard later."
          );
        }
      } catch {
        setStatus("error");
        setMessage(
          "Network error while verifying payment. You can re-check from your dashboard."
        );
      }
    }

    verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = status === "loading";

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border border-default-200/60 shadow-sm">
        <CardHeader className="flex flex-col gap-1">
          <p className="text-base font-semibold">Payment Verification</p>
          <p className="text-xs opacity-70">
            This page confirms the status of your Paystack payment and updates
            your transcript request.
          </p>
        </CardHeader>

        <CardBody className="space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <Spinner size="lg" />
              <p className="text-sm opacity-80">{message}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Chip
                size="sm"
                variant="flat"
                color={
                  status === "success"
                    ? "success"
                    : status === "failed"
                    ? "warning"
                    : "danger"
                }
              >
                {status === "success"
                  ? "Payment successful"
                  : status === "failed"
                  ? "Payment not confirmed"
                  : "Verification error"}
              </Chip>
              <p className="text-sm">{message}</p>

              {requestId && (
                <p className="text-xs opacity-70">
                  Updated request ID:{" "}
                  <span className="font-semibold">#{requestId}</span>
                </p>
              )}
            </div>
          )}
        </CardBody>

        <CardFooter className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {requestId && (
              <Button
                size="sm"
                variant="flat"
                color="primary"
                onPress={() => router.push(`/requests/${requestId}`)}
              >
                View this request
              </Button>
            )}
            <Button
              size="sm"
              variant="bordered"
              onPress={() => router.push("/dashboard")}
            >
              Go to dashboard
            </Button>
          </div>
          {!isLoading && (
            <p className="text-[11px] opacity-60">
              If this status does not match your Paystack receipt, you can
              re-check the payment from the dashboard payment history.
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
