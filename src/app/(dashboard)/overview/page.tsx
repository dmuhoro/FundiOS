"use client";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  Car,
  CheckCircle2,
  ListChecks,
  MessageSquare,
  Send,
  Users,
  Wrench,
} from "lucide-react";
import { api } from "@/lib/convex";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type FeedEvent =
  | { id: string; kind: "automation"; title: string; detail: string; status: string; at: number }
  | { id: string; kind: "lead"; title: string; detail: string; status: string; at: number };

const STATUS_DOT: Record<string, string> = {
  success: "bg-green-500",
  failed: "bg-red-500",
  skipped: "bg-slate-400",
  pending: "bg-amber-500",
  new: "bg-blue-500",
  contacted: "bg-amber-500",
  converted: "bg-green-500",
  lost: "bg-slate-400",
};

function Kpi({ icon: Icon, label, value, hint }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number | string; hint?: string }) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-2xl font-semibold tabular-nums text-gray-900">{value}</p>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          {hint ? <p className="mt-0.5 text-xs text-gray-400">{hint}</p> : null}
        </div>
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
      </CardContent>
    </Card>
  );
}

function KpiSkeleton() {
  return (
    <Card size="sm">
      <CardContent>
        <Skeleton className="h-7 w-12" />
        <Skeleton className="mt-2 h-3 w-24" />
      </CardContent>
    </Card>
  );
}

export default function OverviewPage() {
  const profile = useQuery(api.members.myProfile);
  const overview = useQuery(api.dashboard.overview);
  const feed = useQuery(api.dashboard.activityFeed);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">
          FundiOS dashboard{profile ? ` · ${profile.name}` : ""}
        </h1>
        <p className="text-sm text-gray-600">
          {profile
            ? `Garage member · ${profile.role}. Live metrics and automation activity below.`
            : "You don't have a garage assigned yet. A super admin can add you to a garage."}
        </p>
      </div>

      <section aria-label="Key metrics">
        {overview ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi icon={MessageSquare} label="Total leads" value={overview.leadsTotal} hint={`${overview.leadsNew7d} new in 7 days`} />
            <Kpi icon={Users} label="Customers" value={overview.customersTotal} hint={`${overview.optInRate}% opted into WhatsApp`} />
            <Kpi icon={Car} label="Vehicles" value={overview.vehiclesTotal} />
            <Kpi icon={Wrench} label="Open services" value={overview.servicesOpen} hint={`${overview.servicesCompleted} completed`} />
            <Kpi icon={BadgeCheck} label="Reminders sent" value={overview.remindersSent} />
            <Kpi icon={Send} label="WhatsApp sent" value={overview.whatsappSent} />
            <Kpi icon={ListChecks} label="Queue backlog" value={overview.queueBacklog} hint="pending + retrying" />
            <Kpi icon={AlertTriangle} label="Queue failed" value={overview.queueFailed} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => <KpiSkeleton key={i} />)}
          </div>
        )}
      </section>

      <section aria-label="Activity feed">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity feed
            </CardTitle>
            <CardDescription>
              Recent WhatsApp leads and automation events across the garage.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {feed === undefined ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : feed.length === 0 ? (
              <p className="text-sm text-gray-500">
                No activity yet. When WhatsApp leads arrive and automation runs, events will show here.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {feed.map((event: FeedEvent) => (
                  <li key={event.id} className="flex items-start gap-3 py-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[event.status] ?? "bg-slate-300"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-medium text-gray-900">{event.title}</p>
                        <time className="shrink-0 text-xs text-gray-400" dateTime={new Date(event.at).toISOString()}>
                          {formatDistanceToNow(new Date(event.at), { addSuffix: true })}
                        </time>
                      </div>
                      {event.detail ? <p className="truncate text-xs text-gray-500">{event.detail}</p> : null}
                    </div>
                    {event.kind === "automation" && event.status === "success" ? (
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-green-500" aria-hidden />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}