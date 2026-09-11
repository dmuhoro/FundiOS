"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/convex";

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={active ? "rounded px-2.5 py-1 text-sm font-medium text-gray-900" : "rounded px-2.5 py-1 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900"}
    >
      {label}
    </Link>
  );
}

export function DashboardNav() {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const pathname = usePathname();
  const profile = useQuery(api.members.myProfile);

  return (
    <header className="flex items-center justify-between border-b bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/overview" className="text-sm font-semibold">
          FundiOS
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink href="/dashboard/overview" label="Overview" active={pathname === "/dashboard/overview"} />
          {profile?.tenantId ? (
            <NavLink href="/dashboard/gmb" label="GMB launch" active={pathname === "/dashboard/gmb"} />
          ) : null}
          {profile?.role === "super_admin" ? (
            <NavLink href="/dashboard/admin" label="Admin" active={pathname === "/dashboard/admin"} />
          ) : null}
        </nav>
      </div>
      <button
        onClick={() => {
          void signOut();
          router.push("/login");
        }}
        className="rounded border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
      >
        Sign out
      </button>
    </header>
  );
}