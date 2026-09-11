"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/convex";

export function DashboardNav() {
  const { signOut } = useAuthActions();
  const router = useRouter();
  const profile = useQuery(api.members.myProfile);

  return (
    <header className="flex items-center justify-between border-b bg-white px-4 py-3">
      <div className="flex items-center gap-4">
        <span className="text-sm font-semibold">FundiOS</span>
        {profile?.role === "super_admin" ? (
          <Link
            href="/dashboard/admin"
            className="rounded bg-gray-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-800"
          >
            Admin
          </Link>
        ) : null}
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