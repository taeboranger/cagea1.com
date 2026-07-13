import "server-only";
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
  description: string;
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
  skills: string[];
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
  updatedAt: new Date().toISOString(),
};

async function ensureFile() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DATA_FILE, "utf-8");
  } catch {
    await writeFile(DATA_FILE, JSON.stringify(DEFAULT_RESUME, null, 2), "utf-8");
  }
}

export async function getResume(): Promise<ResumeData> {
  await ensureFile();
  const raw = await readFile(DATA_FILE, "utf-8");
  return { ...DEFAULT_RESUME, ...JSON.parse(raw) };
}

export async function saveResume(data: ResumeData): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const payload: ResumeData = { ...data, updatedAt: new Date().toISOString() };
  await writeFile(DATA_FILE, JSON.stringify(payload, null, 2), "utf-8");
}
