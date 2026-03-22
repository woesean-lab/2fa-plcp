import { useEffect, useEffectEvent, useState } from "react";
import { generateTotp } from "./totp";

function readSecretFromUrl() {
  return new URLSearchParams(window.location.search).get("2fa") ?? "";
}

function buildMissingSecretMessage() {
  return "The `?2fa=` parameter is missing from the URL. Example: /?2fa=5VJG3DHWNSPS4WTJ";
}

function fallbackCopy(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "absolute";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

export default function App() {
  const [secret, setSecret] = useState(() => readSecretFromUrl());
  const [otp, setOtp] = useState("000000");
  const [remaining, setRemaining] = useState(30);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const syncSecret = () => {
      setSecret(readSecretFromUrl());
    };

    window.addEventListener("popstate", syncSecret);
    return () => {
      window.removeEventListener("popstate", syncSecret);
    };
  }, []);

  const refreshCode = useEffectEvent(() => {
    try {
      const now = Date.now();
      setOtp(generateTotp(secret, now));
      setRemaining(30 - (Math.floor(now / 1000) % 30));
      setError("");
    } catch (generationError) {
      setOtp("000000");
      setRemaining(30);
      setError(generationError.message || "An error occurred while generating the 2FA code.");
    }
  });

  useEffect(() => {
    if (!secret) {
      setOtp("000000");
      setRemaining(30);
      setError(buildMissingSecretMessage());
      return undefined;
    }

    refreshCode();
    const timerId = window.setInterval(refreshCode, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [secret]);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 1600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copied]);

  async function handleCopy() {
    if (error) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(otp);
      } else {
        fallbackCopy(otp);
      }
      setCopied(true);
    } catch {
      fallbackCopy(otp);
      setCopied(true);
    }
  }

  const title = error ? "No code available." : "Ready when you are.";
  const subtitle = error
    ? error
    : "Click the code to copy it instantly. A new TOTP code is generated every 30 seconds.";
  const copyLabel = copied ? "Copied to clipboard" : "Click to copy";
  const secondsLabel = remaining === 1 ? "second" : "seconds";
  const panelClassName = copied
    ? "border-emerald-400/20 shadow-2xl shadow-black/40 ring-1 ring-emerald-400/10"
    : "border-white/10 shadow-2xl shadow-black/40";
  const codeCardClassName = copied
    ? "border-emerald-400/30 bg-gradient-to-b from-emerald-400/10 to-slate-900/80"
    : "border-white/10 bg-gradient-to-b from-white/[0.07] to-slate-900/80";
  const timerStyle = {
    background: `conic-gradient(from -90deg, rgb(16 185 129) ${remaining * 12}deg, rgba(255,255,255,0.08) 0deg)`,
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 antialiased">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0),rgba(2,6,23,0.95)_58%)]" />
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.14),transparent_52%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10 sm:px-8">
        <section
          className={`w-full max-w-2xl rounded-3xl border bg-slate-900/80 p-6 backdrop-blur-xl transition-shadow duration-200 sm:p-8 ${panelClassName}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/10">
                {error ? "2FA required" : "Verification code"}
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
                <p className="max-w-xl text-sm leading-6 text-slate-400 sm:text-base">{subtitle}</p>
              </div>
            </div>

            {!error ? (
              <div className="hidden rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-right sm:block">
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Refreshes in</div>
                <div className="mt-1 text-2xl font-semibold tracking-tight text-white">{remaining}s</div>
              </div>
            ) : null}
          </div>

          {!error ? (
            <>
              <button
                className={`group mt-8 w-full rounded-3xl border px-6 py-6 text-left transition duration-200 hover:-translate-y-0.5 hover:border-emerald-400/30 hover:shadow-xl hover:shadow-black/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950 sm:px-8 sm:py-7 ${codeCardClassName}`}
                onClick={handleCopy}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">Current code</span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-300 transition group-hover:border-emerald-400/20 group-hover:text-slate-200">
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      viewBox="0 0 24 24"
                    >
                      {copied ? (
                        <path d="M5 13.5 9 17l10-10" />
                      ) : (
                        <>
                          <rect height="13" rx="2" width="13" x="8" y="8" />
                          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                        </>
                      )}
                    </svg>
                    {copyLabel}
                  </span>
                </div>

                <div className="mt-5 font-mono text-[2.85rem] font-semibold tracking-[0.22em] text-white sm:text-[4.25rem]">
                  {otp}
                </div>
              </button>

              <section className="mt-5 grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="relative mx-auto grid aspect-square w-28 place-items-center rounded-full" style={timerStyle}>
                    <div className="absolute h-24 w-24 rounded-full border border-white/10 bg-slate-900 shadow-inner shadow-black/30" />
                    <div className="relative z-10 grid justify-items-center">
                      <strong className="text-[2rem] font-semibold leading-none text-white">{remaining}</strong>
                      <span className="text-sm text-slate-400">s</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Auto refresh</div>
                  <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
                    A new code will be ready in {remaining} {secondsLabel}. This page keeps updating automatically, so
                    you can leave it open and just copy when needed.
                  </p>
                </div>
              </section>
            </>
          ) : (
            <section className="mt-8 rounded-2xl border border-rose-400/15 bg-rose-400/10 p-5">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-rose-300">Missing setup</div>
              <p className="mt-3 text-sm leading-6 text-rose-100/80 sm:text-base">{error}</p>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
