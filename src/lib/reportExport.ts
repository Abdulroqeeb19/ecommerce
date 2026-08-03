import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, HeadingLevel, AlignmentType, WidthType } from "docx";
import type { Order, SalesReportRow, ReportGranularity } from "./types";
import { formatPrice } from "./utils";

function reportData(rows: SalesReportRow[]) {
  return [
    ["Period", "Orders", "Units Sold", "Revenue (USD)"],
    ...rows.map((r) => [r.period, String(r.orders), String(r.unitsSold), String(r.revenue)]),
    ["TOTAL", String(rows.reduce((s, r) => s + r.orders, 0)), String(rows.reduce((s, r) => s + r.unitsSold, 0)), String(rows.reduce((s, r) => s + r.revenue, 0))]
  ];
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function buildReportRows(orders: Order[], granularity: ReportGranularity): SalesReportRow[] {
  const map = new Map<string, { label: string; orders: number; units: number; revenue: number }>();

  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const d = new Date(o.createdAt);
    let key: string;
    let label: string;
    if (granularity === "daily") {
      key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      label = d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } else if (granularity === "monthly") {
      key = `${d.getFullYear()}-${d.getMonth()}`;
      label = d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
    } else if (granularity === "quarterly") {
      const q = Math.floor(d.getMonth() / 3) + 1;
      key = `${d.getFullYear()}-Q${q}`;
      label = `Q${q} ${d.getFullYear()}`;
    } else {
      key = `${d.getFullYear()}`;
      label = `${d.getFullYear()}`;
    }

    const entry = map.get(key) || { label, orders: 0, units: 0, revenue: 0 };
    entry.orders += 1;
    entry.units += o.items.reduce((s, i) => s + i.qty, 0);
    entry.revenue += o.total;
    map.set(key, entry);
  }

  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([, v]) => ({
      period: v.label,
      label: v.label,
      orders: v.orders,
      unitsSold: v.units,
      revenue: v.revenue
    }));
}

export async function exportToExcel(rows: SalesReportRow[], granularity: ReportGranularity) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sales Report");

  const header = ws.addRow(["Gadget Hub - Sales Report"]);
  header.eachCell((c) => {
    c.font = { bold: true, size: 14, color: { argb: "1D4ED8" } };
  });
  ws.addRow([`Granularity: ${granularity.toUpperCase()}  ·  Generated: ${new Date().toLocaleString()}`]);
  ws.addRow([]);

  const tableRow = ws.addRow(["Period", "Orders", "Units Sold", "Revenue (USD)"]);
  tableRow.eachCell((c) => {
    c.font = { bold: true, color: { argb: "FFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1D4ED8" } };
  });

  rows.forEach((r) => ws.addRow([r.period, r.orders, r.unitsSold, r.revenue]));

  ws.addRow([
    "TOTAL",
    rows.reduce((s, r) => s + r.orders, 0),
    rows.reduce((s, r) => s + r.unitsSold, 0),
    rows.reduce((s, r) => s + r.revenue, 0)
  ]);

  ws.columns.forEach((col) => {
    col.width = 22;
  });

  const buffer = await wb.xlsx.writeBuffer();
  triggerDownload(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `gadget-hub-${granularity}-report-${Date.now()}.xlsx`);
}

export function exportToCsv(rows: SalesReportRow[], granularity: ReportGranularity) {
  const esc = (v: string) => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const lines = [
    ["Period", "Orders", "Units Sold", "Revenue (USD)"].map(esc).join(","),
    ...rows.map((r) => [r.period, String(r.orders), String(r.unitsSold), String(r.revenue)].map(esc).join(",")),
    ["TOTAL", String(rows.reduce((s, r) => s + r.orders, 0)), String(rows.reduce((s, r) => s + r.unitsSold, 0)), String(rows.reduce((s, r) => s + r.revenue, 0))].map(esc).join(",")
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `gadget-hub-${granularity}-report-${Date.now()}.csv`);
}

export function exportToPdf(rows: SalesReportRow[], granularity: ReportGranularity) {
  const doc = new jsPDF();
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  doc.setFontSize(18);
  doc.setTextColor(29, 78, 216);
  doc.text("Gadget Hub - Sales Report", 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Granularity: ${granularity.toUpperCase()}`, 14, 32);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);

  autoTable(doc, {
    startY: 46,
    head: [["Period", "Orders", "Units Sold", "Revenue (USD)"]],
    body: [
      ...rows.map((r) => [r.period, String(r.orders), String(r.unitsSold), formatPrice(r.revenue)]),
      ["TOTAL", String(rows.reduce((s, r) => s + r.orders, 0)), String(rows.reduce((s, r) => s + r.unitsSold, 0)), formatPrice(totalRevenue)]
    ],
    headStyles: { fillColor: [29, 78, 216] },
    footStyles: { fillColor: [15, 23, 42] }
  });
  doc.save(`gadget-hub-${granularity}-report-${Date.now()}.pdf`);
}

export async function exportToDocx(rows: SalesReportRow[], granularity: ReportGranularity) {
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Gadget Hub - Sales Report", bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Granularity: ${granularity.toUpperCase()}  ·  Generated: ${new Date().toLocaleString()}` })],
          }),
          new Paragraph({ children: [] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: ["Period", "Orders", "Units Sold", "Revenue (USD)"].map((t) =>
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: "FFFFFF" })] })], shading: { fill: "1D4ED8" } })
                )
              }),
              ...rows.map(
                (r) =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph({ children: [new TextRun(r.period)] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun(String(r.orders))] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun(String(r.unitsSold))] })] }),
                      new TableCell({ children: [new Paragraph({ children: [new TextRun(formatPrice(r.revenue))] })] })
                    ]
                  })
              ),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(rows.reduce((s, r) => s + r.orders, 0)), bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(rows.reduce((s, r) => s + r.unitsSold, 0)), bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatPrice(totalRevenue), bold: true })] })] })
                ]
              })
            ]
          })
        ]
      }
    ]
  });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gadget-hub-${granularity}-report-${Date.now()}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
