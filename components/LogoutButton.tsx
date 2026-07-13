import { logout } from "@/app/actions/auth";

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="whitespace-nowrap text-sm text-ink-soft transition-colors hover:text-accent"
      >
        로그아웃
      </button>
    </form>
  );
}
