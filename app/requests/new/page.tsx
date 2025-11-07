"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  RadioGroup,
  Radio,
  Input,
  Button,
  Chip,
  Divider,
} from "@heroui/react";

// ---------- Zod schema ----------
const newRequestSchema = z.object({
  scope: z.enum(["WITHIN_NG", "OUTSIDE_NG"], {
    required_error: "Please select where the transcript will be sent",
  }),
  requestEmail: z
    .string()
    .trim()
    .email("Enter a valid email where we can contact you about this request"),
});

type NewRequestFormValues = z.infer<typeof newRequestSchema>;
type Scope = "WITHIN_NG" | "OUTSIDE_NG";

export default function NewRequestPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const [requestId, setRequestId] = useState<number | null>(null);
  const [amountNGN, setAmountNGN] = useState<number | null>(null);
  const [lockedScope, setLockedScope] = useState<Scope | null>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<NewRequestFormValues>({
    resolver: zodResolver(newRequestSchema),
    defaultValues: {
      scope: "WITHIN_NG",
      requestEmail: "",
    },
  });

  const currentScope = watch("scope") as Scope;
  const hasStarted = requestId !== null && amountNGN !== null;

  // ---------- Step 1: Start request ----------
  async function onSubmit(values: NewRequestFormValues) {
    setServerError(null);
    setServerMessage(null);

    try {
      const res = await fetch("/api/requests/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: values.scope,
          requestEmail: values.requestEmail,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setServerError(
          j.error || "Unable to start transcript request. Please try again."
        );
        return;
      }

      const json = await res.json();
      setRequestId(json.requestId);
      setAmountNGN(json.amountNGN);
      setLockedScope(values.scope);
      setServerMessage("Request initialized. Proceed to payment.");
    } catch (e) {
      setServerError("Network error while creating request. Please try again.");
    }
  }

  // ---------- Step 2: Initialize payment ----------
  async function handlePay() {
    if (!requestId || !amountNGN) return;
    setServerError(null);
    setServerMessage(null);

    const requestEmail = watch("requestEmail");

    try {
      const res = await fetch("/api/payments/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          amountNGN,
          email: requestEmail,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setServerError(
          j.error || "Unable to initialize payment. Please try again."
        );
        return;
      }

      const json = await res.json();
      window.location.href = json.authUrl;
    } catch (e) {
      setServerError("Network error while initializing payment. Please try again.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {/* Top bar / breadcrumb */}
      <div className="flex items-center justify-between gap-2">
        <Button
          size="sm"
          variant="light"
        >
          <Link href="/dashboard">← Back to dashboard</Link>
        </Button>
        <Chip size="sm" variant="flat">
          Step 1 of 3 · Request → Payment → Destination
        </Chip>
      </div>

      {/* Page header */}
      <div className="space-y-1 border-b border-default-200 pb-4">
        <h1 className="text-2xl font-semibold">New Transcript Request</h1>
        <p className="text-sm opacity-75">
          Start a new transcript request by choosing where it will be sent and the
          email address we should use for notifications.
        </p>
      </div>

      <Card className="border border-default-200/60 shadow-sm">
        <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-medium">Request details</p>
            <p className="text-xs opacity-70">
              Choose whether this transcript is going to an institution within
              Nigeria or outside the country. Fees are based on the destination.
            </p>
          </div>
          <Chip size="sm" variant="flat">
            {currentScope === "WITHIN_NG"
              ? "Within Nigeria"
              : "Outside Nigeria"}
          </Chip>
        </CardHeader>

        <Divider />

        <CardBody className="space-y-5">
          <form
            className="space-y-5"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {/* Scope selection */}
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Where should the transcript be sent?
              </p>
              <Controller
                control={control}
                name="scope"
                render={({ field }) => (
                  <RadioGroup
                    orientation="horizontal"
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as Scope)}
                    isDisabled={hasStarted}
                  >
                    <Radio
                      value="WITHIN_NG"
                      description="Delivery to institutions in Nigeria"
                    >
                      Within Nigeria
                    </Radio>
                    <Radio
                      value="OUTSIDE_NG"
                      description="Delivery to institutions outside Nigeria"
                    >
                      Outside Nigeria
                    </Radio>
                  </RadioGroup>
                )}
              />
              {errors.scope && (
                <p className="mt-1 text-xs text-danger">
                  {errors.scope.message}
                </p>
              )}
              {!hasStarted && (
                <p className="text-[11px] opacity-70">
                  You won&apos;t be able to change this after you start the request.
                </p>
              )}
            </section>

            {/* Email field */}
            <section className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Contact email for this request
              </p>
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                {...register("requestEmail")}
                isInvalid={!!errors.requestEmail}
                errorMessage={errors.requestEmail?.message}
                isDisabled={hasStarted}
              />
              <p className="text-[11px] opacity-70">
                Receipts and status notifications for this transcript request will
                be sent to this email address.
              </p>
            </section>

            {/* Start button */}
            {!hasStarted && (
              <div className="pt-1">
                <Button
                  color="primary"
                  type="submit"
                  className="w-full sm:w-auto"
                  isLoading={isSubmitting}
                >
                  Start request &amp; show fee
                </Button>
                <p className="mt-2 text-[11px] opacity-70">
                  Once you start, we&apos;ll create a new transcript request and
                  calculate the applicable fee based on your selection.
                </p>
              </div>
            )}
          </form>

          {/* After start: payment summary */}
          {hasStarted && (
            <section className="mt-2 space-y-3 rounded-lg border border-default-200 bg-default-50 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
                Payment summary
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Chip variant="flat" size="sm">
                  Scope:{" "}
                  {lockedScope === "WITHIN_NG"
                    ? "Within Nigeria"
                    : "Outside Nigeria"}
                </Chip>
                <Chip variant="flat" color="primary" size="sm">
                  Amount: ₦{amountNGN!.toLocaleString()}
                </Chip>
                <Chip variant="flat" size="sm">
                  Request ID: #{requestId}
                </Chip>
              </div>
              <p className="text-[11px] opacity-70">
                Click &quot;Pay with Paystack&quot; to complete the payment. After
                a successful transaction, you&apos;ll be redirected to confirm the
                destination institution and address.
              </p>
            </section>
          )}
        </CardBody>

        <CardFooter className="flex flex-col gap-2">
          {hasStarted && (
            <Button
              color="primary"
              className="w-full sm:w-auto"
              onPress={handlePay}
            >
              Pay with Paystack
            </Button>
          )}

          {serverError && (
            <p className="text-sm text-danger">{serverError}</p>
          )}
          {serverMessage && (
            <p className="text-sm text-success">{serverMessage}</p>
          )}

          {!hasStarted && (
            <p className="mt-1 text-[11px] opacity-70">
              You can always view your previous transcript requests and their
              statuses from the dashboard.
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
