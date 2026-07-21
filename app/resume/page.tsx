import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { getResume } from "@/lib/resume";

export const metadata: Metadata = {
  title: "이력서 — cagea1.com",
};

// Renders a lightweight convention within description text:
// "## " starts a sub-heading, "- " a bullet, "  - " a nested bullet.
// Plain lines (e.g. a one-line subtitle before the first heading) render as text.
function renderDescription(text: string): ReactNode {
  const blocks: ReactNode[] = [];
  let list: { level: number; text: string }[] = [];
  let listKey = 0;

  function flushList() {
    if (list.length === 0) return;
    blocks.push(
      <ul key={`list-${listKey++}`} className="mt-1.5 flex flex-col gap-1">
        {list.map((item, i) => (
          <li
            key={i}
            className={`relative pl-4 text-sm leading-relaxed text-ink-soft ${
              item.level > 0 ? "ml-4 text-mist" : ""
            }`}
          >
            <span className="absolute left-0 top-[0.6em] h-1 w-1 rounded-full bg-accent/60" />
            {item.text}
          </li>
        ))}
      </ul>,
    );
    list = [];
  }

  text.split("\n").forEach((rawLine, i) => {
    const line = rawLine.trim();
    if (!line) return;

    const heading = line.match(/^##\s+(.*)$/);
    const nested = rawLine.match(/^(?:\s{2,}|\t)-\s+(.*)$/);
    const top = line.match(/^-\s+(.*)$/);

    if (heading) {
      flushList();
      blocks.push(
        <h4
          key={`h-${i}`}
          className="mt-4 font-sans text-sm font-medium text-ink first:mt-0"
        >
          {heading[1]}
        </h4>,
      );
    } else if (nested) {
      list.push({ level: 1, text: nested[1] });
    } else if (top) {
      list.push({ level: 0, text: top[1] });
    } else {
      flushList();
      blocks.push(
        <p
          key={`p-${i}`}
          className="mt-2 font-sans text-sm leading-relaxed text-ink-soft first:mt-0"
        >
          {line}
        </p>,
      );
    }
  });
  flushList();

  return <div className="mt-2">{blocks}</div>;
}

// Skills are stored as "Category: skill" strings; entries with no category
// (no colon) fall under "기타". Groups keep first-seen order.
function groupSkills(skills: string[]): [string, string[]][] {
  const groups = new Map<string, string[]>();
  for (const raw of skills) {
    const sep = raw.indexOf(":");
    const category = sep === -1 ? "기타" : raw.slice(0, sep).trim();
    const value = (sep === -1 ? raw : raw.slice(sep + 1)).trim();
    if (!value) continue;
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push(value);
  }
  return Array.from(groups.entries());
}

export default async function ResumePage() {
  const [resume, authed] = await Promise.all([getResume(), isAuthenticated()]);

  const contactItems = [
    resume.email,
    resume.phone,
    resume.location,
    resume.website,
  ].filter(Boolean);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-16 sm:px-10">
      <div className="border border-line bg-paper-raised px-6 py-10 shadow-[0_1px_24px_-8px_rgba(26,34,48,0.25)] sm:px-12 sm:py-14">
        <div className="mb-10 flex items-start justify-between gap-6">
          <div>
            <h1 className="font-serif text-4xl text-ink">{resume.name}</h1>
            {resume.title && (
              <p className="mt-2 font-sans text-lg text-ink-soft">
                {resume.title}
              </p>
            )}
            {contactItems.length > 0 && (
              <p className="mt-4 font-sans text-sm text-mist">
                {contactItems.join("  ·  ")}
              </p>
            )}
          </div>
          {authed && (
            <Link
              href="/resume/edit"
              className="shrink-0 border border-line px-4 py-2 font-sans text-sm text-ink-soft transition-colors hover:border-accent hover:text-accent"
            >
              편집
            </Link>
          )}
        </div>

        {resume.summary && (
          <section className="mb-12 border-t border-line pt-8">
            <p className="whitespace-pre-line font-sans leading-relaxed text-ink-soft">
              {resume.summary}
            </p>
          </section>
        )}

        {resume.education.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-6 font-serif text-xl text-ink">학력</h2>
            <ol className="flex flex-col gap-4 border-l border-line pl-6">
              {resume.education.map((item) => (
                <li key={item.id} className="relative">
                  <span className="absolute -left-[27px] top-1.5 h-2 w-2 rounded-full bg-mist" />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="font-sans text-base font-medium text-ink">
                      {item.school}
                      {item.degree && (
                        <span className="text-ink-soft"> · {item.degree}</span>
                      )}
                    </h3>
                    {item.period && (
                      <span className="font-sans text-xs text-mist">
                        {item.period}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {resume.experience.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-6 font-serif text-xl text-ink">경력</h2>
            <ol className="flex flex-col gap-8 border-l border-line pl-6">
              {resume.experience.map((item) => (
                <li key={item.id} className="relative">
                  <span className="absolute -left-[27px] top-1.5 h-2 w-2 rounded-full bg-accent" />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="font-sans text-base font-medium text-ink">
                      {item.role}
                      {item.company && (
                        <span className="text-ink-soft"> · {item.company}</span>
                      )}
                    </h3>
                    {item.period && (
                      <span className="font-sans text-xs text-mist">
                        {item.period}
                      </span>
                    )}
                  </div>
                  {item.description && renderDescription(item.description)}
                </li>
              ))}
            </ol>
          </section>
        )}

        {resume.projects.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-6 font-serif text-xl text-ink">프로젝트</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {resume.projects.map((item) => (
                <div key={item.id} className="border border-line p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="font-sans text-base font-medium text-ink">
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="transition-colors hover:text-accent"
                        >
                          {item.title}
                        </a>
                      ) : (
                        item.title
                      )}
                    </h3>
                    {item.period && (
                      <span className="font-sans text-xs text-mist">
                        {item.period}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="mt-2 whitespace-pre-line font-sans text-sm leading-relaxed text-ink-soft">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {resume.skills.length > 0 && (
          <section>
            <h2 className="mb-4 font-serif text-xl text-ink">기술</h2>
            <dl className="flex flex-col gap-2">
              {groupSkills(resume.skills).map(([category, items]) => (
                <div
                  key={category}
                  className="flex flex-col gap-1 py-1 sm:flex-row sm:gap-6"
                >
                  <dt className="shrink-0 font-sans text-sm font-medium text-ink sm:w-40">
                    {category}
                  </dt>
                  <dd className="font-sans text-sm text-ink-soft">
                    {items.join(", ")}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </div>
  );
}
