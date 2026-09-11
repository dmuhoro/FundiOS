"use client";
import { useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Megaphone, MessagesSquare, Target, TrendingUp, Users } from "lucide-react";
import { api } from "@/lib/convex";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

const STATUS_DOT: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-amber-500",
  converted: "bg-green-500",
  lost: "bg-slate-400",
};

const SOURCE_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  google: "Google",
  walk_in: "Walk-in",
  referral: "Referral",
  other: "Other",
};

export default function MarketingPage() {
  const acquisition = useQuery(api.dashboard.acquisition);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Marketing &amp; acquisition</h1>
        <p className="text-sm text-gray-600">
          Where leads come from and how they convert. Capture pages at{" "}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">/c/&#123;slug&#125;</code>
          attribute each lead to a source and campaign via UTM parameters.
        </p>
      </div>

      {acquisition ? (
        <>
          <section aria-label="Funnel metrics">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi icon={MessagesSquare} label="Leads tracked" value={acquisition.total} hint={`${acquisition.untracked} without a campaign`} />
              <Kpi icon={Megaphone} label="Facebook leads" value={acquisition.facebookLeads} hint="captured from Meta/pages" />
              <Kpi icon={Target} label="Converted to customer" value={acquisition.converted} />
              <Kpi icon={TrendingUp} label="Conversion rate" value={`${acquisition.conversionRate}%`} />
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-label="Leads by source">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Leads by source
                  </CardTitle>
                  <CardDescription>Every captured lead&apos;s channel, from most to least.</CardDescription>
                </CardHeader>
                <CardContent>
                  {acquisition.bySource.length === 0 ? (
                    <p className="text-sm text-gray-500">No leads captured yet.</p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {acquisition.bySource.map((row) => (
                        <li key={row.source} className="flex items-center justify-between py-2.5">
                          <span className="text-sm font-medium text-gray-900">
                            {SOURCE_LABEL[row.source] ?? row.source}
                          </span>
                          <span className="tabular-nums text-sm text-gray-600">{row.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </section>

            <section aria-label="Leads by campaign">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Leads by campaign
                  </CardTitle>
                  <CardDescription>
                    UTM-attributed campaigns (ad sets, posts, or sources you tag).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {acquisition.byCampaign.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No attributed campaigns yet. Link posts to your capture page with{" "}
                      <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
                        ?utm_campaign=name
                      </code>
                      .
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {acquisition.byCampaign.map((row) => (
                        <li key={row.campaign} className="flex items-center justify-between py-2.5">
                          <span className="truncate text-sm font-medium text-gray-900">{row.campaign}</span>
                          <span className="tabular-nums text-sm text-gray-600">{row.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>

          <section aria-label="Recent leads">
            <Card>
              <CardHeader>
                <CardTitle>Recent leads</CardTitle>
                <CardDescription>Newest captures first — phones masked.</CardDescription>
              </CardHeader>
              <CardContent>
                {acquisition.recent.length === 0 ? (
                  <p className="text-sm text-gray-500">Nothing captured yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {acquisition.recent.map((lead) => (
                      <li key={lead.id} className="flex items-center gap-3 py-2.5">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[lead.status] ?? "bg-slate-300"}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {lead.name ?? lead.phone}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {SOURCE_LABEL[lead.source] ?? lead.source}
                            {lead.campaignKey ? ` · ${lead.campaignKey}` : ""} · {lead.phone}
                          </p>
                        </div>
                        <time className="shrink-0 text-xs text-gray-400" dateTime={new Date(lead.createdAt).toISOString()}>
                          {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                        </time>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </section>
        </>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Card size="sm" key={i}>
                <CardContent>
                  <Skeleton className="h-7 w-12" />
                  <Skeleton className="mt-2 h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
      )}
    </div>
  );
}