import { useEffect, useEffectEvent, useState } from "react";
import { generateTotp } from "./totp";

function readSecretFromUrl() {
  return new URLSearchParams(window.location.search).get("2fa") ?? "";
}

function buildMissingSecretMessage() {
  return "Add a valid 2FA secret to the URL to generate a live code.";
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

  const title = error ? "Missing 2FA secret" : "Your live 2FA code";
  const subtitle = error
    ? error
    : "Copy the current code with one click. It refreshes automatically every 30 seconds.";
  const copyLabel = copied ? "Copied" : "Tap to copy";
  const secondsLabel = remaining === 1 ? "second" : "seconds";
  const cyclePercent = Math.round((remaining / 30) * 100);
  const panelClassName = copied
    ? "border-amber-300/20 shadow-[0_36px_90px_rgba(2,6,23,0.78)] ring-1 ring-amber-200/10"
    : "border-white/10 shadow-[0_32px_80px_rgba(2,6,23,0.72)]";
  const codeCardClassName = copied
    ? "border-amber-300/30 from-amber-300/10 via-slate-900 to-slate-950/95 shadow-[0_28px_80px_rgba(251,191,36,0.12)]"
    : "border-white/10 from-white/[0.06] via-slate-900 to-slate-950/95 shadow-[0_28px_80px_rgba(2,6,23,0.48)]";
  const timerStyle = {
    background: `conic-gradient(from -90deg, rgb(251 191 36) ${remaining * 12}deg, rgba(255,255,255,0.08) 0deg)`,
  };
  const progressWidth = `${(remaining / 30) * 100}%`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 antialiased">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,23,42,0),rgba(2,6,23,0.95)_58%)]" />
      <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.18),transparent_44%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute left-1/2 top-24 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl" />
      <div className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-fuchsia-500/5 blur-3xl" />
      <div className="absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-sky-500/5 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10 sm:px-8">
        <section
          className={`w-full max-w-3xl overflow-hidden rounded-[34px] border bg-slate-900/80 backdrop-blur-2xl transition-all duration-200 ${panelClassName}`}
        >
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300">
                <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.75)]" />
                {error ? "2FA required" : "Live authenticator"}
              </div>

              <div className="space-y-3">
                <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {title}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-400 sm:text-base sm:leading-7">{subtitle}</p>
              </div>
            </div>

            {!error ? (
              <>
                <button
                  className={`group relative mt-10 w-full cursor-pointer select-none overflow-hidden rounded-[32px] border bg-gradient-to-b px-6 py-6 text-left transition duration-300 ease-out [-webkit-tap-highlight-color:transparent] hover:-translate-y-0.5 hover:border-amber-300/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/60 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950 active:scale-[0.995] sm:px-8 sm:py-8 ${codeCardClassName}`}
                  onClick={handleCopy}
                  type="button"
                >
                  <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(252,211,77,0.18),transparent_58%)] opacity-80" />

                  <div className="relative flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Authenticator code</div>
                      <div className="mt-2 text-sm text-slate-400">One tap copies the current 2FA value.</div>
                    </div>

                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-slate-300 transition group-hover:border-amber-300/20 group-hover:text-white">
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

                  <div className="relative mt-8 flex items-end justify-between gap-4">
                    <div className="font-mono text-[3.35rem] font-semibold tracking-[0.24em] text-white sm:text-[5.5rem]">
                      {otp}
                    </div>
                    <div className="hidden rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right sm:block">
                      <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Refreshes in</div>
                      <div className="mt-1 text-3xl font-semibold tracking-tight text-white">{remaining}s</div>
                    </div>
                  </div>
                </button>

                <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_14rem]">
                  <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Refresh flow</div>
                        <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base">
                          A new code will be ready in {remaining} {secondsLabel}. No manual refresh is needed.
                        </p>
                      </div>
                      <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium text-slate-300">
                        {cyclePercent}%
                      </div>
                    </div>

                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-100 transition-[width] duration-1000 ease-linear"
                        style={{ width: progressWidth }}
                      />
                    </div>
                  </section>

                  <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                    <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Countdown</div>
                    <div className="mt-4 flex items-center justify-center">
                      <div className="relative grid aspect-square w-28 place-items-center rounded-full" style={timerStyle}>
                        <div className="absolute h-[92px] w-[92px] rounded-full border border-white/10 bg-slate-900 shadow-inner shadow-black/30" />
                        <div className="relative z-10 grid justify-items-center">
                          <strong className="text-[2rem] font-semibold leading-none text-white">{remaining}</strong>
                          <span className="mt-1 text-xs text-slate-400">sec</span>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </>
            ) : (
              <section className="mt-10 rounded-[28px] border border-rose-400/15 bg-rose-400/10 p-6">
                <div className="text-xs font-medium uppercase tracking-[0.18em] text-rose-300">Missing setup</div>
                <p className="mt-3 text-sm leading-6 text-rose-100/80 sm:text-base">{error}</p>
              </section>
            )}
          </div>
        </section>
      </div>

      <div
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-6 transition-all duration-300 ${
          copied ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="inline-flex items-center gap-3 rounded-full border border-amber-300/20 bg-slate-900/95 px-4 py-2 text-sm text-white shadow-2xl shadow-black/50 backdrop-blur-xl">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-300/15 text-amber-200">
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M5 13.5 9 17l10-10" />
            </svg>
          </span>
          Code copied to clipboard
        </div>
      </div>
    </main>
  );
}
