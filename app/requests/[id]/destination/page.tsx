"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Button,
  Select,
  SelectItem,
  Divider,
  Chip,
  Skeleton,
} from "@heroui/react";

// Basic country list; you can replace with a full dataset later
const COUNTRIES = [
  "Nigeria",
  "Ghana",
  "United Kingdom",
  "United States",
  "Canada",
  "Germany",
  "France",
  "United Arab Emirates",
  "South Africa",
  "India",
  "China",
  "Malaysia",
];

// ---------- Zod schema ----------
const destinationSchema = z.object({
  institution_name: z
    .string()
    .trim()
    .min(3, "Institution name is required"),
  country: z
    .string()
    .trim()
    .min(2, "Country is required"),
  address_line1: z
    .string()
    .trim()
    .min(5, "Address line 1 is required"),
  address_line2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state_region: z.string().trim().optional(),
  postal_code: z.string().trim().optional(),
  email_recipient: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /\S+@\S+\.\S+/.test(val),
      "Enter a valid email or leave blank"
    ),
});

type DestinationFormValues = z.infer<typeof destinationSchema>;

type Scope = "WITHIN_NG" | "OUTSIDE_NG";

type RequestDetails = {
  id: number;
  scope: Scope;
  status:
    | "DRAFT"
    | "PAYMENT_PENDING"
    | "PAID"
    | "SUBMITTED"
    | "PROCESSING"
    | "SENT"
    | "CANCELLED";
  request_email: string;
  created_at: string;
};

