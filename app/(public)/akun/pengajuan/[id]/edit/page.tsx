import {
  ArrowLeft,
} from "lucide-react";
import {
  and,
  asc,
  eq,
} from "drizzle-orm";
import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import {
  updateAssistanceApplication,
} from "@/app/actions/assistance";
import {
  auth,
} from "@/auth";
import {
  db,
} from "@/src/db";
import {
  assistanceApplicationPhotos,
  assistanceApplications,
  programs,
  users,
} from "@/src/db/schema";

import AssistanceApplicationForm from "../../components/AssistanceApplicationForm";

export const dynamic =
  "force-dynamic";

export default async function EditAssistanceApplicationPage({
  params,
}: {
  params:
    Promise<{
      id: string;
    }>;
}) {
  const session =
    await auth();

  if (
    !session?.user?.id
  ) {
    redirect(
      "/login",
    );
  }

  const role = (
    session.user as {
      role?: string;
    }
  ).role;

  if (
    role !== "USER"
  ) {
    redirect(
      "/admin/dashboard",
    );
  }

  const [user] =
    await db
      .select({
        id: users.id,
        phone:
          users.phone,
        emailVerifiedAt:
          users.emailVerifiedAt,
      })
      .from(users)
      .where(
        eq(
          users.id,
          session.user.id,
        ),
      )
      .limit(1);

  if (!user) {
    redirect(
      "/login",
    );
  }

  if (
    !user.emailVerifiedAt
  ) {
    redirect(
      "/verifikasi-email",
    );
  }

  const {
    id,
  } = await params;

  const [
    application,
  ] =
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
        applicantRelationship:
          assistanceApplications.applicantRelationship,
        contactWhatsapp:
          assistanceApplications.contactWhatsapp,
        village:
          assistanceApplications.village,
        subdistrict:
          assistanceApplications.subdistrict,
        regency:
          assistanceApplications.regency,
        detailedAddress:
          assistanceApplications.detailedAddress,
        conditionDescription:
          assistanceApplications.conditionDescription,
        targetAmount:
          assistanceApplications.targetAmount,
        programData:
          assistanceApplications.programData,
        truthConsent:
          assistanceApplications.truthConsent,
        status:
          assistanceApplications.status,
      })
      .from(
        assistanceApplications,
      )
      .where(
        and(
          eq(
            assistanceApplications.id,
            id,
          ),
          eq(
            assistanceApplications.applicantId,
            user.id,
          ),
        ),
      )
      .limit(1);

  if (!application) {
    notFound();
  }

  if (
    application.status !==
      "DRAFT" &&
    application.status !==
      "NEEDS_REVISION"
  ) {
    redirect(
      `/akun/pengajuan/${application.id}`,
    );
  }

  const programOptions =
    await db
      .select({
        id:
          programs.id,
        name:
          programs.name,
        description:
          programs.description,
        status:
          programs.status,
      })
      .from(programs)
      .orderBy(
        asc(
          programs.name,
        ),
      );

  const selectablePrograms =
    programOptions
      .filter(
        (program) =>
          program.status ===
            "ACTIVE" ||
          program.id ===
            application.programId,
      )
      .map(
        ({
          id:
            programId,
          name,
          description,
        }) => ({
          id:
            programId,
          name,
          description,
        }),
      );

  const photos =
    await db
      .select({
        id:
          assistanceApplicationPhotos.id,
        url:
          assistanceApplicationPhotos.imageUrl,
        pathname:
          assistanceApplicationPhotos.storagePath,
      })
      .from(
        assistanceApplicationPhotos,
      )
      .where(
        eq(
          assistanceApplicationPhotos.applicationId,
          application.id,
        ),
      )
      .orderBy(
        asc(
          assistanceApplicationPhotos.sortOrder,
        ),
      );

  const safePhotos =
    photos.flatMap(
      (photo) =>
        photo.pathname
          ? [
              {
                id:
                  photo.id,
                url:
                  photo.url,
                pathname:
                  photo.pathname,
              },
            ]
          : [],
    );

  const programData =
    (
      application.programData &&
      typeof application.programData ===
        "object"
        ? application.programData
        : {}
    ) as Record<
      string,
      string
    >;

  const action =
    updateAssistanceApplication.bind(
      null,
      application.id,
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href={`/akun/pengajuan/${application.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Detail Pengajuan
          </Link>

          <p className="mt-5 text-sm font-semibold text-teal-700">
            Perbaiki Pengajuan
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Lengkapi atau Ubah Data
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Periksa kembali seluruh data sebelum dikirim. Jika pengurus meminta revisi, gunakan catatan pada halaman detail sebagai acuan.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <AssistanceApplicationForm
          userId={
            user.id
          }
          programs={
            selectablePrograms
          }
          defaultWhatsapp={
            user.phone ||
            ""
          }
          initialApplication={{
            programId:
              application.programId,
            title:
              application.title,
            beneficiaryName:
              application.beneficiaryName,
            applicantRelationship:
              application.applicantRelationship,
            contactWhatsapp:
              application.contactWhatsapp,
            village:
              application.village,
            subdistrict:
              application.subdistrict,
            regency:
              application.regency,
            detailedAddress:
              application.detailedAddress,
            conditionDescription:
              application.conditionDescription,
            targetAmount:
              application.targetAmount,
            programData,
            truthConsent:
              application.truthConsent,
            photos:
              safePhotos,
          }}
          action={
            action
          }
        />
      </main>
    </div>
  );
}
