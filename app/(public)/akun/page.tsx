import {
  CircleUserRound,
  ClipboardList,
  Mail,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/src/db";
import {
  users,
} from "@/src/db/schema";

import AccountLogoutButton from "./components/AccountLogoutButton";

export const dynamic =
  "force-dynamic";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const role = (
    session.user as {
      role?: string;
    }
  ).role;

  if (role !== "USER") {
    redirect(
      "/admin/dashboard",
    );
  }

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      createdAt:
        users.createdAt,
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
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <CircleUserRound className="h-7 w-7" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Akun Pengguna
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                {user.name}
              </h1>
            </div>
          </div>

          <AccountLogoutButton />
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-950">
            Informasi Akun
          </h2>

          <div className="mt-5 space-y-4">
            <div className="flex gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Email
                </p>

                <p className="mt-1 break-all text-sm font-medium text-slate-700">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  WhatsApp
                </p>

                <p className="mt-1 text-sm font-medium text-slate-700">
                  {user.phone ||
                    "Belum diisi"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <ClipboardList className="h-5 w-5" />
          </div>

          <h2 className="mt-5 text-xl font-bold text-slate-950">
            Pengajuan Bantuan
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Dari akun ini Anda akan
            dapat mengajukan calon
            penerima bantuan, melihat
            proses verifikasi, dan
            melengkapi data apabila
            pengurus meminta revisi.
          </p>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">
              Modul Pengajuan Bantuan
              sedang disiapkan pada tahap
              berikutnya.
            </p>
          </div>

          <Link
            href="/"
            className="mt-5 inline-flex text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            Kembali ke beranda
          </Link>
        </section>
      </div>
    </div>
  );
}