"use client";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/lib/convex";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type Row = NonNullable<ReturnType<typeof useQuery<typeof api.tenants.adminSummary>>>[number];

const FIELD_CLASS =
  "w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

export default function AdminPage() {
  const rows = useQuery(api.tenants.adminSummary);
  const onboard = useMutation(api.tenants.onboardTenant);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [planTier, setPlanTier] = useState("starter");
  const [waPhoneId, setWaPhoneId] = useState("");
  const [memberToken, setMemberToken] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("owner");
  const [memberPhone, setMemberPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onboard({
        name,
        slug,
        planTier:
          planTier === "growth" ? "growth" : planTier === "premium" ? "premium" : "starter",
        waPhoneId: waPhoneId || undefined,
        memberTokenIdentifier: memberToken,
        memberName,
        memberRole:
          memberRole === "receptionist"
            ? "receptionist"
            : memberRole === "mechanic"
              ? "mechanic"
              : "owner",
        memberPhone: memberPhone || undefined,
      });
      setName("");
      setSlug("");
      setWaPhoneId("");
      setMemberToken("");
      setMemberName("");
      setMemberPhone("");
    } catch (err) {
      const data = (err as { data?: { message?: string } }).data;
      setError(data?.message ?? (err instanceof Error ? err.message : "Onboarding failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Super admin</h1>
        <p className="text-sm text-gray-600">
          Cross-tenant visibility and configuration-only onboarding. Each garage is fully
          isolated; this view is staff-only.
        </p>
      </div>

      <section aria-label="Onboard a garage">
        <Card>
          <CardHeader>
            <CardTitle>Onboard a garage</CardTitle>
            <CardDescription>
              Create a tenant and attach its operator in one atomic step (slug must be unique).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="name">Garage name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Quickstop Garage" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required placeholder="quickstop" pattern="[a-z0-9][a-z0-9-]{1,31}" title="2-32 lowercase letters, digits or hyphens" />
              </div>
              <div className="space-y-1">
                <Label>Plan tier</Label>
                <Select value={planTier} onValueChange={(v) => v && setPlanTier(v)}>
                  <SelectTrigger className={FIELD_CLASS}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="waPhoneId">WhatsApp phone ID (optional)</Label>
                <Input id="waPhoneId" value={waPhoneId} onChange={(e) => setWaPhoneId(e.target.value)} placeholder="105431206008513" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="memberToken">Operator token identifier</Label>
                <Input id="memberToken" value={memberToken} onChange={(e) => setMemberToken(e.target.value)} required placeholder="convex|alice" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="memberName">Operator name</Label>
                <Input id="memberName" value={memberName} onChange={(e) => setMemberName(e.target.value)} required placeholder="Alice" />
              </div>
              <div className="space-y-1">
                <Label>Operator role</Label>
                <Select value={memberRole} onValueChange={(v) => v && setMemberRole(v)}>
                  <SelectTrigger className={FIELD_CLASS}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="mechanic">Mechanic</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="memberPhone">Operator phone (optional)</Label>
                <Input id="memberPhone" value={memberPhone} onChange={(e) => setMemberPhone(e.target.value)} placeholder="+254700000000" />
              </div>
              {error ? <p className="text-sm text-red-600 md:col-span-2">{error}</p> : null}
              <div className="md:col-span-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Onboarding…" : "Onboard garage"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <section aria-label="Tenant registry">
        <Card>
          <CardHeader>
            <CardTitle>Tenant registry</CardTitle>
            <CardDescription>Live aggregate view across every garage in the OS.</CardDescription>
          </CardHeader>
          <CardContent>
            {rows === undefined ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : rows.length === 0 ? (
              <p className="text-sm text-gray-500">
                No tenants yet. Use the onboarding form to bring the first garage online.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-xs text-gray-500">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Garage</th>
                      <th className="py-2 pr-4 font-medium">Slug</th>
                      <th className="py-2 pr-4 font-medium">Plan</th>
                      <th className="py-2 pr-4 font-medium">Members</th>
                      <th className="py-2 pr-4 font-medium">Customers</th>
                      <th className="py-2 pr-4 font-medium">Open</th>
                      <th className="py-2 pr-4 font-medium">Leads</th>
                      <th className="py-2 pr-4 font-medium">Backlog</th>
                      <th className="py-2 pr-4 font-medium">Failed</th>
                      <th className="py-2 font-medium">Verified</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row: Row) => (
                      <tr key={row.tenantId}>
                        <td className="py-2 pr-4 font-medium text-gray-900">{row.name}</td>
                        <td className="py-2 pr-4">{row.slug}</td>
                        <td className="py-2 pr-4 capitalize text-gray-600">{row.planTier}</td>
                        <td className="py-2 pr-4 tabular-nums">{row.members}</td>
                        <td className="py-2 pr-4 tabular-nums">{row.customers}</td>
                        <td className="py-2 pr-4 tabular-nums">{row.openServices}</td>
                        <td className="py-2 pr-4 tabular-nums">{row.leads}</td>
                        <td className="py-2 pr-4 tabular-nums">{row.queueBacklog}</td>
                        <td className="py-2 pr-4 tabular-nums">{row.queueFailed}</td>
                        <td className="py-2">
                          <Badge variant={row.metaVerified ? "default" : "outline"}>
                            {row.metaVerified ? "verified" : "pending"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}