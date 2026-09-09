import { db } from "@/src/db";
import { users } from "@/src/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { UserPlus, Shield, User } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DeletePenggunaButton from "./components/DeletePenggunaButton";

export default async function PenggunaPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') {
    redirect('/admin/dashboard');
  }

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

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
                    {session?.user?.id !== userRecord.id && (
                      <DeletePenggunaButton id={userRecord.id} />
                    )}
                    {session?.user?.id === userRecord.id && (
                      <span className="text-xs text-slate-400 italic">Akun Anda</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
