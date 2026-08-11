import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { TopBar } from "@/components/top-bar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || !user.school) {
    redirect("/login");
  }

  return (
    <div className="min-h-full bg-bg">
      <TopBar
        schoolName={user.school.name}
        userName={user.name}
        role={user.role}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