export default function DestinationPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const id = Number(idParam);

  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);

  const [serverError, setServerError] = useState<string | null>(null);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DestinationFormValues>({
    resolver: zodResolver(destinationSchema),
    defaultValues: {
      institution_name: "",
      country: "Nigeria",
      address_line1: "",
      address_line2: "",
      city: "",
      state_region: "",
      postal_code: "",
      email_recipient: "",
    },
  });

  const countryValue = watch("country");

  // ---------- Fetch request to know scope + validate state ----------
  useEffect(() => {
    if (!Number.isFinite(id)) return;

    (async () => {
      try {
        const res = await fetch(`/api/requests/${id}`);
        if (!res.ok) {
          setRequestError("Unable to load this request.");
          setLoadingRequest(false);
          return;
        }
        const json: RequestDetails = await res.json();
        setRequest(json);
        setLoadingRequest(false);

        // If scope is WITHIN_NG, force Nigeria
        if (json.scope === "WITHIN_NG") {
          setValue("country", "Nigeria");
        }
      } catch {
        setRequestError("Network error while loading request.");
        setLoadingRequest(false);
      }
    })();
  }, [id, setValue]);

  const withinNigeria = request?.scope === "WITHIN_NG";

  // ---------- Submit handler ----------
  async function onSubmit(values: DestinationFormValues) {
    if (!request) return;

    setServerError(null);
    setServerMessage(null);
    setSubmitting(true);

    // Enforce Nigeria server-side in case of tampering
    const payload = {
      ...values,
      country: withinNigeria ? "Nigeria" : values.country,
    };

    try {
      const res = await fetch(`/api/requests/${request.id}/destination`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setServerError(j.error || "Failed to submit destination details.");
        setSubmitting(false);
        return;
      }

      setServerMessage("Destination details submitted successfully.");
      setSubmitting(false);

      // Optionally redirect back to request details after a short delay
      setTimeout(() => {
        router.push(`/requests/${request.id}`);
      }, 1000);
    } catch {
      setServerError("Network error while submitting. Please try again.");
      setSubmitting(false);
    }
  }

  // ---------- UI ----------
  if (!Number.isFinite(id)) {
    return (
      <div className="max-w-xl">
        <p className="text-sm text-danger">
          Invalid request ID in the URL.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Destination for Request #{idParam}
          </h1>
          <p className="text-sm opacity-75">
            Provide the institution and address where your transcript should be sent.
          </p>
        </div>
        {request && (
          <Chip variant="flat" size="sm">
            Scope:{" "}
            {request.scope === "WITHIN_NG" ? "Within Nigeria" : "Outside Nigeria"}
          </Chip>
        )}
      </div>

      {/* Main card */}
      <Card className="border border-default-200/60 shadow-sm">
        <CardHeader className="flex flex-col gap-1">
          <p className="text-base font-medium">Destination details</p>
          <p className="text-xs opacity-70">
            If your request is for delivery within Nigeria, the country is locked to
            Nigeria. For foreign institutions, select the appropriate country.
          </p>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-4">
          {loadingRequest && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3 rounded-md" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
              <Skeleton className="h-4 w-3/4 rounded-md" />
            </div>
          )}

          {requestError && (
            <p className="text-sm text-danger">{requestError}</p>
          )}

          {request && (
            <form
              className="space-y-5"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              {/* Institution name */}
              <section className="space-y-2">
                <Input
                  label="Institution name"
                  placeholder="e.g. University of Lagos"
                  {...register("institution_name")}
                  isInvalid={!!errors.institution_name}
                  errorMessage={errors.institution_name?.message}
                />
              </section>

              {/* Country + state/region */}
              <section className="space-y-2">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Controller
                    control={control}
                    name="country"
                    render={({ field }) => (
                      <Select
                        label="Country"
                        selectedKeys={[field.value]}
                        onSelectionChange={(keys) => {
                          const value = Array.from(keys)[0] as string;
                          field.onChange(value);
                        }}
                        isDisabled={withinNigeria}
                      >
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c} textValue={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  />
                  <Input
                    label="State / Region"
                    placeholder={withinNigeria ? "State" : "State / Region"}
                    {...register("state_region")}
                    isInvalid={!!errors.state_region}
                    errorMessage={errors.state_region?.message}
                  />
                </div>
                {errors.country && (
                  <p className="text-xs text-danger mt-1">
                    {errors.country.message}
                  </p>
                )}
                {withinNigeria && (
                  <p className="text-[11px] opacity-70">
                    This request is for delivery within Nigeria, so the country is
                    fixed to Nigeria.
                  </p>
                )}
              </section>

              {/* Address lines */}
              <section className="space-y-2">
                <Input
                  label="Address line 1"
                  placeholder="Street address, building, etc."
                  {...register("address_line1")}
                  isInvalid={!!errors.address_line1}
                  errorMessage={errors.address_line1?.message}
                />
                <Input
                  label="Address line 2 (optional)"
                  placeholder="Suite, department, or additional info"
                  {...register("address_line2")}
                  isInvalid={!!errors.address_line2}
                  errorMessage={errors.address_line2?.message}
                />
              </section>

              {/* City / postal / recipient email */}
              <section className="space-y-2">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Input
                    label="City / Town"
                    {...register("city")}
                    isInvalid={!!errors.city}
                    errorMessage={errors.city?.message}
                  />
                  <Input
                    label="Postal code"
                    {...register("postal_code")}
                    isInvalid={!!errors.postal_code}
                    errorMessage={errors.postal_code?.message}
                  />
                  <Input
                    label="Recipient email (optional)"
                    type="email"
                    placeholder="admissions@university.edu"
                    {...register("email_recipient")}
                    isInvalid={!!errors.email_recipient}
                    errorMessage={errors.email_recipient?.message}
                  />
                </div>
                <p className="text-[11px] opacity-70">
                  If the institution accepts transcripts by email, provide a valid
                  official email address here.
                </p>
              </section>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  variant="light"
                  size="sm"
                  type="button"
                  onPress={() => router.push(`/requests/${request.id}`)}
                >
                  Back to request
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={submitting}
                >
                  Submit destination details
                </Button>
              </div>
            </form>
          )}
        </CardBody>
        <CardFooter className="flex flex-col gap-1">
          {serverError && (
            <p className="text-sm text-danger">{serverError}</p>
          )}
          {serverMessage && (
            <p className="text-sm text-success">{serverMessage}</p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
