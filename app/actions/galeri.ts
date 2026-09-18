"use server";

import {
  getCurrentStaffUser,
} from "@/lib/current-authz";

type GalleryActionResult = {
  success: boolean;
  error: string | null;
};

const GALLERY_DISABLED_MESSAGE =
  "Galeri lama telah dinonaktifkan. Gunakan modul Kegiatan untuk dokumentasi baru.";

async function rejectGalleryMutation(): Promise<GalleryActionResult> {
  const staff =
    await getCurrentStaffUser();

  if (!staff) {
    return {
      success: false,
      error:
        "Unauthorized",
    };
  }

  return {
    success: false,
    error:
      GALLERY_DISABLED_MESSAGE,
  };
}

export async function createGaleri(
  prevState: GalleryActionResult,
  formData: FormData,
) {
  void prevState;
  void formData;

  return rejectGalleryMutation();
}

export async function deleteGaleri(
  id: string,
) {
  void id;

  return rejectGalleryMutation();
}

export async function togglePublishGaleri(
  id: string,
  currentStatus: boolean,
) {
  void id;
  void currentStatus;

  return rejectGalleryMutation();
}