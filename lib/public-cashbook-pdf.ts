import {
  PDFDocument,
  type PDFFont,
  type PDFPage,
  StandardFonts,
  rgb,
} from "pdf-lib";

export type PublicCashbookPdfRow = {
  receiptNumber: string;
  date: Date;
  uraian: string;
  income: number;
  expense: number;
  balance: number;
};

export type PublicCashbookPdfInput = {
  periodLabel: string;
  openingBalance: number;
  cashIn: number;
  cashOut: number;
  closingBalance: number;
  generatedAt: Date;
  rows: PublicCashbookPdfRow[];
};

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const MARGIN = 32;
const FOOTER_Y = 18;

const COLUMNS = {
  receipt: {
    x: MARGIN + 4,
    width: 94,
  },
  date: {
    x: MARGIN + 102,
    width: 72,
  },
  description: {
    x: MARGIN + 178,
    width: 266,
  },
  income: {
    x: MARGIN + 448,
    width: 94,
  },
  expense: {
    x: MARGIN + 546,
    width: 94,
  },
  balance: {
    x: MARGIN + 644,
    width: 129,
  },
} as const;

function toPdfSafeText(
  value: string,
) {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .normalize("NFKD")
    .replace(/[\u0300-\u036F]/g, "")
    .replace(/[^\x20-\x7E]/g, "?");
}

function formatCurrency(
  value: number,
) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function formatDate(
  value: Date,
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    },
  ).format(value);
}

function formatDateTime(
  value: Date,
) {
  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    },
  ).format(value);
}

