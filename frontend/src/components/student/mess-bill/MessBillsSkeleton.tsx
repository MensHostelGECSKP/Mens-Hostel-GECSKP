"use client";

import React from "react";
import { Skeleton } from "@/components/student/Skeleton";

export default function MessBillsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}
