export function caseTitle(complainant: string | null, respondent: string | null, fallback: string) {
  const lastName = (name: string | null) => name?.trim().split(/\s+/).pop();
  const first = lastName(complainant);
  const second = lastName(respondent);
  return first && second ? `${first} v. ${second}` : fallback;
}

export function hasStaffRole(roles: string[]) {
  return roles.some((role) => role === "admin" || role === "investigator");
}

export function canDeleteCards(roles: string[]) {
  return roles.includes("admin");
}

export function scopeSubmissionIds(roles: string[], visibleIds: string[]) {
  return hasStaffRole(roles) ? null : [...new Set(visibleIds)];
}