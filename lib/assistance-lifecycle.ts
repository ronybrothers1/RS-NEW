import type {
  AssistanceApplicationStatus,
} from "@/lib/assistance";

const ASSISTANCE_REGISTRATION_PREFIX =
  "RS-PENG-";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function formatAssistanceRegistrationNumber(
  applicationId: string,
) {
  return `${ASSISTANCE_REGISTRATION_PREFIX}${applicationId.toUpperCase()}`;
}

export function parseAssistanceRegistrationNumber(
  value: string,
) {
  const normalized =
    value.trim();

  const pattern =
    /^RS-PENG-([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

  const match =
    pattern.exec(
      normalized,
    );

  if (
    !match ||
    !UUID_PATTERN.test(
      match[1],
    )
  ) {
    return null;
  }

  return match[1].toLowerCase();
}

export function getAssistanceProgress({
  status,
  hasCampaign,
  campaignFunded,
  scheduledAt,
  completedAt,
}: {
  status:
    AssistanceApplicationStatus;
  hasCampaign:
    boolean;
  campaignFunded:
    boolean;
  scheduledAt:
    Date | null;
  completedAt:
    Date | null;
}) {
  if (
    status ===
    "DRAFT"
  ) {
    return {
      label:
        "Draf",
      next:
        "Lengkapi data pengajuan lalu kirim untuk diverifikasi.",
    };
  }

  if (
    status ===
    "SUBMITTED"
  ) {
    return {
      label:
        "Menunggu verifikasi",
      next:
        "Pengurus akan memeriksa data dan menentukan hasil verifikasi.",
    };
  }

  if (
    status ===
    "NEEDS_REVISION"
  ) {
    return {
      label:
        "Perlu diperbaiki",
      next:
        "Perbaiki pengajuan sesuai catatan pengurus lalu kirim kembali.",
    };
  }

  if (
    status ===
    "REJECTED"
  ) {
    return {
      label:
        "Tidak disetujui",
      next:
        "Lihat catatan pengurus untuk mengetahui hasil verifikasi.",
    };
  }

  if (completedAt) {
    return {
      label:
        "Telah dilaksanakan",
      next:
        "Proses pengajuan telah selesai.",
    };
  }

  if (scheduledAt) {
    return {
      label:
        "Dijadwalkan",
      next:
        "Menunggu pelaksanaan kegiatan sesuai jadwal yang telah ditetapkan.",
    };
  }

  if (
    hasCampaign &&
    !campaignFunded
  ) {
    return {
      label:
        "Menunggu pemenuhan dana",
      next:
        "Kampanye masih mengumpulkan dana sampai target terpenuhi.",
    };
  }

  if (
    hasCampaign &&
    campaignFunded
  ) {
    return {
      label:
        "Dana terpenuhi",
      next:
        "Menunggu pengurus menetapkan jadwal pelaksanaan.",
    };
  }

  return {
    label:
      "Disetujui — pendanaan kas",
    next:
      "Menunggu pengurus menetapkan jadwal pelaksanaan.",
  };
}