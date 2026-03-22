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
    : "Tap the code once to copy it. A fresh code appears automatically every 30 seconds.";
  const copyLabel = copied ? "Copied to clipboard" : "Click to copy";
  const secondsLabel = remaining === 1 ? "second" : "seconds";

  return (
    <main className="shell">
      <section className={`card${copied ? " card-copied" : ""}`}>
        <div className="hero">
          <p className="eyebrow">{error ? "2FA required" : "One-time passcode"}</p>
          <h1>{title}</h1>
          <p className="intro">{subtitle}</p>
        </div>

        {!error ? (
          <>
            <button className={`code-card${copied ? " is-copied" : ""}`} onClick={handleCopy} type="button">
              <span className="label">Current code</span>
              <span className="otp">{otp}</span>
              <span className="copy-hint">{copyLabel}</span>
            </button>

            <section className="status-panel">
              <div className="timer-ring" style={{ "--progress": remaining / 30 }}>
                <div className="timer-core">
                  <strong>{remaining}</strong>
                  <span>s</span>
                </div>
              </div>

              <div className="status-copy">
                <span className="label">Auto refresh</span>
                <p>
                  A new code will be ready in {remaining} {secondsLabel}.
                </p>
              </div>
            </section>
          </>
        ) : (
          <section className="error-box">
            <span className="label">Missing setup</span>
            <p>{error}</p>
          </section>
        )}
      </section>
    </main>
  );
}
