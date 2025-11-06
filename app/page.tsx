"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Button,
  Divider,
  Link,
  Checkbox,
} from "@heroui/react";

// ---------- Zod schema ----------
const loginSchema = z.object({
  matric: z
    .string()
    .trim()
    .min(3, "Matric number is required")
    .max(100, "Matric number is too long"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      matric: "",
      password: "",
      remember: true,
    },
  });

  const remember = watch("remember");

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);

    const res = await signIn("credentials", {
      redirect: false,
      matric: values.matric.trim(),
      password: values.password,
    });

    if (!res || !res.ok) {
      setServerError("Invalid matric number or password.");
      return;
    }

    // On success, go to dashboard
    window.location.href = "/dashboard";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-default-50 to-default-100 px-4 py-8">
      <Card className="w-full max-w-md border border-default-200/70 shadow-sm">
        <CardHeader className="flex flex-col gap-3 pt-5 pb-3">
          {/* Logo + title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-default-100">
              <Image
                src="/university-logo.png" // ensure this exists in /public
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
                Transcript Request Portal
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">
              Sign in to your transcript account
            </p>
            <p className="text-xs opacity-70">
              Use the matric number and password you created when registering for
              the transcript system.
            </p>
          </div>
        </CardHeader>

        <Divider />

        <CardBody className="pt-4">
          <form
            className="space-y-4"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <Input
              label="Matric Number"
              placeholder="e.g. 2018/1/12345CS"
              autoFocus
              {...register("matric")}
              isInvalid={!!errors.matric}
              errorMessage={errors.matric?.message}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              {...register("password")}
              isInvalid={!!errors.password}
              errorMessage={errors.password?.message}
            />

            <div className="flex items-center justify-between gap-2">
              <Checkbox
                isSelected={!!remember}
                onValueChange={(val) => setValue("remember", val)}
                size="sm"
              >
                Remember me
              </Checkbox>

              <span className="text-[11px] opacity-70">
                Forgotten login? Contact ICT/Records.
              </span>
            </div>

            <Button
              color="primary"
              type="submit"
              className="w-full mt-2"
              isLoading={isSubmitting}
            >
              Sign in
            </Button>
          </form>
        </CardBody>

        <CardFooter className="flex flex-col gap-2 pb-5 pt-3">
          {serverError && (
            <p className="text-sm text-danger">{serverError}</p>
          )}

          <Divider className="my-1" />

          <p className="text-xs text-center">
            Don&apos;t have a transcript account yet?{" "}
            <Link href="/register" size="sm" underline="always">
              Create one
            </Link>
          </p>

          <p className="text-[11px] text-center opacity-60">
            By signing in, you confirm that you are the owner of this matric number
            and consent to the processing of your academic records for transcript
            purposes.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
