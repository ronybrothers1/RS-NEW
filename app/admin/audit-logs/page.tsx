import { db } from "@/src/db";
import { auditLogs, users } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') {
    redirect('/admin/dashboard');
  }

  const logs = await db
    .select({
      log: auditLogs,
      userName: users.name,
      userEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(100); // Batasi 100 log terakhir untuk performa

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
                    Belum ada log aktivitas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
