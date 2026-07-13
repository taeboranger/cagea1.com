export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-line">
      <div className="mx-auto w-full max-w-4xl px-6 py-8 text-center font-sans text-xs text-ink-soft sm:px-10">
        <span className="font-display tracking-widest">cagea1.com</span>
        <span className="mx-2 text-mist">·</span>
        <span>&copy; {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
