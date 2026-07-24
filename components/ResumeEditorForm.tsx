"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  saveResumeAction,
  saveResumeJsonAction,
  type SaveResumeState,
  type SaveResumeJsonState,
} from "@/app/actions/resume";
import type {
  ResumeData,
  ResumeEducation,
  ResumeExperience,
  ResumeProject,
  ResumeSkill,
  SkillLevel,
} from "@/lib/resume";
import RichTextEditor from "@/components/RichTextEditor";

const initialState: SaveResumeState = {};
const initialJsonState: SaveResumeJsonState = {};

const SKILL_LEVEL_OPTIONS: { value: SkillLevel; label: string }[] = [
  { value: "proficient", label: "숙련" },
  { value: "intermediate", label: "중급" },
  { value: "basic", label: "기초" },
];

function emptyExperience(): ResumeExperience {
  return {
    id: crypto.randomUUID(),
    company: "",
    role: "",
    period: "",
    description: "",
  };
}

function emptyEducation(): ResumeEducation {
  return { id: crypto.randomUUID(), school: "", degree: "", period: "" };
}

function emptyProject(): ResumeProject {
  return {
    id: crypto.randomUUID(),
    title: "",
    period: "",
    link: "",
    githubLink: "",
    description: "",
  };
}

function emptySkill(): ResumeSkill {
  return {
    id: crypto.randomUUID(),
    category: "",
    name: "",
    level: "proficient",
  };
}

const inputClass =
  "w-full border-b border-line bg-transparent py-2 font-sans text-sm text-ink outline-none transition-colors focus:border-accent";

const labelClass = "text-xs text-ink-soft";

