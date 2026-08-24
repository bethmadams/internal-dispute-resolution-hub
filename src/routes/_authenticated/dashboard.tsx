import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  disputesQuery,
  formatDate,
  nextCaseNumber,
  PRIORITIES,
  priorityStyles,
  profilesQuery,
  STAGES,
  stageStyles,
  type Priority,
  type Stage,
} from "@/lib/hub";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Case Board | Internal Dispute Resolution Hub" },
      {
        name: "description",
        content:
          "Track every internal dispute by stage, priority and assigned investigator on the IDR case board.",
      },
      { property: "og:title", content: "Case Board | Internal Dispute Resolution Hub" },
      {
        property: "og:description",
        content: "Live view of internal disputes across submission, hearing, appeal and closure.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard;
});

function Dashboard() {
  return null;
}
