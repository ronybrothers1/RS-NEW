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
    <div className="flex h-screen overflow-hidden bg-canvas">
      <a
        href="#admin-main"
        className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-950 shadow-lg ring-1 ring-brand-200 focus:not-sr-only"
      >
        Lewati ke konten admin
      </a>

      <AdminSidebar
        role={currentUser.role}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminHeader
          user={session.user}
          role={currentUser.role}
        />

        <main
          id="admin-main"
          tabIndex={-1}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-8 pt-20 focus:outline-none md:p-6 lg:p-8"
        >
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