function splitLongToken(
  token: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
) {
  const parts: string[] = [];
  let current = "";

  for (const character of token) {
    const candidate =
      `${current}${character}`;

    if (
      current &&
      font.widthOfTextAtSize(
        candidate,
        size,
      ) > maxWidth
    ) {
      parts.push(current);
      current = character;
      continue;
    }

    current = candidate;
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
) {
  const clean =
    text
      .replace(/\s+/g, " ")
      .trim();

  if (!clean) {
    return [""];
  }

  const tokens =
    clean
      .split(" ")
      .flatMap(
        (token) =>
          font.widthOfTextAtSize(
            token,
            size,
          ) <= maxWidth
            ? [token]
            : splitLongToken(
                token,
                font,
                size,
                maxWidth,
              ),
      );

  const lines: string[] = [];
  let current = "";

  for (const token of tokens) {
    const candidate =
      current
        ? `${current} ${token}`
        : token;

    if (
      font.widthOfTextAtSize(
        candidate,
        size,
      ) <= maxWidth
    ) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    current = token;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function drawRightAligned({
  page,
  text,
  x,
  width,
  y,
  font,
  size,
}: {
  page: PDFPage;
  text: string;
  x: number;
  width: number;
  y: number;
  font: PDFFont;
  size: number;
}) {
  const textWidth =
    font.widthOfTextAtSize(
      text,
      size,
    );

  page.drawText(
    text,
    {
      x:
        Math.max(
          x,
          x +
            width -
            textWidth -
            4,
        ),
      y,
      size,
      font,
      color:
        rgb(
          0.10,
          0.14,
          0.12,
        ),
    },
  );
}

export async function buildPublicCashbookPdf(
  input: PublicCashbookPdfInput,
) {
  const pdf =
    await PDFDocument.create();

  const regular =
    await pdf.embedFont(
      StandardFonts.Helvetica,
    );

  const bold =
    await pdf.embedFont(
      StandardFonts.HelveticaBold,
    );

  let page!: PDFPage;
  let y = 0;

  const drawTableHeader = () => {
    page.drawRectangle({
      x: MARGIN,
      y: y - 17,
      width:
        PAGE_WIDTH -
        MARGIN * 2,
      height: 24,
      color:
        rgb(
          0.008,
          0.173,
          0.133,
        ),
    });

    const leftLabels = [
      ["Nomor Bukti", COLUMNS.receipt.x],
      ["Tanggal", COLUMNS.date.x],
      ["Uraian", COLUMNS.description.x],
    ] as const;

    for (const [label, x] of leftLabels) {
      page.drawText(
        label,
        {
          x,
          y: y - 9,
          size: 7.4,
          font: bold,
          color:
            rgb(
              1,
              1,
              1,
            ),
        },
      );
    }

    const rightLabels = [
      ["Penerimaan", COLUMNS.income],
      ["Pengeluaran", COLUMNS.expense],
      ["Saldo", COLUMNS.balance],
    ] as const;

    for (
      const [
        label,
        column,
      ] of rightLabels
    ) {
      const width =
        bold.widthOfTextAtSize(
          label,
          7.4,
        );

      page.drawText(
        label,
        {
          x:
            column.x +
            column.width -
            width -
            4,
          y: y - 9,
          size: 7.4,
          font: bold,
          color:
            rgb(
              1,
              1,
              1,
            ),
        },
      );
    }

    y -= 28;
  };

  const drawPageHeader = (
    continued: boolean,
  ) => {
    page =
      pdf.addPage(
        [
          PAGE_WIDTH,
          PAGE_HEIGHT,
        ],
      );

    y =
      PAGE_HEIGHT -
      MARGIN;

    page.drawText(
      "BUKU KAS",
      {
        x: MARGIN,
        y,
        size: 16,
        font: bold,
        color:
          rgb(
            0.008,
            0.173,
            0.133,
          ),
      },
    );

    y -= 19;

    page.drawText(
      "RUANG SEJAHTERA",
      {
        x: MARGIN,
        y,
        size: 12,
        font: bold,
        color:
          rgb(
            0.396,
            0.639,
            0.051,
          ),
      },
    );

    if (continued) {
      page.drawText(
        "LANJUTAN",
        {
          x: MARGIN + 126,
          y,
          size: 8,
          font: regular,
          color:
            rgb(
              0.35,
              0.40,
              0.37,
            ),
        },
      );
    }

    y -= 20;

    page.drawText(
      `Periode: ${input.periodLabel}`,
      {
        x: MARGIN,
        y,
        size: 8.5,
        font: regular,
        color:
          rgb(
            0.32,
            0.38,
            0.35,
          ),
      },
    );

    page.drawLine({
      start: {
        x: MARGIN,
        y: y - 9,
      },
      end: {
        x:
          PAGE_WIDTH -
          MARGIN,
        y: y - 9,
      },
      thickness: 0.6,
      color:
        rgb(
          0.86,
          0.88,
          0.87,
        ),
    });

    y -= 25;

    if (continued) {
      drawTableHeader();
    }
  };

  const ensureSpace = (
    height: number,
  ) => {
    if (
      y -
        height <
      FOOTER_Y +
        25
    ) {
      drawPageHeader(true);
    }
  };

  drawPageHeader(false);

  const summary = [
    [
      "Saldo Awal",
      input.openingBalance,
    ],
    [
      "Penerimaan",
      input.cashIn,
    ],
    [
      "Pengeluaran",
      input.cashOut,
    ],
    [
      "Sisa Saldo",
      input.closingBalance,
    ],
  ] as const;

  const summaryGap = 6;

  const summaryWidth =
    (
      PAGE_WIDTH -
      MARGIN * 2 -
      summaryGap * 3
    ) /
    4;

  summary.forEach(
    (
      [
        label,
        value,
      ],
      index,
    ) => {
      const x =
        MARGIN +
        index *
          (
            summaryWidth +
            summaryGap
          );

      page.drawRectangle({
        x,
        y: y - 31,
        width:
          summaryWidth,
        height: 38,
        color:
          index === 3
            ? rgb(
                0.925,
                0.984,
                0.945,
              )
            : rgb(
                0.965,
                0.968,
                0.961,
              ),
        borderColor:
          rgb(
            0.88,
            0.89,
            0.87,
          ),
        borderWidth: 0.5,
      });

      page.drawText(
        label,
        {
          x: x + 7,
          y: y - 7,
          size: 6.8,
          font: regular,
          color:
            rgb(
              0.35,
              0.40,
              0.37,
            ),
        },
      );

      page.drawText(
        formatCurrency(
          value,
        ),
        {
          x: x + 7,
          y: y - 22,
          size: 8,
          font: bold,
          color:
            rgb(
              0.06,
              0.20,
              0.15,
            ),
        },
      );
    },
  );

  y -= 48;

  drawTableHeader();

  if (input.rows.length === 0) {
    page.drawText(
      "Belum ada transaksi pada bulan berjalan.",
      {
        x: MARGIN + 4,
        y,
        size: 8.5,
        font: regular,
        color:
          rgb(
            0.40,
            0.44,
            0.42,
          ),
      },
    );
  }
  else {
    for (const row of input.rows) {
      const uraianLines =
        wrapText(
          toPdfSafeText(
            row.uraian,
          ),
          regular,
          7.1,
          COLUMNS.description.width -
            8,
        );

      const rowHeight =
        Math.max(
          25,
          12 +
            uraianLines.length *
              9,
        );

      ensureSpace(
        rowHeight +
          3,
      );

      const baseY =
        y;

      page.drawText(
        row.receiptNumber,
        {
          x:
            COLUMNS.receipt.x,
          y:
            baseY,
          size: 7,
          font: bold,
          color:
            rgb(
              0.025,
              0.33,
              0.24,
            ),
        },
      );

      page.drawText(
        formatDate(
          row.date,
        ),
        {
          x:
            COLUMNS.date.x,
          y:
            baseY,
          size: 7,
          font: regular,
        },
      );

      uraianLines.forEach(
        (
          line,
          index,
        ) => {
          page.drawText(
            line,
            {
              x:
                COLUMNS.description.x,
              y:
                baseY -
                index *
                  9,
              size: 7,
              font: regular,
              color:
                rgb(
                  0.12,
                  0.16,
                  0.14,
                ),
            },
          );
        },
      );

      drawRightAligned({
        page,
        text:
          row.income > 0
            ? formatCurrency(
                row.income,
              )
            : "-",
        x:
          COLUMNS.income.x,
        width:
          COLUMNS.income.width,
        y:
          baseY,
        font:
          row.income > 0
            ? bold
            : regular,
        size: 7,
      });

      drawRightAligned({
        page,
        text:
          row.expense > 0
            ? formatCurrency(
                row.expense,
              )
            : "-",
        x:
          COLUMNS.expense.x,
        width:
          COLUMNS.expense.width,
        y:
          baseY,
        font:
          row.expense > 0
            ? bold
            : regular,
        size: 7,
      });

      drawRightAligned({
        page,
        text:
          formatCurrency(
            row.balance,
          ),
        x:
          COLUMNS.balance.x,
        width:
          COLUMNS.balance.width,
        y:
          baseY,
        font: bold,
        size: 7,
      });

      y -=
        rowHeight;

      page.drawLine({
        start: {
          x: MARGIN,
          y: y + 5,
        },
        end: {
          x:
            PAGE_WIDTH -
            MARGIN,
          y: y + 5,
        },
        thickness: 0.3,
        color:
          rgb(
            0.90,
            0.91,
            0.90,
          ),
      });
    }
  }

  const pages =
    pdf.getPages();

  pages.forEach(
    (
      currentPage,
      index,
    ) => {
      currentPage.drawText(
        `Dicetak ${formatDateTime(input.generatedAt)} | Halaman ${index + 1} dari ${pages.length}`,
        {
          x: MARGIN,
          y: FOOTER_Y,
          size: 6.5,
          font: regular,
          color:
            rgb(
              0.46,
              0.49,
              0.47,
            ),
        },
      );
    },
  );

  return pdf.save();
}