"use client";

import { useState } from "react";
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

    // We re-use the email from the form for Paystack
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
      // redirect to Paystack authorization URL
      window.location.href = json.authUrl;
    } catch (e) {
      setServerError("Network error while initializing payment. Please try again.");
    }
  }

  const hasStarted = requestId !== null && amountNGN !== null;

  // ---------- UI ----------
  return (
    <div className="max-w-xl">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold">New Transcript Request</h1>
        <p className="text-sm opacity-75">
          Choose where your transcript will be sent and provide an email we can use
          to send updates about this request.
        </p>
      </div>

      <Card className="border border-default-200/60 shadow-sm">
        <CardHeader className="flex flex-col gap-1">
          <p className="text-base font-medium">Request details</p>
          <p className="text-xs opacity-70">
            You can request transcripts for delivery within Nigeria or to institutions
            outside the country. Fees differ by destination.
          </p>
        </CardHeader>

        <Divider />

        <CardBody>
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
                    isDisabled={hasStarted} // lock after we start request
                  >
                    <Radio value="WITHIN_NG" description="Delivery to institutions in Nigeria">
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
                <p className="text-xs text-danger mt-1">
                  {errors.scope.message}
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
                isDisabled={hasStarted} // lock after we start
              />
              <p className="text-[11px] opacity-70">
                We’ll send receipts and status notifications for this transcript
                request to this email.
              </p>
            </section>

            {/* Start button (only if not started) */}
            {!hasStarted && (
              <Button
                color="primary"
                type="submit"
                className="w-full sm:w-auto"
                isLoading={isSubmitting}
              >
                Start request & show fee
              </Button>
            )}
          </form>

          {/* After start: show summary & payment */}
          {hasStarted && (
            <section className="mt-6 space-y-3">
              <Divider />
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                Payment summary
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Chip variant="flat" size="sm">
                  Scope:{" "}
                  {lockedScope === "WITHIN_NG" ? "Within Nigeria" : "Outside Nigeria"}
                </Chip>
                <Chip variant="flat" color="primary" size="sm">
                  Amount: ₦{amountNGN!.toLocaleString()}
                </Chip>
                <Chip variant="flat" size="sm">
                  Request ID: #{requestId}
                </Chip>
              </div>
              <p className="text-[11px] opacity-70">
                Clicking &quot;Pay with Paystack&quot; will redirect you to the payment
                page. After successful payment, you&apos;ll be returned to complete
                the destination details.
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
              You can always view your previous requests and their statuses on the
              dashboard.
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
