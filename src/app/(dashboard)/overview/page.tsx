"use client";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";

export default function OverviewPage() {
  const profile = useQuery(api.members.myProfile);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Welcome{profile ? `, ${profile.name}` : ""}</h1>
      <p className="text-sm text-gray-600">
        {profile
          ? `Garage member · ${profile.role}`
          : "You don't have a garage assigned yet. A super admin can add you to a garage."}
      </p>
    </div>
  );
}
