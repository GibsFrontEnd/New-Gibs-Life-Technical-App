import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface QuotationPDFData {
  proposalNo: string;
  branch: string;
  riskType: string;
  party: string;
  marketingStaff: string;
  businessSource: string;
  period: string;
  coverDays: number;
  status: string;
  insuredName: string;
  insuredType: string;
  address: string;
  email: string;
  totalSumInsured: number;
  grossPremium: number;
  totalAdjustments: number;
  netPremium: number;
  proRataPremium: number;
  finalPremiumDue: number;
  generatedDate: string;
}

export const generateQuotationPDF = (data: QuotationPDFData): void => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Insurance Proposal', 105, 20, { align: 'center' });
  
  // Proposal Number
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Proposal No: ${data.proposalNo}`, 14, 35);
  
  // PROPOSAL SUMMARY Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPOSAL SUMMARY', 14, 50);
  
  // Proposal Summary Table
  autoTable(doc, {
    startY: 55,
    head: [['Field', 'Value']],
    body: [
      ['Branch:', data.branch],
      ['Risk Type:', data.riskType],
      ['Party:', data.party],
      ['Marketing Staff:', data.marketingStaff],
      ['Business Source:', data.businessSource],
      ['Period:', data.period],
      ['Cover Days:', data.coverDays.toString()],
      ['Status:', data.status],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 10 },
  });
  
  // INSURED DETAILS Section
  const summaryEnd = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INSURED DETAILS', 14, summaryEnd);
  
  autoTable(doc, {
    startY: summaryEnd + 5,
    head: [['Field', 'Details']],
    body: [
      ['Name:', data.insuredName],
      ['Type:', data.insuredType],
      ['Address:', data.address],
      ['Email:', data.email],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 10 },
  });
  
  // FINANCIAL SUMMARY Section
  const insuredEnd = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FINANCIAL SUMMARY', 14, insuredEnd);
  
  autoTable(doc, {
    startY: insuredEnd + 5,
    head: [['Description', 'Amount (NGN)']],
    body: [
      ['Total Sum Insured:', formatCurrency(data.totalSumInsured)],
      ['Gross Premium:', formatCurrency(data.grossPremium)],
      ['Total Adjustments:', formatCurrency(data.totalAdjustments)],
      ['Net Premium (Before Pro-Rata):', formatCurrency(data.netPremium)],
      ['Pro-Rata Premium:', formatCurrency(data.proRataPremium)],
      ['Final Premium Due:', formatCurrency(data.finalPremiumDue)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 10 },
  });
  
  // Footer
  const financialEnd = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${data.generatedDate}`, 14, financialEnd);
  doc.text(`Page 1 of 1`, 190, financialEnd, { align: 'right' });
  
  // Save the PDF
  doc.save(`Quotation_${data.proposalNo}.pdf`);
};

const formatCurrency = (amount: number): string => {
  return `NGN ${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};