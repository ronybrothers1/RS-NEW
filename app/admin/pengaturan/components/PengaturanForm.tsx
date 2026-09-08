"use client";

import { useActionState, useEffect } from "react";
import { saveSettings } from "@/app/actions/pengaturan";
import { Save, Building2, CreditCard, Globe2 } from "lucide-react";

export default function PengaturanForm({
  initialData,
}: {
  initialData: Record<string, string>;
}) {
  const [state, formAction, isPending] = useActionState(
    saveSettings as any,
    { success: false, error: null, message: null }
  );

  useEffect(() => {
    if (state.success && state.message) {
      alert(state.message);
    }
  }, [state.success, state.message]);

  return (
    <form action={formAction} className="space-y-8 max-w-4xl">
      {state.error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
          {state.error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-teal-50 rounded-lg">
            <Building2 className="h-5 w-5 text-teal-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Profil Yayasan</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nama Yayasan
              </label>
              <input
                type="text"
                name="yayasan_name"
                defaultValue={
                  initialData.yayasan_name || 'Yayasan Ruang Sejahtera'
                }
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Publik
              </label>
              <input
                type="email"
                name="yayasan_email"
                defaultValue={initialData.yayasan_email || ''}
                placeholder="info@domainanda.id"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nomor Telepon / WhatsApp
            </label>
            <input
              type="text"
              name="yayasan_phone"
              defaultValue={initialData.yayasan_phone || ''}
              placeholder="+62 812-3456-7890"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Alamat Lengkap
            </label>
            <textarea
              name="yayasan_address"
              rows={3}
              defaultValue={initialData.yayasan_address || ''}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500"
              placeholder="Alamat resmi yayasan"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg">
            <CreditCard className="h-5 w-5 text-amber-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Rekening Donasi
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-500 mb-4">
            Rekening hanya ditampilkan jika kolomnya diisi.
          </p>

          <div className="grid gap-6">
            <div className="flex gap-4 items-center">
              <div className="w-24 shrink-0 font-bold text-slate-700">
                Bank BCA
              </div>
              <input
                type="text"
                name="bank_bca"
                defaultValue={initialData.bank_bca || ''}
                placeholder="Nomor rekening dan nama pemilik"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div className="flex gap-4 items-center">
              <div className="w-24 shrink-0 font-bold text-slate-700">
                MANDIRI
              </div>
              <input
                type="text"
                name="bank_mandiri"
                defaultValue={initialData.bank_mandiri || ''}
                placeholder="Nomor rekening dan nama pemilik"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div className="flex gap-4 items-center">
              <div className="w-24 shrink-0 font-bold text-slate-700">
                Bank BSI
              </div>
              <input
                type="text"
                name="bank_bsi"
                defaultValue={initialData.bank_bsi || ''}
                placeholder="Nomor rekening dan nama pemilik"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-sky-50 rounded-lg">
            <Globe2 className="h-5 w-5 text-sky-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Media Sosial Resmi
          </h2>
        </div>
        <div className="p-6 grid gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Instagram
            </label>
            <input
              type="url"
              name="social_instagram"
              defaultValue={initialData.social_instagram || ''}
              placeholder="https://instagram.com/..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Facebook
            </label>
            <input
              type="url"
              name="social_facebook"
              defaultValue={initialData.social_facebook || ''}
              placeholder="https://facebook.com/..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              X / Twitter
            </label>
            <input
              type="url"
              name="social_twitter"
              defaultValue={initialData.social_twitter || ''}
              placeholder="https://x.com/..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center px-6 py-3 bg-teal-700 text-white font-medium rounded-xl hover:bg-teal-800 disabled:opacity-70 transition-colors shadow-sm"
        >
          <Save className="h-5 w-5 mr-2" />
          {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>
    </form>
  );
}
