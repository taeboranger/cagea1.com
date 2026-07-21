"use server";

import { redirect } from "next/navigation";
import { setSessionCookie, verifyCredentials } from "@/lib/auth";

export type LoginState = {
  error?: string;
};

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/");

  if (!verifyCredentials(username, password)) {
    return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };
  }

  await setSessionCookie();
  redirect(redirectTo.startsWith("/") ? redirectTo : "/");
}
