import Link from "next/link";
import Image from "next/image";
import { isAuthenticated } from "@/lib/auth";
import { getResume } from "@/lib/resume";
import { getPhotos } from "@/lib/gallery";
import { getMonthlyContributions } from "@/lib/github";
import GithubContributions from "@/components/GithubContributions";

export default async function Home() {
  const [resume, photos, contributions, authed] = await Promise.all([
    getResume(),
    getPhotos(),
    getMonthlyContributions(),
    isAuthenticated(),
  ]);
  const previewPhotos = photos.slice(0, 8);
  const showResumeLink = resume.isPublic || authed;

  return (
    <div className="flex flex-1 flex-col">
      <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-24 text-center sm:px-10">
        <p className="font-sans text-xs tracking-[0.3em] text-mist">WELCOME</p>

        <h1 className="mt-6 font-serif text-4xl text-ink sm:text-5xl">
          CageA
        </h1>

        {resume.title && (
          <p className="mt-4 font-sans text-base text-ink-soft">
            {resume.title}
          </p>
        )}

        <div className="my-10 h-px w-16 bg-line" />

        <div className="flex flex-col gap-4 sm:flex-row">
          {showResumeLink && (
            <Link
              href="/resume"
              className="border border-ink px-8 py-3 font-sans text-sm tracking-wide text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              이력서 보기
            </Link>
          )}
          <Link
            href="/gallery"
            className="border border-line px-8 py-3 font-sans text-sm tracking-wide text-ink-soft transition-colors hover:border-accent hover:text-accent"
          >
            갤러리 보기
          </Link>
        </div>
      </section>

      {previewPhotos.length > 0 && (
        <section className="mx-auto w-full max-w-5xl border-t border-line px-6 py-16 sm:px-10">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-serif text-2xl text-ink">갤러리</h2>
            <Link
              href="/gallery"
              className="font-sans text-sm text-ink-soft transition-colors hover:text-accent"
            >
              전체 보기
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {previewPhotos.map((photo) => (
              <Link
                key={photo.id}
                href="/gallery"
                className="group relative block aspect-square overflow-hidden border border-line"
              >
                <Image
                  src={photo.url}
                  alt={photo.caption || "갤러리 사진"}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {contributions && <GithubContributions data={contributions} />}
    </div>
  );
}
