import {
  PDFDocument,
  PDFPage,
  PDFFont,
  StandardFonts,
  rgb,
} from "pdf-lib";

export type FinanceReportRow = {
  date: Date;
  type: "IN" | "OUT";
  description: string;
  programName: string | null;
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

function formatCurrency(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
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

export async function buildFinanceReportPdf(
  input: FinanceReportInput,
) {
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

  const drawTableHeader = () => {
    page.drawRectangle({
      x: MARGIN,
      y: y - 18,
      width: CONTENT_WIDTH,
      height: 22,
      color: rgb(0.95, 0.96, 0.97),
    });

    const labels = [
      ["No", MARGIN + 4],
      ["Tanggal", MARGIN + 34],
      ["Jenis", MARGIN + 98],
      ["Keterangan / Program", MARGIN + 146],
      ["Nominal", MARGIN + 430],
    ] as const;

    for (const [label, x] of labels) {
      page.drawText(label, {
        x,
        y: y - 10,
        size: 7.8,
        font: bold,
        color: rgb(0.25, 0.29, 0.34),
      });
    }

    y -= 26;
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
    input.rows.forEach((row, index) => {
      const description = row.programName
        ? `${row.description} | Program: ${row.programName}`
        : `${row.description} | Program: Umum`;

      const descriptionLines = wrapText(description, regular, 7.7, 270);
      const rowHeight = Math.max(24, 11 + descriptionLines.length * 10);
      ensureSpace(rowHeight + 4);

      const baseY = y;
      page.drawText(String(index + 1), {
        x: MARGIN + 4,
        y: baseY,
        size: 7.7,
        font: regular,
      });
      page.drawText(formatDate(row.date), {
        x: MARGIN + 34,
        y: baseY,
        size: 7.7,
        font: regular,
      });
      page.drawText(row.type === "IN" ? "Masuk" : "Keluar", {
        x: MARGIN + 98,
        y: baseY,
        size: 7.7,
        font: regular,
      });

      descriptionLines.forEach((line, lineIndex) => {
        page.drawText(line, {
          x: MARGIN + 146,
          y: baseY - lineIndex * 10,
          size: 7.7,
          font: regular,
          color: rgb(0.18, 0.21, 0.25),
        });
      });

      const amountText = `${row.type === "IN" ? "+" : "-"} ${formatCurrency(row.amount)}`;
      const amountWidth = bold.widthOfTextAtSize(amountText, 7.7);
      page.drawText(amountText, {
        x: PAGE_WIDTH - MARGIN - 4 - amountWidth,
        y: baseY,
        size: 7.7,
        font: bold,
        color:
          row.type === "IN"
            ? rgb(0.02, 0.43, 0.27)
            : rgb(0.70, 0.16, 0.12),
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
