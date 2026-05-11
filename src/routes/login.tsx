import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — Musren" },
      { name: "description", content: "Sign in to your Musren dashboard." },
    ],
  }),
  component: LoginPage,
});

const credSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

const signupSchema = credSchema.extend({
  confirmPassword: z.string().min(8).max(72),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      const target = search.redirect ?? "/admin/corporate-topup";
      navigate({ to: target as "/admin/corporate-topup" });
    }
  }, [loading, isAuthenticated, navigate, search.redirect]);

  const friendlyEmailError = (raw: string, mode: "signin" | "signup") => {
    const m = raw.toLowerCase();
    if (m.includes("invalid login") || m.includes("invalid credentials"))
      return "Incorrect email or password. Please try again.";
    if (m.includes("email not confirmed"))
      return "Please confirm your email address before signing in. Check your inbox for the confirmation link.";
    if (m.includes("user already registered") || m.includes("already been registered"))
      return "An account with this email already exists. Try signing in instead.";
    if (m.includes("weak password") || m.includes("password should"))
      return "Password is too weak. Use at least 8 characters with a mix of letters and numbers.";
    if (m.includes("rate limit") || m.includes("too many"))
      return "Too many attempts. Please wait a moment and try again.";
    if (m.includes("network") || m.includes("failed to fetch"))
      return "Network error. Check your connection and try again.";
    if (m.includes("not allowed") || m.includes("signups not allowed"))
      return "Sign-ups are currently disabled. Please contact support.";
    return mode === "signin"
      ? "Could not sign you in. Please try again."
      : "Could not create your account. Please try again.";
  };

  const friendlyOAuthError = (raw: string, provider: string) => {
    const m = raw.toLowerCase();
    if (m.includes("popup") || m.includes("closed"))
      return `${provider} sign-in was cancelled. Please try again.`;
    if (m.includes("network") || m.includes("failed to fetch"))
      return `Network error connecting to ${provider}. Check your connection and try again.`;
    if (m.includes("not enabled") || m.includes("provider"))
      return `${provider} sign-in isn't available right now. Please use email or another method.`;
    return `${provider} sign-in failed. Please try again or use email.`;
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    const label = provider === "google" ? "Google" : "Apple";
    setBusy(true);
    try {
      const res = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (res.error) {
        console.error(`[auth] ${provider} OAuth error:`, res.error);
        toast.error(friendlyOAuthError(res.error.message ?? "", label));
      }
    } catch (err) {
      console.error(`[auth] ${provider} OAuth exception:`, err);
      toast.error(friendlyOAuthError((err as Error).message ?? "", label));
    } finally {
      setBusy(false);
    }
  };

  const handle = async (
    e: React.FormEvent<HTMLFormElement>,
    mode: "signin" | "signup",
  ) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = credSchema.safeParse({
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your input.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        toast.success("Signed in successfully");
      } else {
        const { error } = await supabase.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo: `${window.location.origin}/login` },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to confirm.");
      }
    } catch (err) {
      console.error(`[auth] ${mode} error:`, err);
      toast.error(friendlyEmailError((err as Error).message ?? "", mode));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-md px-4 section-y">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="size-9 rounded-lg bg-gradient-to-br from-primary to-accent grid place-items-center">
              <Zap className="size-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-bold">Musren</span>
          </Link>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your dashboard or create an account.
          </p>
        </div>

        <div className="rounded-2xl glass-strong p-6 border-gradient">
          <div className="space-y-2.5 mb-6">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              className="w-full glass"
              onClick={() => handleOAuth("google")}
            >
              <svg className="size-4" viewBox="0 0 24 24" aria-hidden><path fill="#EA4335" d="M12 11v3.2h4.5c-.2 1.2-1.4 3.5-4.5 3.5-2.7 0-4.9-2.2-4.9-5s2.2-5 4.9-5c1.5 0 2.6.7 3.2 1.2l2.2-2.1C15.9 5.5 14.1 4.7 12 4.7 7.9 4.7 4.6 8 4.6 12s3.3 7.3 7.4 7.3c4.3 0 7.1-3 7.1-7.2 0-.5-.1-.9-.1-1.1H12z"/></svg>
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              className="w-full glass"
              onClick={() => handleOAuth("apple")}
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.9-1.5-.1-2.8.9-3.6.9-.7 0-1.9-.8-3.1-.8-1.6 0-3.1.9-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.7 2.5 3 2.5 1.2 0 1.7-.8 3.1-.8s1.9.8 3.1.8 2.2-1.2 3-2.4c.9-1.4 1.3-2.7 1.3-2.8-.1 0-2.7-1-2.7-4zM14.2 5.5c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1.1.1 2.1-.5 2.7-1.3z"/></svg>
              Continue with Apple
            </Button>
          </div>

          <div className="relative my-4 text-center text-xs text-muted-foreground">
            <span className="bg-background px-2 relative z-10">or with email</span>
            <div className="absolute inset-x-0 top-1/2 h-px bg-border -z-0" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-6">
              <form onSubmit={(e) => handle(e, "signin")} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required maxLength={255} className="mt-1.5 glass" />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required minLength={8} maxLength={72} className="mt-1.5 glass" />
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold"
                >
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <form onSubmit={(e) => handle(e, "signup")} className="space-y-4">
                <div>
                  <Label htmlFor="email2">Email</Label>
                  <Input id="email2" name="email" type="email" required maxLength={255} className="mt-1.5 glass" />
                </div>
                <div>
                  <Label htmlFor="password2">Password</Label>
                  <Input id="password2" name="password" type="password" required minLength={8} maxLength={72} className="mt-1.5 glass" />
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold"
                >
                  {busy ? "Creating…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </SiteLayout>
  );
}
