"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthAction } from "@/lib/auth";
import {
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
  fields: (keyof T)[]
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
  formData: FormData
): Promise<SaveResumeState> {
  await requireAuthAction();

  const name = String(formData.get("name") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  if (!name) {
    return { error: "이름을 입력해주세요." };
  }

  const experience = collectRows<
    Omit<ResumeExperience, "id"> & { id?: string }
  >(formData, "experience", ["company", "role", "period", "description"]).map(
    (row) => ({ id: randomUUID(), ...row })
  );

  const education = collectRows<Omit<ResumeEducation, "id"> & { id?: string }>(
    formData,
    "education",
    ["school", "degree", "period"]
  ).map((row) => ({ id: randomUUID(), ...row }));

  const projects = collectRows<Omit<ResumeProject, "id"> & { id?: string }>(
    formData,
    "projects",
    ["title", "period", "link", "description"]
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
    updatedAt: "",
  };

  await saveResume(data);
  revalidatePath("/resume");
  redirect("/resume");
}
