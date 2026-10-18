import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-rail px-4 py-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="w-full max-w-sm rounded-3xl bg-bg p-8 border border-rail-line">
        <h1 className="mb-8">
          <Image src="/brand/lanes-logo-white.svg" alt="Lanes" width={156} height={48} priority />
        </h1>
        <LoginForm />
      </div>
    </main>
  );
}
