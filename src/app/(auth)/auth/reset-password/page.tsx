"use client";

import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { PasswordResetForm } from "@/components/auth/password-reset-form";

export default function ResetPasswordPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        }
      >
        <PasswordResetForm onBack={() => window.history.back()} />
      </Suspense>
    </div>
  );
}
