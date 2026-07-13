"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthAction } from "@/lib/auth";
import {
  addPhoto,
  deletePhoto,
  UnsupportedImageTypeError,
} from "@/lib/gallery";

export type UploadPhotosState = {
  error?: string;
};

export async function uploadPhotosAction(
  _prevState: UploadPhotosState,
  formData: FormData
): Promise<UploadPhotosState> {
  await requireAuthAction();

  const caption = String(formData.get("caption") ?? "").trim();
  const files = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return { error: "업로드할 사진을 선택해주세요." };
  }

  try {
    for (const file of files) {
      await addPhoto(file, caption);
    }
  } catch (err) {
    if (err instanceof UnsupportedImageTypeError) {
      return { error: err.message };
    }
    throw err;
  }

  revalidatePath("/gallery");
  redirect("/gallery");
}

export async function deletePhotoAction(id: string) {
  await requireAuthAction();
  await deletePhoto(id);
  revalidatePath("/gallery");
}
