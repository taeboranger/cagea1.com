import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "로그인 — cagea1.com",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20">
      <h1 className="mb-8 font-serif text-2xl text-ink">로그인</h1>
      <LoginForm redirectTo={from ?? "/"} />
    </div>
  );
}
