import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">404 - Halaman Tidak Ditemukan</h1>
        <p className="text-slate-600 mb-8">Maaf, halaman yang Anda cari tidak tersedia.</p>
        <Link 
          href="/"
          className="inline-flex items-center px-6 py-3 bg-teal-700 text-white font-medium rounded-xl hover:bg-teal-800 transition-colors shadow-sm"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
export const dynamic = 'force-dynamic';
