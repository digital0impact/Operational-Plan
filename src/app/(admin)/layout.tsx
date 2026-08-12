import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AdminTopBar } from "@/components/admin-top-bar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "GENERAL_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-full bg-bg">
      <AdminTopBar userName={user.name} />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
