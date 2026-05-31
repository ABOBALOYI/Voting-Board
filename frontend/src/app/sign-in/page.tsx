"use client";

import { SignInForm } from "@/components/SignInForm";

// Sign-in route. Kept as a thin "use client" wrapper (Req 9.3) so the credential
// form and its token-storing side effects stay fully client-rendered; the page
// itself just hosts SignInForm (Req 1.5, 7.3).
export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-primary-50/60 to-background px-4 py-8">
      <SignInForm />
    </main>
  );
}
