import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";

interface PrintableInvoiceProps {
  invoice: any;
}

export function PrintableInvoice({ invoice }: PrintableInvoiceProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { schoolInfo } = useSchoolInfo();

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .logo {
              max-width: 100px;
              margin-bottom: 10px;
            }
            .school-name {
              font-size: 24px;
              font-weight: bold;
              margin: 10px 0;
            }
            .school-details {
              font-size: 12px;
              color: #666;
            }
            .invoice-info {
              display: flex;
              justify-content: space-between;
              margin: 20px 0;
            }
            .info-section {
              flex: 1;
            }
            .info-label {
              font-weight: bold;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .totals {
              margin-top: 20px;
              text-align: right;
            }
            .total-row {
              display: flex;
              justify-content: flex-end;
              margin: 5px 0;
              font-size: 14px;
            }
            .total-label {
              width: 150px;
              font-weight: bold;
            }
            .total-value {
              width: 150px;
              text-align: right;
            }
            .grand-total {
              font-size: 18px;
              border-top: 2px solid #333;
              padding-top: 10px;
              margin-top: 10px;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
            }
            .status-generated { background-color: #fef3c7; color: #92400e; }
            .status-partial { background-color: #dbeafe; color: #1e40af; }
            .status-paid { background-color: #d1fae5; color: #065f46; }
            .status-overdue { background-color: #fee2e2; color: #991b1b; }
            .status-cancelled { background-color: #f3f4f6; color: #374151; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const getStatusClass = (status: string) => {
    const statusMap: Record<string, string> = {
      generated: "status-generated",
      partial: "status-partial",
      paid: "status-paid",
      overdue: "status-overdue",
      cancelled: "status-cancelled",
    };
    return statusMap[status] || "status-generated";
  };

  return (
    <>
      <Button onClick={handlePrint} variant="outline" size="sm">
        <Printer className="mr-2 h-4 w-4" />
        Print Invoice
      </Button>

      <div style={{ display: "none" }}>
        <div ref={printRef}>
          <div className="header">
            {schoolInfo?.logo_url && (
              <img src={schoolInfo.logo_url} alt="School Logo" className="logo" />
            )}
            <div className="school-name">{schoolInfo?.school_name || "School Name"}</div>
            <div className="school-details">
              {schoolInfo?.address && <div>{schoolInfo.address}</div>}
              {schoolInfo?.phone && <div>Tel: {schoolInfo.phone}</div>}
              {schoolInfo?.email && <div>Email: {schoolInfo.email}</div>}
              {schoolInfo?.motto && <div style={{ fontStyle: "italic", marginTop: "5px" }}>{schoolInfo.motto}</div>}
            </div>
          </div>

          <h2 style={{ textAlign: "center", margin: "20px 0" }}>FEE INVOICE</h2>

          <div className="invoice-info">
            <div className="info-section">
              <div style={{ marginBottom: "8px" }}>
                <span className="info-label">Invoice Number:</span> {invoice.invoice_number}
              </div>
              <div style={{ marginBottom: "8px" }}>
                <span className="info-label">Issue Date:</span> {new Date(invoice.issue_date).toLocaleDateString()}
              </div>
              <div style={{ marginBottom: "8px" }}>
                <span className="info-label">Due Date:</span> {new Date(invoice.due_date).toLocaleDateString()}
              </div>
              <div>
                <span className="info-label">Status:</span>{" "}
                <span className={`status-badge ${getStatusClass(invoice.status)}`}>
                  {invoice.status.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="info-section">
              <div style={{ marginBottom: "8px" }}>
                <span className="info-label">Learner:</span> {invoice.learner?.first_name} {invoice.learner?.last_name}
              </div>
              <div style={{ marginBottom: "8px" }}>
                <span className="info-label">Admission No:</span> {invoice.learner?.admission_number}
              </div>
              <div style={{ marginBottom: "8px" }}>
                <span className="info-label">Grade:</span> {invoice.grade?.name}
              </div>
              {invoice.stream && (
                <div style={{ marginBottom: "8px" }}>
                  <span className="info-label">Stream:</span> {invoice.stream.name}
                </div>
              )}
              <div style={{ marginBottom: "8px" }}>
                <span className="info-label">Academic Year:</span> {invoice.academic_year}
              </div>
              <div>
                <span className="info-label">Term:</span> {invoice.term.replace("term_", "Term ")}
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style={{ width: "50px" }}>#</th>
                <th>Fee Item</th>
                <th style={{ width: "150px", textAlign: "right" }}>Amount (KSh)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.line_items?.map((item: any, index: number) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>
                    {item.item_name}
                    {item.description && (
                      <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals">
            <div className="total-row">
              <div className="total-label">Subtotal:</div>
              <div className="total-value">{formatCurrency(invoice.total_amount)}</div>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="total-row">
                <div className="total-label">Discount:</div>
                <div className="total-value">-{formatCurrency(invoice.discount_amount)}</div>
              </div>
            )}
            <div className="total-row grand-total">
              <div className="total-label">Total Amount Due:</div>
              <div className="total-value">{formatCurrency(invoice.balance_due)}</div>
            </div>
            <div className="total-row">
              <div className="total-label">Amount Paid:</div>
              <div className="total-value">{formatCurrency(invoice.amount_paid)}</div>
            </div>
            <div className="total-row grand-total" style={{ color: invoice.balance_due > invoice.amount_paid ? "#dc2626" : "#16a34a" }}>
              <div className="total-label">Balance:</div>
              <div className="total-value">{formatCurrency(invoice.balance_due - invoice.amount_paid)}</div>
            </div>
          </div>

          {invoice.notes && (
            <div style={{ marginTop: "30px", padding: "15px", backgroundColor: "#f9fafb", borderRadius: "4px" }}>
              <div style={{ fontWeight: "bold", marginBottom: "5px" }}>Notes:</div>
              <div style={{ fontSize: "14px" }}>{invoice.notes}</div>
            </div>
          )}

          <div className="footer">
            <div>Thank you for your prompt payment</div>
            <div style={{ marginTop: "10px" }}>This is a computer-generated invoice and does not require a signature</div>
          </div>
        </div>
      </div>
    </>
  );
}
