import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Section } from "@/components/site/Section";
import { fetchUserProfile, isOnboardingComplete } from "@/lib/onboarding";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGate,
});

function AuthGate() {
  const { loading, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate({
        to: "/login",
        search: { redirect: window.location.pathname + window.location.search },
      });
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    let mounted = true;
    const checkOnboarding = async () => {
      if (loading) return;
      if (!isAuthenticated || !user) {
        setCheckingOnboarding(false);
        return;
      }
      try {
        const profile = await fetchUserProfile(user.id);
        if (!mounted) return;
        if (!isOnboardingComplete(profile) && location.pathname !== "/dashboard") {
          navigate({ to: "/select-role", replace: true });
          return;
        }
      } catch (err) {
        console.error("[auth] onboarding gate error:", err);
      } finally {
        if (mounted) setCheckingOnboarding(false);
      }
    };
    checkOnboarding();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, loading, location.pathname, navigate, user]);

  if (loading || checkingOnboarding || !isAuthenticated) {
    return (
      <SiteLayout>
        <Section title="Loading…" description="Checking your session." />
      </SiteLayout>
    );
  }

  return <Outlet />;
}
