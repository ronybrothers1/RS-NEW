import {
  getCurrentDbUser,
} from "@/lib/current-authz";
import {
  redirect,
} from "next/navigation";

export default async function PenggunaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser =
    await getCurrentDbUser();

  if (
    !currentUser ||
    currentUser.role !== "ADMIN"
  ) {
    redirect("/admin/dashboard");
  }

  return children;
}