"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Spinner,
  Chip,
} from "@heroui/react";

type VerifyResult = {
  ok: boolean;
  success: boolean;
  requestId?: number;
  error?: string;
};

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ref = searchParams.get("ref");

  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "verifying" }
    | { status: "done"; result: VerifyResult }
    | { status: "error"; message: string }
  >({ status: "idle" });

  async function verifyOnce() {
    if (!ref) {
      setState({
        status: "error",
        message: "Missing payment reference in the URL.",
      });
      return;
    }

    setState({ status: "verifying" });

    try {
      const res = await fetch(`/api/payments/verify?ref=${encodeURIComponent(ref)}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as VerifyResult;

      if (!res.ok) {
        setState({
          status: "error",
          message: json.error || "Unable to verify payment.",
        });
        return;
      }

      setState({ status: "done", result: json });
    } catch {
      setState({
        status: "error",
        message: "Network error while verifying payment.",
      });
    }
  }

  useEffect(() => {
    verifyOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  const isVerifying = state.status === "verifying";
  const isDone = state.status === "done";
  const isError = state.status === "error";

  const success = isDone && state.result.success;
  const requestId = isDone ? state.result.requestId : undefined;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border border-default-200/60 shadow-sm">
        <CardHeader className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">Payment Confirmation</h1>
          <p className="text-xs opacity-70">
            We&apos;re confirming your Paystack transaction and updating your
            transcript request.
          </p>
        </CardHeader>

        <CardBody className="space-y-4">
          {isVerifying && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Spinner label="Verifying payment..." />
              <p className="text-xs opacity-70 text-center">
                Please wait while we confirm your transaction with Paystack.
              </p>
            </div>
          )}

          {isError && (
            <div className="space-y-3 py-4">
              <p className="text-sm text-danger font-medium">
                Payment verification failed
              </p>
              <p className="text-xs opacity-80">{state.message}</p>
            </div>
          )}

          {isDone && (
            <div className="space-y-3 py-4">
              {success ? (
                <>
                  <p className="text-sm font-medium text-success">
                    Payment verified successfully
                  </p>
                  <p className="text-xs opacity-80">
                    Your payment has been confirmed. You can now proceed to complete
                    the destination details for your transcript request, or return
                    to your dashboard.
                  </p>
                  <Chip size="sm" variant="flat" color="success">
                    Reference: {ref}
                  </Chip>
                  {requestId && (
                    <Chip size="sm" variant="flat">
                      Linked request: #{requestId}
                    </Chip>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-warning">
                    Payment not confirmed yet
                  </p>
                  <p className="text-xs opacity-80">
                    This transaction is not confirmed as successful. It may still be
                    pending. You can re-check the payment status using the button
                    below, or go back to your dashboard.
                  </p>
                  <Chip size="sm" variant="flat" color="warning">
                    Reference: {ref}
                  </Chip>
                </>
              )}
            </div>
          )}
        </CardBody>

        <CardFooter className="flex flex-wrap gap-2 justify-end">
          {!isVerifying && (
            <Button
              variant="light"
              size="sm"
              onPress={() => router.push("/dashboard")}
            >
              Go to dashboard
            </Button>
          )}

          {isDone && success && requestId && (
            <Button
              color="primary"
              size="sm"
              onPress={() => router.push(`/requests/${requestId}/destination`)}
            >
              Continue to destination details
            </Button>
          )}

          {isDone && !success && (
            <Button
              color="primary"
              size="sm"
              onPress={verifyOnce}
            >
              Re-check payment
            </Button>
          )}

          {isError && (
            <Button
              color="primary"
              size="sm"
              onPress={verifyOnce}
            >
              Try again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
