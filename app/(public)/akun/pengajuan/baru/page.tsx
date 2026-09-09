import {
  ArrowLeft,
} from "lucide-react";
import {
  asc,
  eq,
} from "drizzle-orm";
import Link from "next/link";
import {
  redirect,
} from "next/navigation";

import {
  createAssistanceApplication,
} from "@/app/actions/assistance";
import {
  auth,
} from "@/auth";
import {
  db,
} from "@/src/db";
import {
  programs,
  users,
} from "@/src/db/schema";

import AssistanceApplicationForm from "../components/AssistanceApplicationForm";

export const dynamic =
  "force-dynamic";

export default async function NewAssistanceApplicationPage() {
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

  const activePrograms =
    await db
      .select({
        id:
          programs.id,
        name:
          programs.name,
        description:
          programs.description,
      })
      .from(programs)
      .where(
        eq(
          programs.status,
          "ACTIVE",
        ),
      )
      .orderBy(
        asc(
          programs.name,
        ),
      );

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            href="/akun/pengajuan"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Pengajuan Saya
          </Link>

          <p className="mt-5 text-sm font-semibold text-teal-700">
            Form Pengajuan
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Ajukan Calon Penerima Bantuan
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Isi data secukupnya namun jelas. Informasi pribadi dan alamat lengkap digunakan untuk proses internal dan verifikasi.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {activePrograms.length ===
        0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
            Belum ada program aktif yang dapat dipilih. Silakan mencoba kembali setelah pengurus mengaktifkan program.
          </div>
        ) : (
          <AssistanceApplicationForm
            userId={
              user.id
            }
            programs={
              activePrograms
            }
            defaultWhatsapp={
              user.phone ||
              ""
            }
            action={
              createAssistanceApplication
            }
          />
        )}
      </main>
    </div>
  );
}
