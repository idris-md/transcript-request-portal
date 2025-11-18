// app/payments/callback/page.tsx
import { Suspense } from "react";
import CallbackClient from "./CallbackClient";

export const dynamic = "force-dynamic"; // this page depends on runtime search params

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-sm opacity-70">
            Loading payment verification...
          </div>
        </div>
      }
    >
      <CallbackClient />
    </Suspense>
  );
}
