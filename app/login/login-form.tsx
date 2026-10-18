"use client";
import { useActionState } from "react";
import { login, type LoginState } from "@/lib/auth/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);
  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="passcode" className="text-sm font-medium">
        Passcode
      </label>
      <input
        id="passcode"
        name="passcode"
        type="password"
        autoComplete="current-password"
        required
        autoFocus
        className="rounded-xl border border-line bg-surface px-4 py-3 text-base outline-none transition-colors focus:border-ink"
        aria-describedby={state?.error ? "login-error" : undefined}
      />
      {state?.error ? (
        <p id="login-error" role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <button disabled={pending} className="mt-1 rounded-xl bg-rail px-4 py-3 font-semibold text-rail-ink transition-colors hover:bg-rail-hover disabled:cursor-wait disabled:opacity-70">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