export default function ResumeEditorForm({ resume }: { resume: ResumeData }) {
  const [mode, setMode] = useState<"form" | "json">("form");
  const [state, formAction, pending] = useActionState(
    saveResumeAction,
    initialState,
  );
  const [jsonState, jsonFormAction, jsonPending] = useActionState(
    saveResumeJsonAction,
    initialJsonState,
  );
  const [experience, setExperience] = useState<ResumeExperience[]>(
    resume.experience,
  );
  const [education, setEducation] = useState<ResumeEducation[]>(
    resume.education,
  );
  const [projects, setProjects] = useState<ResumeProject[]>(resume.projects);
  const [skills, setSkills] = useState<ResumeSkill[]>(resume.skills);

  const modeButtonClass = (active: boolean) =>
    `border px-3 py-1 font-sans text-xs transition-colors ${
      active
        ? "border-ink bg-ink text-paper"
        : "border-line text-ink-soft hover:border-accent hover:text-accent"
    }`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode("form")}
          className={modeButtonClass(mode === "form")}
        >
          폼 편집
        </button>
        <button
          type="button"
          onClick={() => setMode("json")}
          className={modeButtonClass(mode === "json")}
        >
          JSON 편집
        </button>
      </div>

      {mode === "json" ? (
        <form action={jsonFormAction} className="flex flex-col gap-4">
          <textarea
            name="json"
            defaultValue={JSON.stringify(resume, null, 2)}
            spellCheck={false}
            rows={32}
            className="w-full resize-y border border-line bg-transparent p-4 font-mono text-xs leading-relaxed text-ink outline-none transition-colors focus:border-accent"
          />
          {jsonState?.error && (
            <p className="text-sm text-accent" aria-live="polite">
              {jsonState.error}
            </p>
          )}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={jsonPending}
              className="border border-ink bg-ink px-6 py-3 font-sans text-sm tracking-wide text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {jsonPending ? "저장 중..." : "저장"}
            </button>
            <Link
              href="/resume"
              className="font-sans text-sm text-ink-soft transition-colors hover:text-accent"
            >
              취소
            </Link>
          </div>
        </form>
      ) : (
        <form action={formAction} className="flex flex-col gap-14">
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className={labelClass}>
                이름 *
              </label>
              <input
                id="name"
                name="name"
                defaultValue={resume.name}
                required
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="title" className={labelClass}>
                직함 / 한 줄 소개
              </label>
              <input
                id="title"
                name="title"
                defaultValue={resume.title}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className={labelClass}>
                이메일
              </label>
              <input
                id="email"
                name="email"
                defaultValue={resume.email}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className={labelClass}>
                전화번호
              </label>
              <input
                id="phone"
                name="phone"
                defaultValue={resume.phone}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="location" className={labelClass}>
                지역
              </label>
              <input
                id="location"
                name="location"
                defaultValue={resume.location}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="website" className={labelClass}>
                웹사이트 / 링크
              </label>
              <input
                id="website"
                name="website"
                defaultValue={resume.website}
                className={inputClass}
              />
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <label className={labelClass}>자기소개</label>
            <RichTextEditor name="summary" defaultValue={resume.summary} />
          </section>

          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg text-ink">경력</h2>
              <button
                type="button"
                onClick={() =>
                  setExperience([...experience, emptyExperience()])
                }
                className="border border-line px-3 py-1 text-xs text-ink-soft transition-colors hover:border-accent hover:text-accent"
              >
                + 항목 추가
              </button>
            </div>
            {experience.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-4 border border-line p-5 sm:grid-cols-2"
              >
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>회사</label>
                  <input
                    name={`experience.${index}.company`}
                    defaultValue={item.company}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>직책</label>
                  <input
                    name={`experience.${index}.role`}
                    defaultValue={item.role}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>기간</label>
                  <input
                    name={`experience.${index}.period`}
                    defaultValue={item.period}
                    placeholder="2022.01 — 2024.03"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className={labelClass}>설명</label>
                  <RichTextEditor
                    name={`experience.${index}.description`}
                    defaultValue={item.description}
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExperience(experience.filter((_, i) => i !== index))
                    }
                    className="text-xs text-mist transition-colors hover:text-accent"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg text-ink">프로젝트</h2>
              <button
                type="button"
                onClick={() => setProjects([...projects, emptyProject()])}
                className="border border-line px-3 py-1 text-xs text-ink-soft transition-colors hover:border-accent hover:text-accent"
              >
                + 항목 추가
              </button>
            </div>
            {projects.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-4 border border-line p-5 sm:grid-cols-2"
              >
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>프로젝트명</label>
                  <input
                    name={`projects.${index}.title`}
                    defaultValue={item.title}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>기간</label>
                  <input
                    name={`projects.${index}.period`}
                    defaultValue={item.period}
                    placeholder="2023.06 — 2023.09"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>일반 링크 (선택)</label>
                  <input
                    name={`projects.${index}.link`}
                    defaultValue={item.link}
                    placeholder="https://..."
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>GitHub 링크 (선택)</label>
                  <input
                    name={`projects.${index}.githubLink`}
                    defaultValue={item.githubLink}
                    placeholder="https://github.com/..."
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className={labelClass}>설명</label>
                  <RichTextEditor
                    name={`projects.${index}.description`}
                    defaultValue={item.description}
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={() =>
                      setProjects(projects.filter((_, i) => i !== index))
                    }
                    className="text-xs text-mist transition-colors hover:text-accent"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg text-ink">학력</h2>
              <button
                type="button"
                onClick={() => setEducation([...education, emptyEducation()])}
                className="border border-line px-3 py-1 text-xs text-ink-soft transition-colors hover:border-accent hover:text-accent"
              >
                + 항목 추가
              </button>
            </div>
            {education.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-4 border border-line p-5 sm:grid-cols-2"
              >
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>학교</label>
                  <input
                    name={`education.${index}.school`}
                    defaultValue={item.school}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>학위 / 전공</label>
                  <input
                    name={`education.${index}.degree`}
                    defaultValue={item.degree}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className={labelClass}>기간</label>
                  <input
                    name={`education.${index}.period`}
                    defaultValue={item.period}
                    placeholder="2018.03 — 2022.02"
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEducation(education.filter((_, i) => i !== index))
                    }
                    className="text-xs text-mist transition-colors hover:text-accent"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg text-ink">기술</h2>
              <button
                type="button"
                onClick={() => setSkills([...skills, emptySkill()])}
                className="border border-line px-3 py-1 text-xs text-ink-soft transition-colors hover:border-accent hover:text-accent"
              >
                + 항목 추가
              </button>
            </div>
            {skills.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-4 border border-line p-5 sm:grid-cols-3"
              >
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>분류</label>
                  <input
                    name={`skills.${index}.category`}
                    defaultValue={item.category}
                    placeholder="Language"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>기술명</label>
                  <input
                    name={`skills.${index}.name`}
                    defaultValue={item.name}
                    placeholder="TypeScript"
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>숙련도</label>
                  <select
                    name={`skills.${index}.level`}
                    defaultValue={item.level}
                    className={inputClass}
                  >
                    {SKILL_LEVEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <button
                    type="button"
                    onClick={() =>
                      setSkills(skills.filter((_, i) => i !== index))
                    }
                    className="text-xs text-mist transition-colors hover:text-accent"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </section>

          {state?.error && (
            <p className="text-sm text-accent" aria-live="polite">
              {state.error}
            </p>
          )}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={pending}
              className="border border-ink bg-ink px-6 py-3 font-sans text-sm tracking-wide text-paper transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {pending ? "저장 중..." : "저장"}
            </button>
            <Link
              href="/resume"
              className="font-sans text-sm text-ink-soft transition-colors hover:text-accent"
            >
              취소
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
