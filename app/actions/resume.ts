"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthAction } from "@/lib/auth";
import {
  getResume,
  saveResume,
  type ResumeData,
  type ResumeEducation,
  type ResumeExperience,
  type ResumeProject,
} from "@/lib/resume";

export type SaveResumeState = {
  error?: string;
};

function collectRows<T extends Record<string, string>>(
  formData: FormData,
  prefix: string,
  fields: (keyof T)[],
): T[] {
  const indices = new Set<number>();
  const pattern = new RegExp(`^${prefix}\\.(\\d+)\\.`);
  for (const key of formData.keys()) {
    const match = key.match(pattern);
    if (match) indices.add(Number(match[1]));
  }

  return Array.from(indices)
    .sort((a, b) => a - b)
    .map((index) => {
      const row = {} as T;
      for (const field of fields) {
        row[field] = (formData.get(`${prefix}.${index}.${String(field)}`) ??
          "") as T[keyof T];
      }
      return row;
    });
}

export async function saveResumeAction(
  _prevState: SaveResumeState,
  formData: FormData,
): Promise<SaveResumeState> {
  await requireAuthAction();
  const current = await getResume();

  const name = String(formData.get("name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  if (!name) {
    return { error: "이름을 입력해주세요." };
  }

  const experience = collectRows<
    Omit<ResumeExperience, "id"> & { id?: string }
  >(formData, "experience", ["company", "role", "period", "description"]).map(
    (row) => ({ id: randomUUID(), ...row }),
  );

  const education = collectRows<Omit<ResumeEducation, "id"> & { id?: string }>(
    formData,
    "education",
    ["school", "degree", "period"],
  ).map((row) => ({ id: randomUUID(), ...row }));

  const projects = collectRows<Omit<ResumeProject, "id"> & { id?: string }>(
    formData,
    "projects",
    ["title", "period", "link", "description"],
  ).map((row) => ({ id: randomUUID(), ...row }));

  const skills = String(formData.get("skills") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const data: ResumeData = {
    name,
    title,
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    location: String(formData.get("location") ?? "").trim(),
    website: String(formData.get("website") ?? "").trim(),
    summary: String(formData.get("summary") ?? "").trim(),
    experience,
    education,
    projects,
    skills,
    isPublic: current.isPublic,
    updatedAt: "",
  };

  await saveResume(data);
  revalidatePath("/resume");
  redirect("/resume");
}

export type SaveResumeJsonState = {
  error?: string;
};

function normalizeRows<T extends { id: string }>(
  value: unknown,
  fields: (keyof T)[],
): T[] {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    const source = (row && typeof row === "object" ? row : {}) as Record<
      string,
      unknown
    >;
    const out = {
      id: typeof source.id === "string" && source.id ? source.id : randomUUID(),
    } as T;
    for (const field of fields) {
      const raw = source[field as string];
      out[field] = (typeof raw === "string" ? raw : "") as T[typeof field];
    }
    return out;
  });
}

export async function saveResumeJsonAction(
  _prevState: SaveResumeJsonState,
  formData: FormData,
): Promise<SaveResumeJsonState> {
  await requireAuthAction();
  const current = await getResume();

  const raw = String(formData.get("json") ?? "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "올바른 JSON 형식이 아닙니다." };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { error: "JSON 객체 형식이어야 합니다." };
  }
  const obj = parsed as Record<string, unknown>;

  const name = typeof obj.name === "string" ? obj.name.trim() : "";
  if (!name) {
    return { error: "이름(name) 필드를 입력해주세요." };
  }

  const data: ResumeData = {
    name,
    title: typeof obj.title === "string" ? obj.title : "",
    email: typeof obj.email === "string" ? obj.email : "",
    phone: typeof obj.phone === "string" ? obj.phone : "",
    location: typeof obj.location === "string" ? obj.location : "",
    website: typeof obj.website === "string" ? obj.website : "",
    summary: typeof obj.summary === "string" ? obj.summary : "",
    experience: normalizeRows<ResumeExperience>(obj.experience, [
      "company",
      "role",
      "period",
      "description",
    ]),
    education: normalizeRows<ResumeEducation>(obj.education, [
      "school",
      "degree",
      "period",
    ]),
    projects: normalizeRows<ResumeProject>(obj.projects, [
      "title",
      "period",
      "link",
      "description",
    ]),
    skills: Array.isArray(obj.skills)
      ? obj.skills.filter((s): s is string => typeof s === "string")
      : [],
    isPublic:
      typeof obj.isPublic === "boolean" ? obj.isPublic : current.isPublic,
    updatedAt: "",
  };

  await saveResume(data);
  revalidatePath("/resume");
  redirect("/resume");
}

export async function toggleResumeVisibilityAction() {
  await requireAuthAction();
  const current = await getResume();
  await saveResume({ ...current, isPublic: !current.isPublic });
  revalidatePath("/resume");
  revalidatePath("/");
}
