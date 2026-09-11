"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";

export function DashboardNav() {
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <header className="flex items-center justify-between border-b bg-white px-4 py-3">
      <span className="text-sm font-semibold">FundiOS</span>
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
