import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import {
  getResume,
  SKILL_LEVELS,
  type ResumeSkill,
  type SkillLevel,
} from "@/lib/resume";
import { toggleResumeVisibilityAction } from "@/app/actions/resume";

const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  proficient: "숙련",
  intermediate: "중급",
  basic: "기초",
};

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

// Description fields written through the WYSIWYG editor are stored as
// sanitized HTML; older entries saved before that editor existed are plain
// text using the "## heading" / "- bullet" convention parsed above.
function looksLikeHtml(text: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(text);
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

// Groups skills by category, keeping first-seen category order.
function groupSkills(skills: ResumeSkill[]): [string, ResumeSkill[]][] {
  const groups = new Map<string, ResumeSkill[]>();
  for (const skill of skills) {
    const category = skill.category || "기타";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category)!.push(skill);
  }
  return Array.from(groups.entries());
}

export default async function ResumePage() {
  const [resume, authed] = await Promise.all([getResume(), isAuthenticated()]);

  if (!resume.isPublic && !authed) {
    notFound();
  }

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
            <div className="flex shrink-0 items-center gap-2">
              {!resume.isPublic && (
                <span className="border border-accent/40 px-2 py-1 font-sans text-xs text-accent">
                  비공개
                </span>
              )}
              <form action={toggleResumeVisibilityAction}>
                <button
                  type="submit"
                  className="border border-line px-4 py-2 font-sans text-sm text-ink-soft transition-colors hover:border-accent hover:text-accent"
                >
                  {resume.isPublic ? "비공개로 전환" : "공개로 전환"}
                </button>
              </form>
              <Link
                href="/resume/edit"
                className="border border-line px-4 py-2 font-sans text-sm text-ink-soft transition-colors hover:border-accent hover:text-accent"
              >
                편집
              </Link>
            </div>
          )}
        </div>

        {resume.summary && (
          <section className="mb-12 border-t border-line pt-8">
            {looksLikeHtml(resume.summary) ? (
              <div
                className="rich-content"
                dangerouslySetInnerHTML={{ __html: resume.summary }}
              />
            ) : (
              <p className="whitespace-pre-line font-sans leading-relaxed text-ink-soft">
                {resume.summary}
              </p>
            )}
          </section>
        )}

        {resume.skills.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 font-serif text-xl text-ink">기술</h2>
            <dl className="flex flex-col gap-4">
              {groupSkills(resume.skills).map(([category, items]) => (
                <div
                  key={category}
                  className="flex flex-col gap-1.5 py-1 sm:flex-row sm:gap-6"
                >
                  <dt className="shrink-0 font-sans text-sm font-medium text-ink sm:w-40">
                    {category}
                  </dt>
                  <dd className="flex flex-col gap-1">
                    {SKILL_LEVELS.filter((level) =>
                      items.some((skill) => skill.level === level),
                    ).map((level) => (
                      <p
                        key={level}
                        className="font-sans text-sm text-ink-soft"
                      >
                        <span className="mr-2 text-xs text-mist">
                          {SKILL_LEVEL_LABELS[level]}
                        </span>
                        {items
                          .filter((skill) => skill.level === level)
                          .map((skill) => skill.name)
                          .join(", ")}
                      </p>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
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
                  {item.description &&
                    (looksLikeHtml(item.description) ? (
                      <div
                        className="rich-content mt-2"
                        dangerouslySetInnerHTML={{ __html: item.description }}
                      />
                    ) : (
                      renderDescription(item.description)
                    ))}
                </li>
              ))}
            </ol>
          </section>
        )}

        {resume.projects.length > 0 && (
          <section>
            <h2 className="mb-6 font-serif text-xl text-ink">프로젝트</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {resume.projects.map((item) => (
                <div key={item.id} className="border border-line p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="font-sans text-base font-medium text-ink">
                      {item.title}
                    </h3>
                    {item.period && (
                      <span className="font-sans text-xs text-mist">
                        {item.period}
                      </span>
                    )}
                  </div>
                  {(item.link || item.githubLink) && (
                    <div className="mt-1.5 flex items-center gap-2">
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="관련 링크"
                          title={item.link}
                          className="text-mist transition-colors hover:text-accent"
                        >
                          <LinkIcon className="h-4 w-4" />
                        </a>
                      )}
                      {item.githubLink && (
                        <a
                          href={item.githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="GitHub 링크"
                          title={item.githubLink}
                          className="text-mist transition-colors hover:text-accent"
                        >
                          <GithubIcon className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  )}
                  {item.description &&
                    (looksLikeHtml(item.description) ? (
                      <div
                        className="rich-content mt-2"
                        dangerouslySetInnerHTML={{ __html: item.description }}
                      />
                    ) : (
                      <p className="mt-2 whitespace-pre-line font-sans text-sm leading-relaxed text-ink-soft">
                        {item.description}
                      </p>
                    ))}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
