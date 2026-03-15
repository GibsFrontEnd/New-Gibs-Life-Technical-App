// @ts-nocheck

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoImg from "../assets/logo.jpg";

export interface QuotationSummaryRow {
  label: string;
  value: string;
}

export interface QuotationSummarySection {
  title: string;
  rows: QuotationSummaryRow[];
}

interface QuotationSummaryPdfOptions {
  title: string;
  subtitle?: string;
  quoteNumber: string;
  generatedDate: string;
  sections: QuotationSummarySection[];
  footerNote?: string;
}

const sanitizeText = (value: string): string => {
  if (!value) return "";
  return value
    .replace(/\u20A6/g, "NGN ")
    .replace(/₦/g, "NGN ")
    .replace(/\u00A0/g, " ")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .replace(/[^\x20-\x7E]/g, "");
};

export const generateQuotationSummaryPdf = (
  options: QuotationSummaryPdfOptions
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Add logo at top left
  const logoWidth = 30;
  const logoHeight = 15;
  doc.addImage(logoImg, "JPEG", margin, 10, logoWidth, logoHeight);

  // Company information at top right
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("FORTIS GLOBAL INSURANCE PLC", pageWidth - margin, 12, {
    align: "right",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("RC:40590", pageWidth - margin, 16, { align: "right" });
  doc.text("20c Akin Ogunlewe street,", pageWidth - margin, 20, {
    align: "right",
  });
  doc.text("Off Ligali Ayorinde Street", pageWidth - margin, 24, {
    align: "right",
  });
  doc.text("Victoria Island, Lagos", pageWidth - margin, 28, {
    align: "right",
  });

  // Title at center
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(sanitizeText(options.title), pageWidth / 2, 38, { align: "center" });

  // Quote details line
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const detailsY = 45;
  doc.text(`Quote No: ${sanitizeText(options.quoteNumber)}`, margin, detailsY);
  doc.text(
    `Date: ${sanitizeText(options.generatedDate)}`,
    pageWidth - margin,
    detailsY,
    { align: "right" }
  );

  // Separator line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, 49, pageWidth - margin, 49);

  let currentY = 55;

  // Render each section compactly
  options.sections.forEach((section) => {
    const rows = section.rows.filter((row) => row.value && row.value.trim());

    if (rows.length === 0) return; // Skip empty sections

    // Section header with gray background
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 7, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(
      sanitizeText(section.title).toUpperCase(),
      margin + 2,
      currentY + 5
    );

    currentY += 7;

    // Section content in a clean table
    autoTable(doc, {
      startY: currentY,
      body: rows.map((row) => [
        sanitizeText(row.label) + ":",
        sanitizeText(row.value),
      ]),
      theme: "plain",
      styles: {
        fontSize: 9,
        cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
        textColor: [0, 0, 0],
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: {
          cellWidth: 70,
          fontStyle: "normal",
          halign: "left",
        },
        1: {
          cellWidth: pageWidth - 2 * margin - 70,
          fontStyle: "normal",
        },
      },
      margin: { left: margin, right: margin },
    });
    currentY = (doc as any).lastAutoTable.finalY + 3;
  });

  // Footer separator
  const footerY = 280;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  // Footer text
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text(
    sanitizeText(options.footerNote || "Generated via GibsNonlife System"),
    pageWidth / 2,
    footerY + 5,
    { align: "center" }
  );

  doc.save(`${options.quoteNumber || "quotation"}-summary.pdf`);
};
