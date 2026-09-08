"use client";

import { useActionState, useState } from "react";
import { submitDonation } from "@/app/actions/donasi";
import { CheckCircle2, Copy } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function DonasiClientForm({ programs, bankAccounts }: { programs: any[], bankAccounts: Record<string, string> }) {
  const searchParams = useSearchParams();
  const defaultProgram = searchParams?.get('program') || (programs.length > 0 ? programs[0].id : '');
  
  const [state, formAction, isPending] = useActionState(submitDonation, { success: false, error: null });
  const [amount, setAmount] = useState("");
  
  const availableBanks = ['BCA', 'MANDIRI', 'BSI', 'BRI'].filter(method => bankAccounts[method] && bankAccounts[method].trim() !== '');
  const [paymentMethod, setPaymentMethod] = useState(availableBanks.length > 0 ? availableBanks[0] : "");
  
  const [copied, setCopied] = useState(false);

  const predefinedAmounts = [50000, 100000, 200000, 500000];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCleanAccountNumber = (text: string) => {
    return text.match(/\d+/g)?.join('') || text;
  };

  if (state.success) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-20 w-20 text-emerald-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Terima Kasih, Orang Baik!</h2>
        <p className="text-slate-600 mb-8 max-w-md mx-auto">
          Niat baik Anda telah kami catat. Silakan lakukan transfer sesuai metode pembayaran yang dipilih dan konfirmasi ke admin kami.
        </p>
        
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
          <p className="text-sm text-slate-500 mb-2">Transfer ke Rekening {paymentMethod}:</p>
          <div className="flex flex-col items-center justify-center gap-2 mb-3">
            <span className="text-2xl font-bold text-slate-900 tracking-wider">
              {bankAccounts[paymentMethod] || '-'}
            </span>
            <button 
              onClick={() => handleCopy(getCleanAccountNumber(bankAccounts[paymentMethod] || ''))}
              className="px-4 py-2 bg-white rounded-md border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-2"
              title="Salin No Rekening"
            >
              <Copy className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-600">Salin No. Rekening</span>
            </button>
          </div>
          {copied && <span className="text-sm text-emerald-600 font-medium block">Berhasil disalin!</span>}
        </div>

        <Link 
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-teal-700 text-white rounded-full font-medium hover:bg-teal-800 transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
          {state.error}
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">1. Pilih Program Kebaikan</h3>
        <select 
          name="programId" 
          defaultValue={defaultProgram}
          required
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500 text-slate-900 bg-white font-medium"
        >
          <option value="" disabled>-- Pilih Program --</option>
          {programs.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 mb-4">2. Nominal Donasi</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {predefinedAmounts.map(val => (
            <button
              key={val}
              type="button"
              onClick={() => setAmount(val.toString())}
              className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                amount === val.toString() 
                  ? 'bg-amber-600 text-white border-2 border-amber-600' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-amber-400 hover:bg-amber-50'
              }`}
            >
              Rp {val.toLocaleString('id-ID')}
            </button>
          ))}
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-slate-500 font-medium">Rp</span>
          </div>
          <input
            type="text"
            name="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
            placeholder="Nominal Lainnya"
            required
            className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500 text-slate-900 font-bold text-lg"
          />
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 mb-4">3. Data Diri</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              name="donorName"
              required
              placeholder="Nama Anda"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-teal-500 focus:border-teal-500 text-slate-900"
            />
          </div>
          <div className="flex items-center mt-3">
            <input
              type="checkbox"
              id="isAnonymous"
              name="isAnonymous"
              className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
            />
            <label htmlFor="isAnonymous" className="ml-3 block text-sm font-medium text-slate-700">
              Sembunyikan nama saya (Tampil sebagai Hamba Allah)
            </label>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 mb-4">4. Metode Pembayaran & Bukti</h3>
        {availableBanks.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {availableBanks.map(method => (
                <label 
                  key={method} 
                  className={`flex items-center justify-center p-4 border rounded-xl cursor-pointer transition-all ${
                    paymentMethod === method 
                      ? 'border-teal-600 bg-teal-50 ring-1 ring-teal-600' 
                      : 'border-slate-200 hover:border-teal-300'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value={method} 
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                    className="sr-only" 
                  />
                  <span className="font-bold text-slate-800">Transfer {method}</span>
                </label>
              ))}
            </div>
            
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <label htmlFor="proofImage" className="block text-sm font-medium text-slate-700 mb-2">
                Unggah Bukti Transfer <span className="text-rose-500">*</span>
              </label>
              <input
                type="file"
                id="proofImage"
                name="proofImage"
                accept="image/*"
                required
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-teal-50 file:text-teal-700
                  hover:file:bg-teal-100 transition-colors"
              />
              <p className="text-xs text-slate-500 mt-2">Format yang didukung: JPG, PNG, max 5MB.</p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm">
            Saat ini metode pembayaran belum tersedia. Silakan hubungi admin.
          </div>
        )}
      </div>

      <div className="pt-8">
        <button
          type="submit"
          disabled={isPending || availableBanks.length === 0}
          className="w-full py-4 bg-amber-600 text-white rounded-xl font-bold text-lg hover:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-600/30 disabled:opacity-70 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          {isPending ? "Memproses..." : "Lanjutkan Donasi"}
        </button>
      </div>
    </form>
  );
}
