import "server-only";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export type NoteVisibility = "public" | "private";

export interface Note {
  id: string;
  content: string;
  visibility: NoteVisibility;
  createdAt: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "notes.json");

async function ensureFile() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DATA_FILE, "utf-8");
  } catch {
    await writeFile(DATA_FILE, "[]", "utf-8");
  }
}

async function readAll(): Promise<Note[]> {
  await ensureFile();
  const raw = await readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw) as Note[];
}

async function writeAll(notes: Note[]) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(notes, null, 2), "utf-8");
}

export async function getNotes(includePrivate: boolean): Promise<Note[]> {
  const notes = await readAll();
  const visible = includePrivate
    ? notes
    : notes.filter((note) => note.visibility === "public");
  return visible.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getNote(id: string): Promise<Note | null> {
  const notes = await readAll();
  return notes.find((note) => note.id === id) ?? null;
}

export async function addNote(
  content: string,
  visibility: NoteVisibility
): Promise<Note> {
  const notes = await readAll();
  const now = new Date().toISOString();
  const note: Note = {
    id: randomUUID(),
    content,
    visibility,
    createdAt: now,
    updatedAt: now,
  };
  notes.push(note);
  await writeAll(notes);
  return note;
}

export async function updateNote(
  id: string,
  content: string,
  visibility: NoteVisibility
): Promise<void> {
  const notes = await readAll();
  const index = notes.findIndex((note) => note.id === id);
  if (index === -1) return;
  notes[index] = {
    ...notes[index],
    content,
    visibility,
    updatedAt: new Date().toISOString(),
  };
  await writeAll(notes);
}

export async function deleteNote(id: string): Promise<void> {
  const notes = await readAll();
  await writeAll(notes.filter((note) => note.id !== id));
}
