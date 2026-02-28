"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  session: Session | null;
  authModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMode("signin");
    setEmail("");
    setPassword("");
    setMessage(null);
    setError(null);
    setLoading(false);
  }, [isOpen]);

  const handlePasswordAuth = async () => {
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        onClose();
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/map`,
          },
        });
        if (signUpError) throw signUpError;

        if (data.session) {
          onClose();
        } else {
          setMessage("Account created. Check your email to confirm your sign-in.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setError("Enter your email to receive a magic link.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/map`,
        },
      });
      if (otpError) throw otpError;
      setMessage("Magic link sent. Check your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send magic link.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2200] flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-line2 bg-ink2 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-head text-xl tracking-wider text-bright">
            {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-pd-muted hover:text-bright"
          >
            Close
          </button>
        </div>

        <div className="mb-4 flex rounded border border-line2 bg-ink3 p-0.5">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 rounded px-2 py-1.5 font-mono text-[9px] uppercase tracking-wider ${
              mode === "signin" ? "bg-teal-dim text-teal" : "text-mid hover:text-text"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded px-2 py-1.5 font-mono text-[9px] uppercase tracking-wider ${
              mode === "signup" ? "bg-teal-dim text-teal" : "text-mid hover:text-text"
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@firm.com"
            className="h-10 w-full rounded border border-line2 bg-ink3 px-3 text-sm text-bright placeholder:text-pd-muted focus:border-teal focus:outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="h-10 w-full rounded border border-line2 bg-ink3 px-3 text-sm text-bright placeholder:text-pd-muted focus:border-teal focus:outline-none"
          />
        </div>

        {error && <p className="mt-3 text-xs text-red">{error}</p>}
        {message && <p className="mt-3 text-xs text-teal">{message}</p>}

        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            onClick={() => void handlePasswordAuth()}
            disabled={loading}
            className="flex-1 bg-teal text-ink hover:bg-teal/90"
          >
            {loading ? "Working..." : mode === "signin" ? "Sign In" : "Create Account"}
          </Button>
          <Button
            type="button"
            onClick={() => void handleMagicLink()}
            disabled={loading}
            variant="outline"
            className="flex-1 border-line2 bg-ink3 text-text hover:bg-ink4"
          >
            Magic Link
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const applySession = useCallback((nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
    setStatus(nextSession?.user ? "authenticated" : "unauthenticated");
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      applySession(data.session ?? null);
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
      if (nextSession?.user) {
        setAuthModalOpen(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    applySession(null);
  }, [applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      session,
      authModalOpen,
      openAuthModal: () => setAuthModalOpen(true),
      closeAuthModal: () => setAuthModalOpen(false),
      signOut,
    }),
    [authModalOpen, session, signOut, status, user]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthDialog isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
