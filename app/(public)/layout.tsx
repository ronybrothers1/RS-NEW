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
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}
