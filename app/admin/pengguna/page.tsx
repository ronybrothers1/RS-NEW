import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { UserPlus, Shield, User } from "lucide-react";
import { getCurrentDbUser } from "@/lib/current-authz";
import { redirect } from "next/navigation";
import DeletePenggunaButton from "./components/DeletePenggunaButton";

const PAGE_SIZE = 50;

function parsePositiveInteger(
  value: string | string[] | undefined,
) {
  const firstValue =
    Array.isArray(value)
      ? value[0]
      : value;

  const parsed =
    Number.parseInt(
      firstValue ?? "1",
      10,
    );

  return Number.isSafeInteger(parsed) &&
    parsed > 0
    ? parsed
    : 1;
}

export default async function PenggunaPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string | string[];
  }>;
}) {
  const currentUser = await getCurrentDbUser();
  if (!currentUser || currentUser.role !== 'ADMIN') {
    redirect('/admin/dashboard');
  }

  const rawSearchParams =
    await searchParams;

  const currentPage =
    parsePositiveInteger(
      rawSearchParams.page,
    );

  const offset =
    (currentPage - 1) *
    PAGE_SIZE;

  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(
      desc(users.createdAt),
      desc(users.id),
    )
    .limit(PAGE_SIZE + 1)
    .offset(offset);

  const hasPrevious =
    currentPage > 1;

  const hasNext =
    userRows.length >
    PAGE_SIZE;

  const allUsers =
    userRows.slice(
      0,
      PAGE_SIZE,
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Pengguna</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola akun pengguna, operator, dan administrator yayasan.</p>
        </div>
        <Link 
          href="/admin/pengguna/tambah" 
          className="inline-flex items-center justify-center px-4 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Tambah Pengguna
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className="px-6 py-3">Pengguna</th>
                <th scope="col" className="px-6 py-3 text-center">Peran (Role)</th>
                <th scope="col" className="px-6 py-3">Terdaftar</th>
                <th scope="col" className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((userRecord) => (
                <tr key={userRecord.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                        {userRecord.role === 'ADMIN' ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{userRecord.name}</div>
                        <div className="text-xs text-slate-500">{userRecord.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      userRecord.role === 'ADMIN' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {userRecord.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                    {new Date(userRecord.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {currentUser.id !== userRecord.id && (
                      <DeletePenggunaButton id={userRecord.id} />
                    )}
                    {currentUser.id === userRecord.id && (
                      <span className="text-xs text-slate-400 italic">Akun Anda</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(hasPrevious || hasNext) && (
        <nav
          aria-label="Navigasi halaman pengguna admin"
          className="flex items-center justify-between gap-4"
        >
          <div className="text-sm text-slate-500">
            Halaman {currentPage}
          </div>

          <div className="flex items-center gap-2">
            {hasPrevious ? (
              <Link
                href={`/admin/pengguna?page=${currentPage - 1}`}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Sebelumnya
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex min-h-10 cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-400"
              >
                Sebelumnya
              </span>
            )}

            {hasNext ? (
              <Link
                href={`/admin/pengguna?page=${currentPage + 1}`}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Berikutnya
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="inline-flex min-h-10 cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-400"
              >
                Berikutnya
              </span>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
