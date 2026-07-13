"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form
      action={formAction}
      className="flex w-full max-w-sm flex-col gap-5 rounded-sm border border-line bg-paper-raised px-8 py-10 shadow-[0_1px_24px_-8px_rgba(26,34,48,0.25)]"
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="flex flex-col gap-2">
        <label htmlFor="username" className="text-xs text-ink-soft">
          아이디
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className="border-b border-line bg-transparent py-2 font-sans text-ink outline-none transition-colors focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-xs text-ink-soft">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="border-b border-line bg-transparent py-2 font-sans text-ink outline-none transition-colors focus:border-accent"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-accent" aria-live="polite">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 border border-ink bg-ink py-3 font-sans text-sm tracking-wide text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {pending ? "확인 중..." : "로그인"}
      </button>
    </form>
  );
}
