import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type ProfileRole = "customer" | "affiliate" | "merchant" | "developer";

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  role: ProfileRole | null;
  role_selected: boolean;
  auth_verified: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export const roleLabels: Record<ProfileRole, string> = {
  customer: "Customer",
  affiliate: "Affiliate",
  merchant: "Merchant",
  developer: "Developer",
};

export const dashboardForRole = (role?: ProfileRole | null) => {
  if (role === "affiliate") return "/affiliates/dashboard";
  if (role === "developer") return "/developers/dashboard";
  return "/dashboard";
};

export const dashboardForAccess = (profile?: UserProfile | null, roles: string[] = []) => {
  if (roles.some((role) => role === "admin" || role === "staff" || role === "superadmin")) {
    return "/admin/corporate-topup";
  }
  return dashboardForRole(profile?.role);
};

export async function fetchUserProfile(userId: string) {
  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as UserProfile | null;
}

export async function ensureUserProfile(user: User) {
  const { data, error } = await (supabase as any).rpc("ensure_user_profile", {
    _email: user.email ?? "",
  });

  if (error) throw error;
  return data as UserProfile;
}

export async function completeUserOnboarding(user: User, role: ProfileRole) {
  const { data, error } = await (supabase as any).rpc("complete_onboarding", {
    _role: role,
    _email: user.email ?? "",
  });

  if (error) throw error;
  return data as UserProfile;
}

export const isOnboardingComplete = (profile?: UserProfile | null) =>
  !!profile?.role_selected && !!profile?.onboarding_completed && !!profile?.role;