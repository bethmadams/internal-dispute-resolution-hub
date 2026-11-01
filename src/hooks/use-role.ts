import { useQuery } from "@tanstack/react-query";
import { rolesQuery, type AppRole } from "@/lib/hub";
import { useCurrentUser } from "@/hooks/use-session";
import { hasStaffRole } from "@/lib/case-rules";

export function useMyRole() {
  const { user, loading } = useCurrentUser();
  const { data: roles = [], isLoading } = useQuery(rolesQuery);
  const role = (roles.find((r) => r.user_id === user?.id)?.role ?? "viewer") as AppRole;
  const myRoles = roles.filter((r) => r.user_id === user?.id).map((r) => r.role);
  return {
    role,
    isAdmin: myRoles.includes("admin"),
    isStaff: hasStaffRole(myRoles),
    isViewer: role === "viewer",
    loading: loading || isLoading,
  };
}
