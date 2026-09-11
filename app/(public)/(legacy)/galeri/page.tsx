import {
  permanentRedirect,
} from "next/navigation";

export default function LegacyGalleryPage() {
  permanentRedirect(
    "/kegiatan",
  );
}
