import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Applies to every route under this layout. Footer/Navbar and most pages
// here read from the database, which is not reachable from the build
// machine — force these routes to render per-request instead of being
// prerendered at build time.
export const dynamic = 'force-dynamic';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <a
        href="#main-content"
        className="sr-only text-sm font-semibold text-brand-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-brand-600 focus:ring-1 focus:ring-brand-200"
      >
        Lewati ke konten utama
      </a>

      <Navbar />

      <main
        id="main-content"
        tabIndex={-1}
        className="flex-grow focus:outline-none"
      >
        {children}
      </main>

      <Footer />
    </div>
  );
}
