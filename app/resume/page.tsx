import type { Metadata } from "next";
import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { getResume } from "@/lib/resume";

export const metadata: Metadata = {
  title: "이력서 — cagea1.com",
};

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
                {item.description && (
                  <p className="mt-2 whitespace-pre-line font-sans text-sm leading-relaxed text-ink-soft">
                    {item.description}
                  </p>
                )}
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

      {resume.skills.length > 0 && (
        <section>
          <h2 className="mb-4 font-serif text-xl text-ink">기술</h2>
          <ul className="flex flex-wrap gap-2">
            {resume.skills.map((skill) => (
              <li
                key={skill}
                className="border border-line px-3 py-1 font-sans text-xs text-ink-soft"
              >
                {skill}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
