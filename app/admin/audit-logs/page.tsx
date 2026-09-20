import { db } from "@/src/db";
import { auditLogs, users } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentDbUser } from "@/lib/current-authz";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

function parsePositiveInteger(
  value:
    | string
    | string[]
    | undefined,
) {
  const raw =
    Array.isArray(value)
      ? value[0]
      : value;

  const parsed =
    Number.parseInt(
      raw ?? "1",
      10,
    );

  return Number.isSafeInteger(parsed) &&
    parsed > 0
    ? parsed
    : 1;
}

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams:
    Promise<{
      page?: string | string[];
    }>;
}) {
  const params =
    await searchParams;

  const currentPage =
    parsePositiveInteger(
      params.page,
    );

  const currentUser =
    await getCurrentDbUser();

  if (
    !currentUser ||
    currentUser.role !== 'ADMIN'
  ) {
    redirect('/admin/dashboard');
  }

  const logRows = await db
    .select({
      log: auditLogs,
      userName: users.name,
      userEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .orderBy(
      desc(auditLogs.createdAt),
      desc(auditLogs.id),
    )
    .limit(PAGE_SIZE + 1)
    .offset(
      (currentPage - 1) *
        PAGE_SIZE,
    );

  const hasNext =
    logRows.length > PAGE_SIZE;

  const logs =
    logRows.slice(
      0,
      PAGE_SIZE,
    );

  const hasPrevious =
    currentPage > 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-slate-500 text-sm mt-1">Lacak semua perubahan yang terjadi pada sistem oleh Admin atau Operator.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-sm">
                <th className="p-4 font-semibold text-slate-700">Waktu</th>
                <th className="p-4 font-semibold text-slate-700">Pengguna</th>
                <th className="p-4 font-semibold text-slate-700">Aksi</th>
                <th className="p-4 font-semibold text-slate-700">Tabel</th>
                <th className="p-4 font-semibold text-slate-700">ID Data</th>
                <th className="p-4 font-semibold text-slate-700">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {logs.map((item) => (
                <tr key={item.log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-600 whitespace-nowrap">
                    {format(new Date(item.log.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-900">
                      {item.log.userId
                        ? item.userName || "Pengguna tidak ditemukan"
                        : "Pengguna telah dihapus"}
                    </div>
                    <div className="text-slate-500 text-xs">{item.userEmail || '-'}</div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${
                      item.log.action.includes('CREATE') || item.log.action.includes('VERIFY') ? 'bg-emerald-100 text-emerald-700' :
                      item.log.action.includes('DELETE') || item.log.action.includes('REJECT') ? 'bg-rose-100 text-rose-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {item.log.action}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-600">
                    {item.log.tableName}
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-500 truncate max-w-[150px]">
                    {item.log.recordId}
                  </td>
                  <td className="p-4">
                    <details className="text-xs text-slate-600 cursor-pointer group">
                      <summary className="font-medium text-teal-600 hover:text-teal-800 focus:outline-none">Lihat Data</summary>
                      <div className="mt-2 p-2 bg-slate-100 rounded overflow-auto max-w-[300px] max-h-[150px]">
                        {!!item.log.newData && (
                          <div className="mb-2">
                            <span className="font-bold text-emerald-600 block mb-1">New Data:</span>
                            <pre className="whitespace-pre-wrap break-all">{JSON.stringify(item.log.newData, null, 2)}</pre>
                          </div>
                        )}
                        {!!item.log.oldData && (
                          <div>
                            <span className="font-bold text-rose-600 block mb-1">Old Data:</span>
                            <pre className="whitespace-pre-wrap break-all">{JSON.stringify(item.log.oldData, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Belum ada log aktivitas pada halaman ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Halaman {currentPage} · Menampilkan {logs.length} log
          </p>

          <div className="flex items-center gap-2">
            {hasPrevious ? (
              <Link
                href={`/admin/audit-logs?page=${currentPage - 1}`}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Sebelumnya
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-400"
              >
                Sebelumnya
              </span>
            )}

            {hasNext ? (
              <Link
                href={`/admin/audit-logs?page=${currentPage + 1}`}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Berikutnya
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className="cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-400"
              >
                Berikutnya
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}