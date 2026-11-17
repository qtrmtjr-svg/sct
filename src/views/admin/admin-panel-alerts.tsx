"use client";

import { useNewVisitorAlert } from "@/hooks/use-new-visitor-alert";

export function AdminPanelAlerts({ children }: { children: React.ReactNode }) {
  useNewVisitorAlert();
  return children;
}
