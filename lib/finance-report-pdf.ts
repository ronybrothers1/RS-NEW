import {
  PDFDocument,
  PDFPage,
  PDFFont,
  StandardFonts,
  rgb,
} from "pdf-lib";

import {
  buildPublicCashbookUraian,
} from "@/lib/public-cashbook";

export type FinanceReportRow = {
  date: Date;
  type: "IN" | "OUT";
  category:
    | "INCOME"
    | "EXPENSE"
    | "LOAN_OUT"
    | "LOAN_REPAYMENT";
  description: string;
  programName: string | null;
  donorName: string | null;
  isAnonymous: boolean;
  amount: number;
};

export type FinanceReportInput = {
  periodLabel: string;
  generatedAt: Date;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  closingBalance: number;
  rows: FinanceReportRow[];
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_Y = 25;

const ROW_LINE_SPACING = 10;
const TEXT_DESCENDER_FACTOR = 0.35;

const COL_NO = { x: 40, w: 25 };
const COL_TANGGAL = { x: 65, w: 55 };
const COL_URAIAN = { x: 120, w: 200 };
const COL_PENERIMAAN = { x: 320, w: 80 };
const COL_PENGELUARAN = { x: 400, w: 80 };
const COL_SALDO = { x: 480, w: 75 };

function formatCurrency(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function formatCurrencyPlain(value: number) {
  return Math.round(value).toLocaleString("id-ID");
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(value);
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [""];

  const words = clean.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines;
}

export async function buildFinanceReportPdf(input: FinanceReportInput) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page!: PDFPage;
  let y = 0;

  const drawPageHeader = (continued: boolean) => {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;

    page.drawText("YAYASAN RUANG SEJAHTERA", {
      x: MARGIN,
      y,
      size: 15,
      font: bold,
      color: rgb(0.06, 0.25, 0.27),
    });

    y -= 20;
    page.drawText(
      continued ? "LAPORAN KEUANGAN - LANJUTAN" : "LAPORAN KEUANGAN",
      {
        x: MARGIN,
        y,
        size: 11,
        font: bold,
        color: rgb(0.15, 0.18, 0.22),
      },
    );

    y -= 18;
    page.drawText(`Periode: ${input.periodLabel}`, {
      x: MARGIN,
      y,
      size: 9,
      font: regular,
      color: rgb(0.32, 0.36, 0.42),
    });

    page.drawLine({
      start: { x: MARGIN, y: y - 10 },
      end: { x: PAGE_WIDTH - MARGIN, y: y - 10 },
      thickness: 0.7,
      color: rgb(0.82, 0.84, 0.87),
    });

    y -= 26;
  };

  const drawTableHeader = () => {
    page.drawRectangle({
      x: MARGIN,
      y: y - 18,
      width: CONTENT_WIDTH,
      height: 22,
      color: rgb(0.06, 0.25, 0.27),
    });

    const size = 7.8;
    const textY = y - 10;
    const white = rgb(1, 1, 1);

    page.drawText("NO", {
      x: COL_NO.x + 4,
      y: textY,
      size,
      font: bold,
      color: white,
    });

    page.drawText("TANGGAL", {
      x: COL_TANGGAL.x + 4,
      y: textY,
      size,
      font: bold,
      color: white,
    });

    page.drawText("URAIAN", {
      x: COL_URAIAN.x + 4,
      y: textY,
      size,
      font: bold,
      color: white,
    });

    const pnrLabel = "PENERIMAAN";
    const pnrW = bold.widthOfTextAtSize(pnrLabel, size);
    page.drawText(pnrLabel, {
      x: COL_PENERIMAAN.x + COL_PENERIMAAN.w - 4 - pnrW,
      y: textY,
      size,
      font: bold,
      color: white,
    });

    const pglLabel = "PENGELUARAN";
    const pglW = bold.widthOfTextAtSize(pglLabel, size);
    page.drawText(pglLabel, {
      x: COL_PENGELUARAN.x + COL_PENGELUARAN.w - 4 - pglW,
      y: textY,
      size,
      font: bold,
      color: white,
    });

    const sldLabel = "SALDO";
    const sldW = bold.widthOfTextAtSize(sldLabel, size);
    page.drawText(sldLabel, {
      x: COL_SALDO.x + COL_SALDO.w - 4 - sldW,
      y: textY,
      size,
      font: bold,
      color: white,
    });

    y -= 26;
  };

  const ensureSpace = (height: number) => {
    if (y - height < FOOTER_Y + 25) {
      drawPageHeader(true);
      drawTableHeader();
    }
  };

  const drawSummaryRow = (
    label: string,
    value: string,
    valueColor = rgb(0.08, 0.10, 0.13),
  ) => {
    page.drawText(label, {
      x: MARGIN,
      y,
      size: 9.5,
      font: regular,
      color: rgb(0.34, 0.38, 0.44),
    });

    const width = bold.widthOfTextAtSize(value, 10);
    page.drawText(value, {
      x: PAGE_WIDTH - MARGIN - width,
      y,
      size: 10,
      font: bold,
      color: valueColor,
    });

    y -= 19;
  };

  drawPageHeader(false);

  drawSummaryRow("Saldo awal periode", formatCurrency(input.openingBalance));
  drawSummaryRow(
    "Total penerimaan",
    formatCurrency(input.totalIn),
    rgb(0.02, 0.45, 0.28),
  );
  drawSummaryRow(
    "Total pengeluaran",
    formatCurrency(input.totalOut),
    rgb(0.72, 0.17, 0.12),
  );
  drawSummaryRow("Saldo akhir periode", formatCurrency(input.closingBalance));

  y -= 5;
  drawTableHeader();

  if (input.rows.length === 0) {
    page.drawText("Tidak ada transaksi pada periode yang dipilih.", {
      x: MARGIN + 4,
      y,
      size: 9,
      font: regular,
      color: rgb(0.40, 0.44, 0.49),
    });
    y -= 22;
  } else {
    let runningBalance = input.openingBalance;

    input.rows.forEach((row, index) => {
      const amount = Number(row.amount);
      if (row.type === "IN") {
        runningBalance += amount;
      } else {
        runningBalance -= amount;
      }

      const uraian = buildPublicCashbookUraian({
        description: row.description,
        type: row.type,
        isAnonymous: row.isAnonymous,
        donorName: row.donorName,
        category: row.category,
        programName: row.programName,
      });

      const fontSize = 7.5;
      const uraianMaxWidth = COL_URAIAN.w - 8;
      const uraianLines = wrapText(
        uraian,
        regular,
        fontSize,
        uraianMaxWidth,
      );

      const rowHeight = Math.max(
        22,
        10 + uraianLines.length * ROW_LINE_SPACING,
      );
      ensureSpace(rowHeight + 4);

      const baseY = y;
      const rowCenter = baseY - rowHeight / 2;
      const singleLineBaseline =
        rowCenter - fontSize * TEXT_DESCENDER_FACTOR;

      const uraianBlockHeight =
        (uraianLines.length - 1) * ROW_LINE_SPACING;
      const uraianFirstBaseline =
        rowCenter +
        uraianBlockHeight / 2 -
        fontSize * TEXT_DESCENDER_FACTOR;

      page.drawText(String(index + 1), {
        x: COL_NO.x + 4,
        y: singleLineBaseline,
        size: fontSize,
        font: regular,
        color: rgb(0.30, 0.34, 0.40),
      });

      page.drawText(formatDate(row.date), {
        x: COL_TANGGAL.x + 4,
        y: singleLineBaseline,
        size: fontSize,
        font: regular,
        color: rgb(0.30, 0.34, 0.40),
      });

      uraianLines.forEach((line, lineIndex) => {
        page.drawText(line, {
          x: COL_URAIAN.x + 4,
          y:
            uraianFirstBaseline -
            lineIndex * ROW_LINE_SPACING,
          size: fontSize,
          font: regular,
          color: rgb(0.18, 0.21, 0.25),
        });
      });

      if (row.type === "IN") {
        const val = formatCurrencyPlain(amount);
        const w = regular.widthOfTextAtSize(val, fontSize);
        page.drawText(val, {
          x: COL_PENERIMAAN.x + COL_PENERIMAAN.w - 4 - w,
          y: singleLineBaseline,
          size: fontSize,
          font: regular,
          color: rgb(0.02, 0.43, 0.27),
        });
      } else {
        const val = "—";
        const w = regular.widthOfTextAtSize(val, fontSize);
        page.drawText(val, {
          x: COL_PENERIMAAN.x + COL_PENERIMAAN.w - 4 - w,
          y: singleLineBaseline,
          size: fontSize,
          font: regular,
          color: rgb(0.60, 0.63, 0.68),
        });
      }

      if (row.type === "OUT") {
        const val = formatCurrencyPlain(amount);
        const w = regular.widthOfTextAtSize(val, fontSize);
        page.drawText(val, {
          x: COL_PENGELUARAN.x + COL_PENGELUARAN.w - 4 - w,
          y: singleLineBaseline,
          size: fontSize,
          font: regular,
          color: rgb(0.70, 0.16, 0.12),
        });
      } else {
        const val = "—";
        const w = regular.widthOfTextAtSize(val, fontSize);
        page.drawText(val, {
          x: COL_PENGELUARAN.x + COL_PENGELUARAN.w - 4 - w,
          y: singleLineBaseline,
          size: fontSize,
          font: regular,
          color: rgb(0.60, 0.63, 0.68),
        });
      }

      const saldoVal = formatCurrencyPlain(runningBalance);
      const saldoW = bold.widthOfTextAtSize(saldoVal, fontSize);
      page.drawText(saldoVal, {
        x: COL_SALDO.x + COL_SALDO.w - 4 - saldoW,
        y: singleLineBaseline,
        size: fontSize,
        font: bold,
        color: rgb(0.08, 0.10, 0.13),
      });

      y -= rowHeight;
      page.drawLine({
        start: { x: MARGIN, y: y + 5 },
        end: { x: PAGE_WIDTH - MARGIN, y: y + 5 },
        thickness: 0.35,
        color: rgb(0.90, 0.91, 0.93),
      });
    });
  }

  const pages = pdf.getPages();
  pages.forEach((item, index) => {
    const footer = `Dicetak ${formatDateTime(input.generatedAt)} | Halaman ${index + 1} dari ${pages.length}`;
    item.drawText(footer, {
      x: MARGIN,
      y: FOOTER_Y,
      size: 7,
      font: regular,
      color: rgb(0.46, 0.49, 0.54),
    });
  });

  return pdf.save();
}