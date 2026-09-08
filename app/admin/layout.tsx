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
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar role={role} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader user={session.user} />
        <main className="flex-1 overflow-x-hidden px-4 pb-8 pt-20 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
