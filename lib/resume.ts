import "server-only";
import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export interface ResumeExperience {
  id: string;
  company: string;
  role: string;
  period: string;
  description: string;
}

export interface ResumeEducation {
  id: string;
  school: string;
  degree: string;
  period: string;
}

export interface ResumeProject {
  id: string;
  title: string;
  period: string;
  link: string;
  githubLink: string;
  description: string;
}

export const SKILL_LEVELS = ["proficient", "intermediate", "basic"] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export function isSkillLevel(value: unknown): value is SkillLevel {
  return (
    typeof value === "string" &&
    (SKILL_LEVELS as readonly string[]).includes(value)
  );
}

export interface ResumeSkill {
  id: string;
  category: string;
  name: string;
  level: SkillLevel;
}

// Accepts either a structured skill object or a legacy "Category: skill"
// string (from before per-skill proficiency levels existed) and normalizes
// both into a ResumeSkill. Returns null for entries with no usable name.
export function normalizeSkillEntry(raw: unknown): ResumeSkill | null {
  if (typeof raw === "string") {
    const sep = raw.indexOf(":");
    const category = sep === -1 ? "기타" : raw.slice(0, sep).trim();
    const name = (sep === -1 ? raw : raw.slice(sep + 1)).trim();
    if (!name) return null;
    return { id: randomUUID(), category, name, level: "proficient" };
  }
  if (raw && typeof raw === "object") {
    const source = raw as Record<string, unknown>;
    const name = typeof source.name === "string" ? source.name.trim() : "";
    if (!name) return null;
    return {
      id: typeof source.id === "string" && source.id ? source.id : randomUUID(),
      category:
        typeof source.category === "string" && source.category.trim()
          ? source.category.trim()
          : "기타",
      name,
      level: isSkillLevel(source.level) ? source.level : "proficient",
    };
  }
  return null;
}

export interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  projects: ResumeProject[];
  skills: ResumeSkill[];
  isPublic: boolean;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "resume.json");

const DEFAULT_RESUME: ResumeData = {
  name: "cagea1",
  title: "직함 / 한 줄 소개",
  email: "",
  phone: "",
  location: "",
  website: "",
  summary: "자기소개를 이곳에 작성하세요.",
  experience: [],
  education: [],
  projects: [],
  skills: [],
  isPublic: true,
  updatedAt: new Date().toISOString(),
};

async function ensureFile() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DATA_FILE, "utf-8");
  } catch {
    await writeFile(
      DATA_FILE,
      JSON.stringify(DEFAULT_RESUME, null, 2),
      "utf-8",
    );
  }
}

export async function getResume(): Promise<ResumeData> {
  await ensureFile();
  const raw = await readFile(DATA_FILE, "utf-8");
  const parsed = JSON.parse(raw);
  const skills = Array.isArray(parsed.skills)
    ? parsed.skills
        .map(normalizeSkillEntry)
        .filter((s: ResumeSkill | null): s is ResumeSkill => s !== null)
    : [];
  return { ...DEFAULT_RESUME, ...parsed, skills };
}

export async function saveResume(data: ResumeData): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const payload: ResumeData = { ...data, updatedAt: new Date().toISOString() };
  await writeFile(DATA_FILE, JSON.stringify(payload, null, 2), "utf-8");
}
