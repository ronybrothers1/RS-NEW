type SendVerificationEmailInput = {
  to: string;
  code: string;
};

function escapeHtml(
  value: string,
) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendVerificationEmail({
  to,
  code,
}: SendVerificationEmailInput) {
  const apiKey =
    process.env.RESEND_API_KEY?.trim();

  const from =
    process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    throw new Error(
      "Konfigurasi pengiriman email belum tersedia.",
    );
  }

  const response =
    await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${apiKey}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject:
            "Kode Verifikasi Ruang Sejahtera",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
              <h2>Verifikasi Email</h2>
              <p>Gunakan kode berikut untuk memverifikasi akun Ruang Sejahtera:</p>
              <div style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0">
                ${escapeHtml(code)}
              </div>
              <p>Kode berlaku selama 10 menit.</p>
              <p>Jika Anda tidak melakukan pendaftaran, abaikan email ini.</p>
            </div>
          `,
        }),
      },
    );

  if (!response.ok) {
    const detail =
      await response
        .text()
        .catch(() => "");

    console.error(
      "Resend API error:",
      response.status,
      detail,
    );

    throw new Error(
      "Email verifikasi gagal dikirim.",
    );
  }
}