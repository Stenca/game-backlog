import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { queryClient } from "@/main";
import { useAuthStore } from "@/stores/authStore";

export function GoogleLoginButton() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const client = useRef<{
    requestCode: () => void;
  } | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = () => {
      if (!window.google) return;

      client.current = window.google.accounts.oauth2.initCodeClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: "openid email profile",
        ux_mode: "popup",
        callback: async (response) => {
          if (response.error || !response.code) {
            setError("Google authentication failed.");
            return;
          }

          setLoading(true);
          setError(null);

          try {
            const result = await fetch(
              `${import.meta.env.VITE_API_URL}/api/auth/google/exchange`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-Requested-With": "XmlHttpRequest",
                },
                body: JSON.stringify({ code: response.code }),
              },
            );

            const data = await result.json();

            if (!result.ok) {
              throw new Error(data.error || "Authentication failed.");
            }

            queryClient.clear();
            login(data.token, data.user);
            navigate("/games");
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Authentication failed.",
            );
          } finally {
            setLoading(false);
          }
        },
      });

      setIsReady(true);
    };

    if (window.google) {
      initialize();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initialize;
    script.onerror = () => setError("Failed to load Google Sign-In.");

    document.head.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [login, navigate]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => client.current?.requestCode()}
        disabled={!isReady || loading}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Signing in..."
          : isReady
            ? "Continue with Google"
            : "Loading Google..."}
      </button>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
