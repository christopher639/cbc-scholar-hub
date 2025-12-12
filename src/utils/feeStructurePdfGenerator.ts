import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface FeeStructureItem {
  id: string;
  item_name: string;
  amount: number;
  description?: string;
}

interface FeeStructure {
  id: string;
  academic_year: string;
  term: string;
  amount: number;
  description?: string;
  grade?: { name: string };
  category?: { name: string };
  fee_structure_items?: FeeStructureItem[];
}

interface SchoolInfo {
  school_name?: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  motto?: string;
}

export async function generateFeeStructurePDF(
  structures: FeeStructure[],
  schoolInfo: SchoolInfo | null,
  academicYear: string,
  gradeName?: string
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = margin;

  // Try to add school logo
  if (schoolInfo?.logo_url) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = schoolInfo.logo_url!;
      });
      const logoSize = 25;
      doc.addImage(img, "PNG", (pageWidth - logoSize) / 2, yPos, logoSize, logoSize);
      yPos += logoSize + 5;
    } catch (e) {
      console.log("Could not load logo:", e);
    }
  }

  // School Name
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(schoolInfo?.school_name || "School", pageWidth / 2, yPos, { align: "center" });
  yPos += 7;

  // School details
  if (schoolInfo?.address || schoolInfo?.phone || schoolInfo?.email) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    const details = [schoolInfo.address, schoolInfo.phone, schoolInfo.email].filter(Boolean).join(" | ");
    doc.text(details, pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }

  if (schoolInfo?.motto) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(`"${schoolInfo.motto}"`, pageWidth / 2, yPos, { align: "center" });
    yPos += 5;
  }

  doc.setTextColor(0);

  // Title
  yPos += 5;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("FEE STRUCTURE", pageWidth / 2, yPos, { align: "center" });
  yPos += 7;

  // Subtitle with academic year and grade
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let subtitle = `Academic Year: ${academicYear}`;
  if (gradeName) {
    subtitle += ` | Grade: ${gradeName}`;
  }
  doc.text(subtitle, pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  // Group structures by term
  const termData: { [key: string]: FeeStructure[] } = {
    term_1: [],
    term_2: [],
    term_3: [],
  };

  structures.forEach((s) => {
    if (termData[s.term]) {
      termData[s.term].push(s);
    }
  });

  // Calculate column widths for 3-column layout
  const colWidth = (pageWidth - margin * 2 - 10) / 3;
  const colX = [margin, margin + colWidth + 5, margin + (colWidth + 5) * 2];

  // Draw term headers
  doc.setFillColor(41, 128, 185);
  doc.setTextColor(255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");

  const headerHeight = 8;
  ["TERM 1", "TERM 2", "TERM 3"].forEach((term, idx) => {
    doc.rect(colX[idx], yPos, colWidth, headerHeight, "F");
    doc.text(term, colX[idx] + colWidth / 2, yPos + 5.5, { align: "center" });
  });

  yPos += headerHeight + 3;
  doc.setTextColor(0);

  // Get fee items for each term
  const getTermItems = (termStructures: FeeStructure[]) => {
    const items: { name: string; amount: number }[] = [];
    termStructures.forEach((s) => {
      if (s.fee_structure_items && s.fee_structure_items.length > 0) {
        s.fee_structure_items.forEach((item) => {
          items.push({ name: item.item_name, amount: Number(item.amount) });
        });
      } else {
        items.push({
          name: s.category?.name || s.description || "Tuition Fee",
          amount: Number(s.amount),
        });
      }
    });
    return items;
  };

  const term1Items = getTermItems(termData.term_1);
  const term2Items = getTermItems(termData.term_2);
  const term3Items = getTermItems(termData.term_3);

  // Find max rows
  const maxRows = Math.max(term1Items.length, term2Items.length, term3Items.length, 1);

  // Draw items
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const rowHeight = 6;
  const startY = yPos;

  [term1Items, term2Items, term3Items].forEach((items, colIdx) => {
    let currentY = startY;
    items.forEach((item) => {
      // Draw border
      doc.setDrawColor(200);
      doc.rect(colX[colIdx], currentY, colWidth, rowHeight);

      // Item name (left aligned with padding)
      doc.text(item.name.substring(0, 20), colX[colIdx] + 2, currentY + 4);

      // Amount (right aligned)
      const amountText = `KSh ${item.amount.toLocaleString()}`;
      doc.text(amountText, colX[colIdx] + colWidth - 2, currentY + 4, { align: "right" });

      currentY += rowHeight;
    });

    // Fill empty rows
    for (let i = items.length; i < maxRows; i++) {
      doc.setDrawColor(200);
      doc.rect(colX[colIdx], currentY, colWidth, rowHeight);
      currentY += rowHeight;
    }
  });

  yPos = startY + maxRows * rowHeight + 3;

  // Calculate totals
  const term1Total = term1Items.reduce((sum, i) => sum + i.amount, 0);
  const term2Total = term2Items.reduce((sum, i) => sum + i.amount, 0);
  const term3Total = term3Items.reduce((sum, i) => sum + i.amount, 0);
  const grandTotal = term1Total + term2Total + term3Total;

  // Draw term totals
  doc.setFillColor(240, 240, 240);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);

  [term1Total, term2Total, term3Total].forEach((total, idx) => {
    doc.rect(colX[idx], yPos, colWidth, rowHeight + 2, "F");
    doc.setDrawColor(200);
    doc.rect(colX[idx], yPos, colWidth, rowHeight + 2);
    doc.text("Total:", colX[idx] + 2, yPos + 5);
    doc.text(`KSh ${total.toLocaleString()}`, colX[idx] + colWidth - 2, yPos + 5, { align: "right" });
  });

  yPos += rowHeight + 8;

  // Grand total
  doc.setFillColor(41, 128, 185);
  doc.setTextColor(255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  const grandTotalWidth = pageWidth - margin * 2;
  doc.rect(margin, yPos, grandTotalWidth, 10, "F");
  doc.text("TOTAL ANNUAL FEES:", margin + 10, yPos + 7);
  doc.text(`KSh ${grandTotal.toLocaleString()}`, pageWidth - margin - 10, yPos + 7, { align: "right" });

  yPos += 20;
  doc.setTextColor(0);

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120);
  doc.text(`Generated on: ${format(new Date(), "PPP 'at' p")}`, pageWidth / 2, yPos, { align: "center" });

  // Save PDF
  const fileName = `fee-structure-${academicYear.replace(/\//g, "-")}${gradeName ? `-${gradeName.replace(/\s+/g, "-")}` : ""}.pdf`;
  doc.save(fileName);
}
