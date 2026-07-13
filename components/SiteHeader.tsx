import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function SiteHeader() {
  const authed = await isAuthenticated();

  return (
    <header className="relative z-10 border-b border-line">
      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-6 sm:px-10">
        <Link
          href="/"
          className="font-display text-xl tracking-wide text-ink"
        >
          cagea1
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 font-sans text-sm text-ink-soft sm:gap-x-6">
          <Link href="/resume" className="whitespace-nowrap transition-colors hover:text-accent">
            이력서
          </Link>
          <Link href="/gallery" className="whitespace-nowrap transition-colors hover:text-accent">
            갤러리
          </Link>
          <Link href="/notes" className="whitespace-nowrap transition-colors hover:text-accent">
            메모
          </Link>
          {authed ? (
            <LogoutButton />
          ) : (
            <Link href="/login" className="whitespace-nowrap transition-colors hover:text-accent">
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
