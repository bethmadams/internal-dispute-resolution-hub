import { useQuery } from "@tanstack/react-query";
import { rolesQuery } from "@/lib/hub";
import { useCurrentUser } from "@/hooks/use-session";

export type AppRole = "admin" | "investigator" | "viewer";

export function useMyRole() {
  const { user, loading } = useCurrentUser();
  const { data: roles = [], isLoading } = useQuery(rolesQuery);
  const role = (roles.find((r) => r.user_id === user?.id)?.role ?? "viewer") as AppRole;
  return {
    role,
    isAdmin: role === "admin",
    isStaff: role === "admin" || role === "investigator",
    isViewer: role === "viewer",
    loading: loading || isLoading,
  };
}
