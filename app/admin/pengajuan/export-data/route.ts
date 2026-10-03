import {
  and,
  asc,
  eq,
  ilike,
  ne,
  or,
  type SQL,
} from "drizzle-orm";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

import type { AssistanceApplicationStatus } from "@/lib/assistance";
import { getCurrentStaffUser } from "@/lib/current-authz";
import { db } from "@/src/db";
import {
  assistanceApplications,
  programs,
  users,
} from "@/src/db/schema";

export const dynamic = "force-dynamic";

const reviewStatuses: AssistanceApplicationStatus[] = [
  "SUBMITTED",
  "NEEDS_REVISION",
  "APPROVED",
  "REJECTED",
];

export async function GET(request: NextRequest) {
  const staff = await getCurrentStaffUser();

  if (!staff) {
    return NextResponse.json(
      { error: "Akses ditolak." },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);

  const rawStatus = String(
    searchParams.get("status") || "",
  ).trim();

  const status = reviewStatuses.includes(
    rawStatus as AssistanceApplicationStatus,
  )
    ? (rawStatus as AssistanceApplicationStatus)
    : "";

  const programId = String(
    searchParams.get("program") || "",
  ).trim();

  const q = String(
    searchParams.get("q") || "",
  ).trim();

  const filters: SQL[] = [
    ne(assistanceApplications.status, "DRAFT"),
  ];

  if (status) {
    filters.push(
      eq(assistanceApplications.status, status),
    );
  }

  if (programId) {
    filters.push(
      eq(
        assistanceApplications.programId,
        programId,
      ),
    );
  }

  if (q) {
    const search = `%${q}%`;
    const condition = or(
      ilike(assistanceApplications.title, search),
      ilike(
        assistanceApplications.beneficiaryName,
        search,
      ),
      ilike(assistanceApplications.village, search),
      ilike(
        assistanceApplications.subdistrict,
        search,
      ),
      ilike(users.name, search),
      ilike(programs.name, search),
    );
    if (condition) {
      filters.push(condition);
    }
  }

  const rows = await db
    .select({
      id: assistanceApplications.id,
      title: assistanceApplications.title,
      beneficiaryName:
        assistanceApplications.beneficiaryName,
      applicantName: users.name,
      programName: programs.name,
      village: assistanceApplications.village,
      subdistrict:
        assistanceApplications.subdistrict,
      regency: assistanceApplications.regency,
      targetAmount:
        assistanceApplications.targetAmount,
      status: assistanceApplications.status,
      submittedAt:
        assistanceApplications.submittedAt,
    })
    .from(assistanceApplications)
    .innerJoin(
      users,
      eq(
        assistanceApplications.applicantId,
        users.id,
      ),
    )
    .innerJoin(
      programs,
      eq(
        assistanceApplications.programId,
        programs.id,
      ),
    )
    .where(and(...filters))
    .orderBy(
      asc(assistanceApplications.submittedAt),
      asc(assistanceApplications.id),
    );

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      filters: { status, programId, q },
      rows: rows.map((row) => ({
        ...row,
        submittedAt: row.submittedAt
          ? row.submittedAt.toISOString()
          : null,
      })),
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}