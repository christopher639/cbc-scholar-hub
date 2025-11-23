import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";

interface PrintablePerformanceReportProps {
  learner: any;
  performance: any[];
  academicYear: string;
  term: string;
  examType?: string;
}

export function PrintablePerformanceReport({ 
  learner, 
  performance, 
  academicYear, 
  term,
  examType 
}: PrintablePerformanceReportProps) {
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
          <title>Performance Report - ${learner.first_name} ${learner.last_name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 900px;
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
            .report-title {
              text-align: center;
              font-size: 20px;
              font-weight: bold;
              margin: 20px 0;
              text-transform: uppercase;
            }
            .student-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin: 20px 0;
              padding: 15px;
              background-color: #f9fafb;
              border-radius: 4px;
            }
            .info-row {
              display: flex;
              margin: 5px 0;
            }
            .info-label {
              font-weight: bold;
              width: 150px;
              color: #333;
            }
            .info-value {
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .grade-A { background-color: #d1fae5; }
            .grade-B { background-color: #dbeafe; }
            .grade-C { background-color: #fef3c7; }
            .grade-D { background-color: #fee2e2; }
            .grade-E { background-color: #fecaca; }
            .summary {
              margin-top: 30px;
              padding: 20px;
              background-color: #f9fafb;
              border-radius: 4px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-top: 15px;
            }
            .summary-item {
              text-align: center;
              padding: 15px;
              background-color: white;
              border-radius: 4px;
              border: 1px solid #e5e7eb;
            }
            .summary-label {
              font-size: 12px;
              color: #666;
              margin-bottom: 5px;
            }
            .summary-value {
              font-size: 20px;
              font-weight: bold;
              color: #333;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .signature-section {
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #333;
              width: 200px;
              margin: 30px auto 5px;
            }
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

  const getGradeClass = (grade: string) => {
    if (!grade) return "";
    const firstChar = grade.charAt(0).toUpperCase();
    return `grade-${firstChar}`;
  };

  const calculateAverage = () => {
    if (performance.length === 0) return 0;
    const total = performance.reduce((sum, p) => sum + Number(p.marks), 0);
    return (total / performance.length).toFixed(1);
  };

  const getGradeDistribution = () => {
    const distribution: Record<string, number> = {};
    performance.forEach(p => {
      const grade = p.grade_letter?.charAt(0) || "N/A";
      distribution[grade] = (distribution[grade] || 0) + 1;
    });
    return distribution;
  };

  return (
    <>
      <div className="flex gap-2">
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="mr-2 h-4 w-4" />
          Print Report
        </Button>
        <Button onClick={handlePrint} variant="default" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

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
            </div>
          </div>

          <div className="report-title">
            Academic Performance Report
          </div>

          <div className="student-info">
            <div>
              <div className="info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">{learner.first_name} {learner.last_name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Admission No:</span>
                <span className="info-value">{learner.admission_number}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Grade:</span>
                <span className="info-value">{learner.current_grade?.name}</span>
              </div>
              {learner.current_stream && (
                <div className="info-row">
                  <span className="info-label">Stream:</span>
                  <span className="info-value">{learner.current_stream.name}</span>
                </div>
              )}
            </div>
            <div>
              <div className="info-row">
                <span className="info-label">Academic Year:</span>
                <span className="info-value">{academicYear}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Term:</span>
                <span className="info-value">{term.replace("term_", "Term ")}</span>
              </div>
              {examType && (
                <div className="info-row">
                  <span className="info-label">Exam Type:</span>
                  <span className="info-value">{examType}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Report Date:</span>
                <span className="info-value">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style={{ width: "50px" }}>#</th>
                <th>Learning Area</th>
                <th style={{ width: "100px", textAlign: "center" }}>Exam Type</th>
                <th style={{ width: "100px", textAlign: "center" }}>Marks</th>
                <th style={{ width: "80px", textAlign: "center" }}>Grade</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {performance.map((record, index) => (
                <tr key={record.id}>
                  <td>{index + 1}</td>
                  <td>{record.learning_area?.name || "N/A"}</td>
                  <td style={{ textAlign: "center" }}>{record.exam_type || "N/A"}</td>
                  <td style={{ textAlign: "center", fontWeight: "bold" }}>{record.marks}/100</td>
                  <td style={{ textAlign: "center" }} className={getGradeClass(record.grade_letter || "")}>
                    <strong>{record.grade_letter || "N/A"}</strong>
                  </td>
                  <td style={{ fontSize: "12px" }}>{record.remarks || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="summary">
            <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "10px" }}>
              Performance Summary
            </div>
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-label">Total Subjects</div>
                <div className="summary-value">{performance.length}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Average Score</div>
                <div className="summary-value">{calculateAverage()}%</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Total Marks</div>
                <div className="summary-value">
                  {performance.reduce((sum, p) => sum + Number(p.marks), 0)}/{performance.length * 100}
                </div>
              </div>
            </div>
          </div>

          <div className="footer">
            <div className="signature-section">
              <div className="signature-line"></div>
              <div style={{ fontSize: "12px", color: "#666" }}>Class Teacher</div>
            </div>
            <div className="signature-section">
              <div className="signature-line"></div>
              <div style={{ fontSize: "12px", color: "#666" }}>Principal</div>
            </div>
            <div className="signature-section">
              <div className="signature-line"></div>
              <div style={{ fontSize: "12px", color: "#666" }}>Parent/Guardian</div>
            </div>
          </div>

          <div style={{ marginTop: "30px", textAlign: "center", fontSize: "10px", color: "#999" }}>
            Generated on {new Date().toLocaleString()} | This is a computer-generated report
          </div>
        </div>
      </div>
    </>
  );
}
