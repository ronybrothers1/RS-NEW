"use client";

/* eslint-disable @next/next/no-html-link-for-pages */

import type {
  CSSProperties,
} from "react";

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "32px 16px",
  margin: 0,
  background: "#f8fafc",
  color: "#0f172a",
  fontFamily:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "560px",
  padding: "36px 28px",
  border: "1px solid #e2e8f0",
  borderRadius: "24px",
  background: "#ffffff",
  boxShadow:
    "0 10px 30px rgba(15, 23, 42, 0.08)",
  textAlign: "center",
};

const labelStyle: CSSProperties = {
  margin: 0,
  color: "#0f766e",
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};

const headingStyle: CSSProperties = {
  margin: "12px 0 0",
  color: "#020617",
  fontSize: "28px",
  lineHeight: 1.2,
};

const textStyle: CSSProperties = {
  maxWidth: "440px",
  margin: "16px auto 0",
  color: "#475569",
  fontSize: "15px",
  lineHeight: 1.7,
};

const actionsStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "12px",
  marginTop: "28px",
};

const buttonStyle: CSSProperties = {
  minHeight: "44px",
  padding: "10px 20px",
  border: 0,
  borderRadius: "12px",
  background: "#0f766e",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
};

const linkStyle: CSSProperties = {
  minHeight: "44px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 20px",
  border: "1px solid #cbd5e1",
  borderRadius: "12px",
  background: "#ffffff",
  color: "#334155",
  fontSize: "14px",
  fontWeight: 700,
  textDecoration: "none",
  boxSizing: "border-box",
};

export default function GlobalError({
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body style={pageStyle}>
        <main style={cardStyle}>
          <p style={labelStyle}>
            Ruang Sejahtera
          </p>

          <h1 style={headingStyle}>
            Sistem belum dapat ditampilkan
          </h1>

          <p style={textStyle}>
            Terjadi kendala sementara pada aplikasi.
            Silakan coba kembali atau kembali ke beranda.
            Tidak ada detail teknis atau informasi internal
            yang ditampilkan pada halaman ini.
          </p>

          <div style={actionsStyle}>
            <button
              type="button"
              onClick={reset}
              style={buttonStyle}
            >
              Coba Lagi
            </button>

            <a
              href="/"
              style={linkStyle}
            >
              Ke Beranda
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}