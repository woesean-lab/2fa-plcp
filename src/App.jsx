import { useEffect, useState } from "react";
import { generateTotp } from "./totp";

function readSecretFromUrl() {
  return new URLSearchParams(window.location.search).get("2fa") ?? "";
}

function buildMissingSecretMessage() {
  return "The `?2fa=` parameter is missing from the URL. Example: /?2fa=5VJG3DHWNSPS4WTJ";
}

export default function App() {
  const [secret, setSecret] = useState(() => readSecretFromUrl());
  const [otp, setOtp] = useState("000000");
  const [remaining, setRemaining] = useState(30);
  const [error, setError] = useState("");

  useEffect(() => {
    const syncSecret = () => {
      setSecret(readSecretFromUrl());
    };

    window.addEventListener("popstate", syncSecret);
    return () => {
      window.removeEventListener("popstate", syncSecret);
    };
  }, []);

  useEffect(() => {
    if (!secret) {
      setOtp("000000");
      setRemaining(30);
      setError(buildMissingSecretMessage());
      return undefined;
    }

    const refreshCode = () => {
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
    };

    refreshCode();
    const timerId = window.setInterval(refreshCode, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [secret]);

  return (
    <main className="shell">
      <section className="card">
        <div className="hero">
          <p className="eyebrow">React + Vite</p>
          <h1>2FA Code Generator</h1>
          <p className="intro">
            This page reads the <code>?2fa=SECRET</code> parameter from the URL and generates a 30-second TOTP code.
          </p>
        </div>

        {!error ? (
          <section className="code-card">
            <span className="label">Active Code</span>
            <div className="otp">{otp}</div>

            <div className="meta-grid">
              <div className="meta-box">
                <span className="label">Time Left</span>
                <strong>{remaining}s</strong>
              </div>

              <div className="meta-box">
                <span className="label">Secret</span>
                <strong className="secret">{secret}</strong>
              </div>
            </div>
          </section>
        ) : (
          <section className="error-box">{error}</section>
        )}

        <section className="hint-box">
          <span className="label">Example Link</span>
          <code>{window.location.origin}/?2fa=5VJG3DHWNSPS4WTJ</code>
        </section>
      </section>
    </main>
  );
}
