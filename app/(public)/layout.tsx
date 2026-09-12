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
        className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-950 shadow-lg ring-1 ring-brand-200 focus:not-sr-only"
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
