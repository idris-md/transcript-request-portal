"use client";

import { useState } from "react";
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
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md border border-default-200/60 shadow-sm">
        <CardHeader className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Sign in to Transcript Portal</h1>
          <p className="text-xs opacity-70">
            Use the matric number and password you created for the transcript system.
          </p>
        </CardHeader>

        <Divider />

        <CardBody>
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

              {/* If you later add reset-password, link it here */}
              <span className="text-xs opacity-70">
                Having issues? Contact ICT/Records.
              </span>
            </div>

            <Button
              color="primary"
              type="submit"
              className="w-full"
              isLoading={isSubmitting}
            >
              Sign in
            </Button>
          </form>
        </CardBody>

        <CardFooter className="flex flex-col gap-2">
          {serverError && (
            <p className="text-sm text-danger">{serverError}</p>
          )}

          <p className="text-xs">
            Don&apos;t have a transcript account yet?{" "}
            <Link href="/register" size="sm" underline="always">
              Create one
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
