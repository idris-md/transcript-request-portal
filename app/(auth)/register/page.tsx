"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Button,
  Divider,
  Chip,
} from "@heroui/react";

// ---------- Zod Schemas ----------

const lookupSchema = z.object({
  matric: z
    .string()
    .trim()
    .min(3, "Matric number is required")
    .max(100, "Matric number is too long"),
});

type LookupFormValues = z.infer<typeof lookupSchema>;

const registerSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email address"),
    phone: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

// Type of profile coming from /api/register/lookup
type LookupProfile = {
  surname: string;
  first_name?: string | null;
  other_name?: string | null;
  department?: string | null;
  school?: string | null;
  level?: string | null;
  entry_session?: string | null;
};

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [profile, setProfile] = useState<LookupProfile | null>(null);
  const [matric, setMatric] = useState<string>("");
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // ---------- Step 1: Lookup Form ----------
  const {
    register: registerLookup,
    handleSubmit: handleLookupSubmit,
    formState: { errors: lookupErrors, isSubmitting: lookupSubmitting },
  } = useForm<LookupFormValues>({
    resolver: zodResolver(lookupSchema),
    defaultValues: { matric: "" },
  });

  // ---------- Step 2: Register Form ----------
  const {
    register: registerForm,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors, isSubmitting: registerSubmitting },
    reset: resetRegisterForm,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const fullName =
    profile &&
    `${profile.surname} ${profile.first_name ?? ""} ${
      profile.other_name ?? ""
    }`
      .replace(/\s+/g, " ")
      .trim();

  // ---------- Handlers ----------

  async function onLookupSubmit(values: LookupFormValues) {
    setServerError(null);
    setServerMessage(null);

    try {
      const res = await fetch("/api/register/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matric: values.matric.trim() }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          setServerError("Matric number not found in e-Portal records.");
        } else {
          setServerError("Unable to lookup matric number. Please try again.");
        }
        return;
      }

      const json = await res.json();
      setProfile(json.data as LookupProfile);
      setMatric(values.matric.trim());
      setStep(2);
      resetRegisterForm();
    } catch (e) {
      setServerError(
        "Network error. Please check your connection and try again."
      );
    }
  }

  async function onRegisterSubmit(values: RegisterFormValues) {
    if (!profile || !matric) return;

    setServerError(null);
    setServerMessage(null);

    const payload = {
      matric,
      password: values.password,
      email: values.email,
      phone: values.phone || null,
      profile: {
        full_name: fullName,
        department: profile.department,
        school: profile.school,
        level: profile.level,
        entry_session: profile.entry_session,
      },
    };

    try {
      const res = await fetch("/api/register/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setServerError(
            j.message || "An account with this matric already exists."
          );
        } else {
          setServerError(
            j.message || "Could not create account. Please try again."
          );
        }
        return;
      }

      setServerMessage("Account created successfully. You can now log in.");
    } catch (e) {
      setServerError("Network error while creating account. Please try again.");
    }
  }

  // ---------- UI ----------

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-default-50 to-default-100 px-4 py-8">
      <div className="w-full max-w-3xl space-y-6">
        {/* Top header with logo */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-default-100">
              <Image
                src="/university-logo.png" // make sure this exists in /public
                alt="University logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-base font-semibold leading-tight">
                Your University Name
              </h1>
              <p className="text-[11px] uppercase tracking-wide opacity-70">
                Transcript Request Portal · Registration
              </p>
            </div>
          </div>

          <Chip size="sm" variant="flat">
            Already registered?{" "}
            <a
              href="/"
              className="ml-1 text-primary underline-offset-2 hover:underline"
            >
              Sign in
            </a>
          </Chip>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 text-sm">
          <StepPill active={step === 1} label="1. Verify Matric" />
          <div className="h-px flex-1 bg-default-200" />
          <StepPill active={step === 2} label="2. Create Password" />
        </div>

        {/* Card with steps */}
        <Card className="border border-default-200/60 shadow-sm">
          <CardHeader className="flex flex-col gap-1 border-b border-default-200 pb-3">
            <p className="text-base font-semibold">
              Transcript Portal Registration
            </p>
            <p className="text-xs opacity-70">
              First we verify your details from the e-Portal, then you create a
              secure password for the transcript system.
            </p>
          </CardHeader>

          {/* Step 1: Lookup */}
          {step === 1 && (
            <>
              <CardBody className="space-y-4 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                  Step 1 · Verify your matric number
                </p>
                <p className="text-xs opacity-70">
                  We&apos;ll pull your official student record (name, department,
                  school, level, entry session) from the e-Portal.
                </p>
                <form
                  className="space-y-4"
                  onSubmit={handleLookupSubmit(onLookupSubmit)}
                  noValidate
                >
                  <Input
                    label="Matric Number"
                    placeholder="e.g. 2018/1/12345CS"
                    autoFocus
                    {...registerLookup("matric")}
                    isInvalid={!!lookupErrors.matric}
                    errorMessage={lookupErrors.matric?.message}
                  />
                  <Button
                    color="primary"
                    type="submit"
                    isLoading={lookupSubmitting}
                    className="w-full sm:w-auto"
                  >
                    Continue
                  </Button>
                </form>
              </CardBody>

              {(serverError || serverMessage) && (
                <CardFooter className="flex flex-col gap-1">
                  {serverError && (
                    <p className="text-sm text-danger">{serverError}</p>
                  )}
                  {serverMessage && (
                    <p className="text-sm text-success">{serverMessage}</p>
                  )}
                </CardFooter>
              )}
            </>
          )}

          {/* Step 2: Confirm + Password */}
          {step === 2 && profile && (
            <>
              <CardBody className="space-y-5 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                      Step 2 · Confirm details & set password
                    </p>
                    <p className="text-xs opacity-70">
                      Your profile is read from the e-Portal. If anything is
                      incorrect, please contact the ICT/Records unit before
                      proceeding.
                    </p>
                  </div>
                  <Chip size="sm" variant="flat">
                    Matric: {matric}
                  </Chip>
                </div>

                <Divider className="my-1" />

                {/* Read-only profile summary */}
                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    Verified from e-Portal
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input
                      label="Full Name"
                      value={fullName ?? ""}
                      isReadOnly
                      variant="bordered"
                      size="sm"
                    />
                    <Input
                      label="Department"
                      value={profile.department ?? ""}
                      isReadOnly
                      variant="bordered"
                      size="sm"
                    />
                    <Input
                      label="School / Faculty"
                      value={profile.school ?? ""}
                      isReadOnly
                      variant="bordered"
                      size="sm"
                    />
                    <Input
                      label="Current Level"
                      value={profile.level ?? ""}
                      isReadOnly
                      variant="bordered"
                      size="sm"
                    />
                    <Input
                      label="Entry Session"
                      value={profile.entry_session ?? ""}
                      isReadOnly
                      variant="bordered"
                      size="sm"
                    />
                  </div>
                </section>

                <Divider className="my-1" />

                {/* Editable account fields */}
                <section className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    Transcript portal login details
                  </p>
                  <form
                    className="space-y-4"
                    onSubmit={handleRegisterSubmit(onRegisterSubmit)}
                    noValidate
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        {...registerForm("email")}
                        isInvalid={!!registerErrors.email}
                        errorMessage={registerErrors.email?.message}
                      />
                      <Input
                        label="Phone (optional)"
                        placeholder="0803..."
                        {...registerForm("phone")}
                        isInvalid={!!registerErrors.phone}
                        errorMessage={registerErrors.phone?.message}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input
                        label="Password"
                        type="password"
                        placeholder="At least 8 characters"
                        {...registerForm("password")}
                        isInvalid={!!registerErrors.password}
                        errorMessage={registerErrors.password?.message}
                      />
                      <Input
                        label="Confirm Password"
                        type="password"
                        {...registerForm("confirmPassword")}
                        isInvalid={!!registerErrors.confirmPassword}
                        errorMessage={registerErrors.confirmPassword?.message}
                      />
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        variant="light"
                        type="button"
                        size="sm"
                        onPress={() => {
                          setStep(1);
                          setProfile(null);
                          setServerError(null);
                          setServerMessage(null);
                        }}
                      >
                        Back to lookup
                      </Button>

                      <Button
                        color="primary"
                        type="submit"
                        isLoading={registerSubmitting}
                        className="w-full sm:w-auto"
                      >
                        Create Account
                      </Button>
                    </div>
                  </form>
                </section>
              </CardBody>

              {(serverError || serverMessage) && (
                <CardFooter className="flex flex-col gap-1">
                  {serverError && (
                    <p className="text-sm text-danger">{serverError}</p>
                  )}
                  {serverMessage && (
                    <p className="text-sm text-success">
                      {serverMessage}{" "}
                      <a
                        href="/login"
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Go to login
                      </a>
                    </p>
                  )}
                </CardFooter>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

// Small pill component for step indicator
function StepPill({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
        active
          ? "bg-primary/10 text-primary-700 dark:text-primary-300"
          : "bg-default-100 text-foreground/70"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          active ? "bg-primary" : "bg-default-300"
        }`}
      />
      <span className="font-medium">{label}</span>
    </div>
  );
}
