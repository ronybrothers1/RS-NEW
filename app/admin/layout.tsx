import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = (session.user as any).role;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AdminSidebar role={role} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminHeader user={session.user} />
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-8 pt-20 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
