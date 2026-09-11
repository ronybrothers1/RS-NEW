// Rendered on-demand instead of prerendered at build time: this page
// queries the database, which is not reachable from the build machine.
export const dynamic = 'force-dynamic';
import { db } from "@/src/db";
import { articles, users } from "@/src/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { ArrowRight, Image as ImageIcon } from "lucide-react";
import { publishDueArticles } from "@/lib/article-publication";


export default async function PublicBeritaPage() {
  await publishDueArticles();
  const allArticles = await db
    .select({
      id: articles.id,
      title: articles.title,
      slug: articles.slug,
      excerpt: articles.excerpt,
      imageUrl: articles.imageUrl,
      imageAlt: articles.imageAlt,
      createdAt: articles.createdAt,
      publishedAt: articles.publishedAt,
      authorName: users.name,
    })
    .from(articles)
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(eq(articles.status, 'PUBLISHED'))
    .orderBy(desc(sql`COALESCE(${articles.publishedAt}, ${articles.createdAt})`));

  return (
    <div className="min-h-screen bg-slate-50">
      
      
      <div className="relative overflow-hidden bg-slate-950 py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-teal-900/40 via-slate-950 to-slate-950"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6">Berita & Artikel</h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto">
            Kisah inspiratif, update program, dan literasi kebaikan dari Yayasan Ruang Sejahtera.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {allArticles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <h3 className="text-xl font-medium text-slate-900 mb-2">Belum ada berita</h3>
            <p className="text-slate-500">Artikel dan berita terbaru akan segera hadir.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allArticles.map((art) => (
              <article key={art.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-lg transition-all group flex flex-col">
                <Link href={`/berita/${art.slug}`} className="aspect-video bg-slate-100 relative overflow-hidden block">
                  {art.imageUrl ? (
                    <img 
                      src={art.imageUrl} 
                      alt={art.imageAlt || art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-slate-300" />
                    </div>
                  )}
                </Link>
                
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-4">
                    <span>{new Date(art.publishedAt ?? art.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span>{art.authorName}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-teal-700 transition-colors">
                    <Link href={`/berita/${art.slug}`}>
                      {art.title}
                    </Link>
                  </h3>
                  
                  <p className="text-slate-600 line-clamp-3 mb-6 flex-1 text-sm leading-relaxed">
                    {art.excerpt || 'Baca artikel selengkapnya dengan menekan tombol di bawah ini.'}
                  </p>
                  
                  <Link href={`/berita/${art.slug}`} className="text-teal-700 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all mt-auto pt-4 border-t border-slate-100">
                    Baca Artikel <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
