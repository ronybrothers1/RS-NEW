import {
  config,
} from "dotenv";
import {
  eq,
} from "drizzle-orm";

config({
  path:
    ".env.local",
});

async function main() {

const {
  db,
} =
  await import(
    "../src/db"
  );

const {
  assistanceApplications,
  auditLogs,
  campaigns,
  users,
} =
  await import(
    "../src/db/schema"
  );

function toSlug(
  title: string,
  id: string,
) {
  const base =
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(
        /[\u0300-\u036f]/g,
        "",
      )
      .replace(
        /[^a-z0-9]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "",
      )
      .slice(
        0,
        90,
      ) ||
    "bantu-mereka";

  return `${base}-${id.slice(0, 8)}`;
}

const approved =
  await db
    .select({
      id:
        assistanceApplications.id,
      programId:
        assistanceApplications.programId,
      title:
        assistanceApplications.title,
      beneficiaryName:
        assistanceApplications.beneficiaryName,
      subdistrict:
        assistanceApplications.subdistrict,
      regency:
        assistanceApplications.regency,
      targetAmount:
        assistanceApplications.targetAmount,
      reviewedBy:
        assistanceApplications.reviewedBy,
    })
    .from(
      assistanceApplications,
    )
    .where(
      eq(
        assistanceApplications.status,
        "APPROVED",
      ),
    );

const existing =
  await db
    .select({
      applicationId:
        campaigns.applicationId,
    })
    .from(campaigns);

const existingIds =
  new Set(
    existing.map(
      (item) =>
        item.applicationId,
    ),
  );

let fallbackStaffId:
  string | null = null;

if (
  approved.some(
    (item) =>
      !item.reviewedBy,
  )
) {
  const [
    staff,
  ] =
    await db
      .select({
        id:
          users.id,
      })
      .from(users)
      .where(
        eq(
          users.role,
          "ADMIN",
        ),
      )
      .limit(1);

  fallbackStaffId =
    staff?.id ||
    null;
}

let created =
  0;

for (
  const application of
    approved
) {
  if (
    existingIds.has(
      application.id,
    )
  ) {
    continue;
  }

  const actorId =
    application.reviewedBy ||
    fallbackStaffId;

  if (!actorId) {
    console.warn(
      `Lewati ${application.id}: reviewer/admin tidak ditemukan.`,
    );
    continue;
  }

  const slug =
    toSlug(
      application.title,
      application.id,
    );

  const [
    campaign,
  ] =
    await db
      .insert(campaigns)
      .values({
        applicationId:
          application.id,
        programId:
          application.programId,
        slug,
        title:
          application.title,
        summary: "",
        story: "",
        beneficiaryDisplayName:
          application.beneficiaryName,
        publicLocation:
          [
            application.subdistrict,
            application.regency,
          ]
            .filter(
              Boolean,
            )
            .join(", "),
        targetAmount:
          application.targetAmount,
        status:
          "DRAFT",
        createdBy:
          actorId,
        updatedBy:
          actorId,
      })
      .onConflictDoNothing({
        target:
          campaigns.applicationId,
      })
      .returning({
        id:
          campaigns.id,
      });

  if (campaign) {
    created += 1;

    await db
      .insert(auditLogs)
      .values({
        userId:
          actorId,
        action:
          "BACKFILL_CAMPAIGN_DRAFT",
        tableName:
          "campaigns",
        recordId:
          campaign.id,
        newData: {
          applicationId:
            application.id,
          slug,
          status:
            "DRAFT",
        },
      });
  }
}

console.log(
  `Campaign backfill selesai. Draft baru: ${created}.`,
);
}

main().catch((error) => {
  console.error("Campaign backfill gagal:", error);
  process.exitCode = 1;
});