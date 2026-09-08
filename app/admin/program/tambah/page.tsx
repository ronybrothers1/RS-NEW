"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProgram } from "@/app/actions/program";
import { ArrowLeft, BookOpen, Stethoscope, Leaf, Users, HeartHandshake, Activity, FileText } from "lucide-react";
import Link from "next/link";

const availableIcons = [
  { id: 'HeartHandshake', icon: HeartHandshake, label: 'Kemanusiaan' },
  { id: 'BookOpen', icon: BookOpen, label: 'Pendidikan' },
  { id: 'Stethoscope', icon: Stethoscope, label: 'Kesehatan' },
  { id: 'Leaf', icon: Leaf, label: 'Lingkungan' },
  { id: 'Users', icon: Users, label: 'Sosial / Komunitas' },
  { id: 'Activity', icon: Activity, label: 'Aktivitas / Darurat' },
  { id: 'FileText', icon: FileText, label: 'Bantuan' },
];

export default function TambahProgramPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('HeartHandshake');
  const [targetAmount, setTargetAmount] = useState("");

  const formatRupiah = (value: string) => {
    const numberString = value.replace(/[^,\d]/g, '').toString();
    const split = numberString.split(',');
    const sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    const ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    if (ribuan) {
      const separator = sisa ? '.' : '';
      rupiah += separator + ribuan.join('.');
    }

    rupiah = split[1] !== undefined ? rupiah + ',' + split[1] : rupiah;
    return rupiah;
  };

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetAmount(formatRupiah(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.set("icon", selectedIcon);
    formData.set("targetAmount", targetAmount.replace(/\./g, ''));

    const result = await createProgram(formData);

    if (result.success) {
      router.push("/admin/program");
      router.refresh();
    } else {
      setError(result.error || "Gagal menambahkan program");
      setIsPending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/program" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tambah Program Baru</h1>
          <p className="text-slate-500 text-sm mt-1">Buat program penyaluran donasi baru.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 text-rose-600 rounded-lg text-sm font-medium border border-rose-100">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
              Nama Program <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
              placeholder="Contoh: Bantuan Sembako Yatim Piatu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Pilih Ikon Representasi <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {availableIcons.map((item) => {
                const IconComponent = item.icon;
                const isSelected = selectedIcon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedIcon(item.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      isSelected 
                        ? 'border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-500/20' 
                        : 'border-slate-200 bg-white text-slate-500 hover:border-teal-300 hover:bg-slate-50'
                    }`}
                  >
                    <IconComponent className="h-6 w-6 mb-2" />
                    <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
              Deskripsi Singkat Program
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500"
              placeholder="Tuliskan tujuan dan siapa penerima manfaat program ini..."
            ></textarea>
          </div>

          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium text-slate-700 mb-1">
              Target Dana (Opsional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-500 font-medium">Rp</span>
              </div>
              <input
                type="text"
                id="targetAmount"
                value={targetAmount}
                onChange={handleTargetChange}
                className="w-full pl-12 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 font-medium text-slate-900"
                placeholder="0"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Kosongkan jika program berjalan terus-menerus tanpa batas target.</p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <Link
              href="/admin/program"
              className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors disabled:opacity-50"
            >
              {isPending ? "Menyimpan..." : "Simpan Program"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
