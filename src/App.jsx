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
    : "Tap once to copy. The code refreshes quietly in the background every 30 seconds.";
  const copyLabel = copied ? "Copied to clipboard" : "Click to copy";
  const secondsLabel = remaining === 1 ? "second" : "seconds";
  const panelClassName = copied
    ? "border-[#b9d6cb]/20 shadow-[0_30px_80px_rgba(0,0,0,0.42),0_0_0_1px_rgba(185,214,203,0.14)]"
    : "border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.42)]";
  const codeCardClassName = copied
    ? "border-[#b9d6cb]/45 bg-[linear-gradient(180deg,rgba(185,214,203,0.12),rgba(255,255,255,0.02)),rgba(21,28,36,0.98)]"
    : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.015),rgba(255,255,255,0.02)),rgba(21,28,36,0.98)]";
  const timerStyle = {
    background: `conic-gradient(from -90deg, rgba(185,214,203,1) ${remaining * 12}deg, rgba(255,255,255,0.08) 0deg)`,
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0d12] font-sans text-slate-100 antialiased">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.025),transparent_38%),linear-gradient(180deg,#141a22_0%,#0a0d12_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
      <div className="absolute left-[10%] top-[6%] h-72 w-72 rounded-full bg-[#b9d6cb]/20 blur-[100px]" />
      <div className="absolute bottom-[8%] right-[8%] h-64 w-64 rounded-full bg-[#d2a76a]/15 blur-[100px]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10 sm:px-8">
        <section
          className={`w-full max-w-[36.5rem] rounded-[2rem] border bg-[linear-gradient(180deg,rgba(24,31,40,0.96),rgba(13,17,23,0.98))] p-6 backdrop-blur-xl transition-shadow duration-200 sm:p-8 ${panelClassName}`}
        >
          <div className="space-y-2">
            <p className="text-[0.78rem] uppercase tracking-[0.14em] text-[#9bcbbf]">
              {error ? "2FA required" : "Verification code"}
            </p>
            <h1 className="text-[clamp(2.15rem,5vw,3.5rem)] font-semibold tracking-[-0.05em] text-slate-50">
              {title}
            </h1>
            <p className="max-w-[40ch] text-base leading-7 text-slate-400">{subtitle}</p>
          </div>

          {!error ? (
            <>
              <button
                className={`mt-7 w-full rounded-[1.5rem] border px-6 py-6 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#b9d6cb]/30 hover:shadow-[0_18px_42px_rgba(0,0,0,0.22)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#cce8df]/70 focus-visible:ring-offset-4 focus-visible:ring-offset-[#10151c] ${codeCardClassName}`}
                onClick={handleCopy}
                type="button"
              >
                <span className="text-[0.78rem] uppercase tracking-[0.14em] text-[#9bcbbf]">Current code</span>
                <span className="mt-3 block font-mono text-[clamp(2.9rem,10vw,4.8rem)] font-black tracking-[0.12em] text-slate-50">
                  {otp}
                </span>
                <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-sm text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-current opacity-60" />
                  {copyLabel}
                </span>
              </button>

              <section className="mt-5 grid gap-4 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-[112px_minmax(0,1fr)] sm:items-center">
                <div className="relative mx-auto grid aspect-square w-28 place-items-center rounded-full" style={timerStyle}>
                  <div className="absolute h-[96px] w-[96px] rounded-full bg-[linear-gradient(180deg,rgba(19,25,32,0.98),rgba(12,16,22,0.98))] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]" />
                  <div className="relative z-10 grid justify-items-center">
                    <strong className="text-[2rem] leading-none text-slate-50">{remaining}</strong>
                    <span className="text-sm text-slate-400">s</span>
                  </div>
                </div>

                <div className="grid gap-2 text-center sm:text-left">
                  <span className="text-[0.78rem] uppercase tracking-[0.14em] text-[#9bcbbf]">Auto refresh</span>
                  <p className="m-0 text-base leading-7 text-slate-400">
                    A new code will be ready in {remaining} {secondsLabel}.
                  </p>
                </div>
              </section>
            </>
          ) : (
            <section className="mt-5 rounded-[1.4rem] border border-rose-200/15 bg-[linear-gradient(180deg,rgba(45,19,25,0.78),rgba(22,11,14,0.94))] p-5 text-[#f0bac2]">
              <span className="text-[0.78rem] uppercase tracking-[0.14em] text-[#f0bac2]">Missing setup</span>
              <p className="m-0 mt-2 text-base leading-7 text-[#d8b5bc]">{error}</p>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
