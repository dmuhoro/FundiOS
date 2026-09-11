import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">404 — Page not found</h1>
      <p className="text-muted-foreground text-sm">
        The page you are looking for does not exist.
      </p>
      <Link href="/dashboard/overview" className="text-blue-600 hover:underline">
        Back to dashboard
      </Link>
    </main>
  );
}