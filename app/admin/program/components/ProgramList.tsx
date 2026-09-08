"use client";

import { useState } from "react";
import { deleteProgram } from "@/app/actions/program";
import { BookOpen, Stethoscope, Leaf, Users, HeartHandshake, Activity, FileText, Trash2, Edit } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  'BookOpen': BookOpen,
  'Stethoscope': Stethoscope,
  'Leaf': Leaf,
  'Users': Users,
  'HeartHandshake': HeartHandshake,
  'Activity': Activity,
  'FileText': FileText,
};

export default function ProgramList({ programs }: { programs: any[] }) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin membatalkan program "${name}"? Program tidak akan ditampilkan lagi kepada publik.`)) {
      return;
    }

    setIsDeleting(id);
    const result = await deleteProgram(id);
    if (!result.success) {
      alert(result.error);
    }
    setIsDeleting(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 w-12">Ikon</th>
              <th className="px-6 py-4">Nama Program</th>
              <th className="px-6 py-4">Target Dana</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {programs.length > 0 ? (
              programs.map((program) => {
                const IconComponent = iconMap[program.icon] || HeartHandshake;
                const isCancelled = program.status === 'INACTIVE';
                
                return (
                  <tr key={program.id} className={`hover:bg-slate-50 ${isCancelled ? 'opacity-60 bg-slate-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCancelled ? 'bg-slate-200 text-slate-500' : 'bg-teal-50 text-teal-600'}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{program.name}</div>
                      <div className="text-slate-500 text-xs mt-1 max-w-xs truncate">{program.description}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {program.targetAmount ? formatCurrency(Number(program.targetAmount)) : <span className="text-slate-400 italic font-normal">Tidak Terbatas</span>}
                    </td>
                    <td className="px-6 py-4">
                      {isCancelled ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Dibatalkan
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isCancelled && (
                          <button 
                            disabled={isDeleting === program.id}
                            onClick={() => handleDelete(program.id, program.name)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Hapus / Batalkan Program"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  <Activity className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-900">Belum ada program</p>
                  <p className="text-sm mt-1">Tambahkan program pertama Anda untuk mulai menerima donasi spesifik.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
