import ArticleForm from "../components/ArticleForm";
import { db } from "@/src/db";
import { programs } from "@/src/db/schema";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function TulisBeritaPage() {
  const availablePrograms = await db
    .select({
      id: programs.id,
      name: programs.name,
      status: programs.status,
    })
    .from(programs)
    .where(eq(programs.status, "ACTIVE"))
    .orderBy(asc(programs.name));

  return (
    <ArticleForm
      programs={availablePrograms}
    />
  );
}
