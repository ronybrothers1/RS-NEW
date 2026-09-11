import {
  redirect,
} from "next/navigation";

import {
  getPendingPasswordResetEmail,
} from "@/lib/password-reset-session";

import PasswordResetForm from "./components/PasswordResetForm";

export const dynamic =
  "force-dynamic";

function maskEmail(
  email: string,
) {
  const [
    local,
    domain,
  ] = email.split("@");

  if (
    !local ||
    !domain
  ) {
    return email;
  }

  const visible =
    local.slice(0, 2);

  return `${visible}${"*".repeat(
    Math.max(
      2,
      local.length - 2,
    ),
  )}@${domain}`;
}

export default async function PasswordResetVerificationPage() {
  const email =
    await getPendingPasswordResetEmail();

  if (!email) {
    redirect(
      "/lupa-password",
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-md">
        <PasswordResetForm
          maskedEmail={maskEmail(
            email,
          )}
          initialCountdown={60}
        />
      </div>
    </div>
  );
}