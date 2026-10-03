"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import {
  ASSISTANCE_STATUS_META,
  formatRupiah,
  type AssistanceApplicationStatus,
} from "@/lib/assistance";

type Props = {
  q: string;
  status: string;
  programId: string;
  programName: string;
  disabled?: boolean;
};

type ApiResponse = {
  generatedAt: string;
  filters: {
    status: string;
    programId: string;
    q: string;
  };
  rows: Array<{
    id: string;
    title: string;
    beneficiaryName: string;
    applicantName: string;
    programName: string;
    village: string;
    subdistrict: string | null;
    regency: string | null;
    targetAmount: string | number | null;
    status: string;
    submittedAt: string | null;
  }>;
};

function formatDateShort(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(d);
}

export default function DownloadPengajuanPdfButton({
  q,
  status,
  programId,
  programName,
  disabled,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (loading || disabled) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (programId) params.set("program", programId);

      const url =
        "/admin/pengajuan/export-data" +
        (params.toString() ? `?${params}` : "");

      const res = await fetch(url, { cache: "no-store" });

      if (!res.ok) {
        setError("Gagal memuat data pengajuan.");
        return;
      }

      const data = (await res.json()) as ApiResponse;

      const { jsPDF } = await import("jspdf");
      const autoTableMod = await import("jspdf-autotable");
      const autoTable = autoTableMod.default;

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;

      // ==== HEADER ====
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(13, 148, 136);
      doc.text("RUANG SEJAHTERA", margin, 14);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Yayasan Ruang Sejahtera", margin, 19);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(
        "Laporan Daftar Pengajuan Bantuan",
        margin,
        28,
      );

      doc.setDrawColor(13, 148, 136);
      doc.setLineWidth(0.5);
      doc.line(margin, 31, pageWidth - margin, 31);

      // ==== INFO FILTER ====
      const generatedAt = new Date(data.generatedAt);

      const statusLabel = status
        ? ASSISTANCE_STATUS_META[
            status as AssistanceApplicationStatus
          ]?.label ?? status
        : "Semua status";

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);

      let infoY = 38;
      doc.text(`Status: ${statusLabel}`, margin, infoY);
      doc.text(
        `Program: ${programName || "Semua program"}`,
        margin + 80,
        infoY,
      );
      doc.text(
        `Jumlah data: ${data.rows.length}`,
        margin + 160,
        infoY,
      );

      infoY += 5;
      doc.text(
        `Dicetak: ${new Intl.DateTimeFormat("id-ID", {
          dateStyle: "long",
          timeStyle: "short",
          timeZone: "Asia/Jakarta",
        }).format(generatedAt)}`,
        margin,
        infoY,
      );

      // ==== TABEL ====
      const body = data.rows.map((r, i) => [
        String(i + 1),
        r.title,
        r.beneficiaryName,
        r.applicantName,
        r.programName,
        `${r.village}${r.subdistrict ? `, ${r.subdistrict}` : ""}`,
        formatRupiah(r.targetAmount),
        ASSISTANCE_STATUS_META[
          r.status as AssistanceApplicationStatus
        ]?.label ?? r.status,
        formatDateShort(r.submittedAt),
      ]);

      autoTable(doc, {
        startY: infoY + 4,
        head: [
          [
            "No",
            "Judul Pengajuan",
            "Penerima",
            "Pemohon",
            "Program",
            "Lokasi",
            "Target",
            "Status",
            "Dikirim",
          ],
        ],
        body:
          body.length > 0
            ? body
            : [["-", "Belum ada data", "", "", "", "", "", "", ""]],
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 2,
          valign: "middle",
          overflow: "linebreak",
          textColor: [30, 41, 59],
        },
        headStyles: {
          fillColor: [13, 148, 136],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8.5,
          halign: "center",
        },
        alternateRowStyles: {
          fillColor: [240, 253, 250],
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: 62 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30 },
          5: { cellWidth: 45 },
          6: { cellWidth: 28, halign: "right" },
          7: { cellWidth: 22, halign: "center" },
          8: { cellWidth: 20, halign: "center" },
        },
        margin: {
          top: 40,
          left: margin,
          right: margin,
          bottom: 16,
        },
      });

      // ==== FOOTER SEMUA HALAMAN ====
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Halaman ${i} dari ${pageCount}`,
          pageWidth / 2,
          pageHeight - 6,
          { align: "center" },
        );
        doc.text("Ruang Sejahtera", margin, pageHeight - 6);
        doc.text(
          generatedAt.toISOString().slice(0, 10),
          pageWidth - margin,
          pageHeight - 6,
          { align: "right" },
        );
      }

      // ==== SIMPAN ====
      const safeStatus = status
        ? status.toLowerCase()
        : "semua-status";
      const dateStr = generatedAt
        .toISOString()
        .slice(0, 10);
      const filename = `Pengajuan-${safeStatus}-${dateStr}.pdf`;

      doc.save(filename);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat membuat PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || disabled}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Menyiapkan PDF...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Download PDF
          </>
        )}
      </button>
      {error && (
        <p className="text-xs font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}