import {
  auth,
} from "@/auth";
import {
  getCurrentDbUser,
} from "@/lib/current-authz";
import {
  redirect,
} from "next/navigation";

import AccessRevoked from "./components/AccessRevoked";
import AdminHeader from "./components/AdminHeader";
import AdminSidebar from "./components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session =
    await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const currentUser =
    await getCurrentDbUser();

  if (
    !currentUser ||
    (
      currentUser.role !== "ADMIN" &&
      currentUser.role !== "OPERATOR"
    )
  ) {
    return <AccessRevoked />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AdminSidebar
        role={currentUser.role}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminHeader
          user={session.user}
        />

        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-8 pt-20 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
