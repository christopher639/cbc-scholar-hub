import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { useExamTypes } from "@/hooks/useExamTypes";
import { useGradingScales } from "@/hooks/useGradingScales";
import { useReactToPrint } from "react-to-print";

interface PrintablePerformanceReportProps {
  learner: any;
  performance: any[];
  academicYear: string;
  term: string;
  examType?: string;
  gradePosition?: number;
  totalInGrade?: number;
  streamPosition?: number;
  totalInStream?: number;
}

export function PrintablePerformanceReport({ 
  learner, 
  performance, 
  academicYear, 
  term,
  examType,
  gradePosition,
  totalInGrade,
  streamPosition,
  totalInStream
}: PrintablePerformanceReportProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { schoolInfo } = useSchoolInfo();
  const { examTypes } = useExamTypes();
  const { gradingScales, getGrade } = useGradingScales();

  // Get active exam types sorted by display order
  const activeExamTypes = examTypes
    .filter(et => et.is_active)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Performance Report - ${learner.first_name} ${learner.last_name}`,
    pageStyle: `
      @page { margin: 15mm; size: A4; }
      body {
        font-family: Arial, sans-serif;
        padding: 0;
        margin: 0;
        font-size: 9px;
        position: relative;
      }
      .watermark {
        position: absolute;
        top: 120px;
        left: 50%;
        transform: translateX(-50%);
        opacity: 0.06;
        z-index: 0;
        pointer-events: none;
      }
      .watermark img {
        width: 300px;
        height: 300px;
        object-fit: contain;
      }
      table {
        position: relative;
        z-index: 1;
      }
      .content {
        position: relative;
        z-index: 1;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom: 2px solid #333;
      }
      .logo-section {
        width: 60px;
      }
      .logo {
        max-width: 60px;
        max-height: 60px;
        object-fit: contain;
      }
      .school-info {
        flex: 1;
        text-align: center;
        padding: 0 10px;
      }
      .school-name {
        font-size: 16px;
        font-weight: bold;
        margin: 2px 0;
      }
      .school-details {
        font-size: 8px;
        color: #666;
        line-height: 1.3;
      }
      .learner-photo-section {
        width: 60px;
      }
      .learner-photo {
        max-width: 60px;
        max-height: 60px;
        object-fit: cover;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      .report-title {
        text-align: center;
        font-size: 12px;
        font-weight: bold;
        margin: 8px 0 6px;
        text-transform: uppercase;
      }
      .student-info {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
        margin: 8px 0;
        padding: 6px;
        background-color: #f9fafb;
        font-size: 8px;
      }
      .info-item {
        display: flex;
        gap: 4px;
      }
      .info-label {
        font-weight: bold;
        color: #333;
      }
      .info-value {
        color: #666;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 8px 0;
        font-size: 8px;
      }
      th, td {
        border: 1px solid #ddd;
        padding: 3px;
        text-align: center;
      }
      th {
        background-color: #f5f5f5;
        font-weight: bold;
        font-size: 7px;
      }
      td:first-child {
        text-align: left;
      }
      .grade-ee { background-color: #d1fae5; }
      .grade-me { background-color: #dbeafe; }
      .grade-ae { background-color: #fef3c7; }
      .grade-be { background-color: #fee2e2; }
      .overall-row {
        background-color: #f0f0f0;
        font-weight: bold;
      }
      .grading-key {
        margin-top: 8px;
        padding: 6px;
      }
      .grading-key h4 {
        font-size: 9px;
        font-weight: bold;
        margin-bottom: 4px;
      }
      .grading-key-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        font-size: 7px;
      }
      .grading-key-item {
        padding: 3px;
        text-align: center;
      }
      .summary {
        margin-top: 8px;
        padding: 6px;
        background-color: #f9fafb;
        display: flex;
        justify-content: space-around;
        font-size: 9px;
      }
      .summary-item {
        text-align: center;
      }
      .summary-label {
        font-size: 8px;
        color: #666;
        margin-bottom: 2px;
      }
      .summary-value {
        font-size: 11px;
        font-weight: bold;
        color: #333;
      }
      .footer {
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        font-size: 7px;
      }
      .signature-section {
        text-align: center;
      }
      .signature-line {
        border-top: 1px solid #333;
        width: 120px;
        margin: 15px auto 2px;
      }
      @media print {
        body { padding: 0; margin: 0; }
        .no-print { display: none; }
      }
    `
  });

  const getGradeClass = (marks: number) => {
    if (marks >= 80) return "grade-ee";
    if (marks >= 50) return "grade-me";
    if (marks >= 30) return "grade-ae";
    return "grade-be";
  };

  const getGradeLabel = (marks: number) => {
    const gradeInfo = getGrade(marks);
    return gradeInfo?.grade_name || "-";
  };

  // Group performance by learning area with all exam types as columns
  const groupedPerformance = performance.reduce((acc: any, record: any) => {
    const areaId = record.learning_area_id;
    const areaName = record.learning_area?.name || "N/A";
    
    if (!acc[areaId]) {
      acc[areaId] = {
        name: areaName,
        code: record.learning_area?.code || "N/A",
        examScores: {} as Record<string, { score: number | null; maxMarks: number }>,
      };
      // Initialize all exam types
      activeExamTypes.forEach(et => {
        acc[areaId].examScores[et.name] = { score: null, maxMarks: et.max_marks || 100 };
      });
    }
    
    // Match exam type
    const recordExamType = record.exam_type?.toLowerCase().trim();
    const matchedExamType = activeExamTypes.find(
      et => et.name.toLowerCase().trim() === recordExamType
    );
    
    if (matchedExamType) {
      acc[areaId].examScores[matchedExamType.name] = {
        score: record.marks,
        maxMarks: matchedExamType.max_marks || 100,
      };
    }
    
    return acc;
  }, {});

  // Calculate average: (sum of all exam percentages) / (number of exams with scores)
  const tableData = Object.values(groupedPerformance).map((area: any) => {
    const validScores: { score: number; maxMarks: number }[] = [];
    
    Object.values(area.examScores).forEach((examData: any) => {
      if (examData.score !== null && examData.score !== undefined) {
        validScores.push({
          score: Number(examData.score),
          maxMarks: examData.maxMarks,
        });
      }
    });
    
    let average = 0;
    if (validScores.length > 0) {
      const totalPercentage = validScores.reduce((sum, item) => {
        const percentage = (item.score / item.maxMarks) * 100;
        return sum + percentage;
      }, 0);
      average = totalPercentage / validScores.length;
    }
    
    return { 
      ...area, 
      average: Math.round(average * 10) / 10 
    };
  });

  // Calculate overall average
  const areasWithMarks = tableData.filter((area: any) => area.average > 0);
  const overallAverage = areasWithMarks.length > 0
    ? areasWithMarks.reduce((sum: number, area: any) => sum + (area.average || 0), 0) / areasWithMarks.length
    : 0;
  const overallGrade = getGradeLabel(overallAverage);

  return (
    <>
      <Button onClick={handlePrint} variant="default" size="sm">
        <Download className="mr-2 h-4 w-4" />
        Download Report
      </Button>

      <div style={{ display: "none" }}>
        <div ref={printRef}>
          {schoolInfo?.logo_url && (
            <div className="watermark">
              <img src={schoolInfo.logo_url} alt="School Logo Watermark" />
            </div>
          )}
          <div className="content">
            <div className="header">
            <div className="logo-section">
              {schoolInfo?.logo_url && (
                <img src={schoolInfo.logo_url} alt="School Logo" className="logo" />
              )}
            </div>
            <div className="school-info">
              <div className="school-name">{schoolInfo?.school_name || "School Name"}</div>
              <div className="school-details">
                {schoolInfo?.address && <div>{schoolInfo.address}</div>}
                {schoolInfo?.phone && <div>Tel: {schoolInfo.phone}</div>}
                {schoolInfo?.email && <div>Email: {schoolInfo.email}</div>}
              </div>
            </div>
            <div className="learner-photo-section">
              {learner.photo_url && (
                <img src={learner.photo_url} alt="Learner" className="learner-photo" />
              )}
            </div>
          </div>

          <div className="report-title">
            Academic Performance Report - {academicYear} {term.replace("term_", "Term ")}
          </div>

          <div className="student-info">
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">{learner.first_name} {learner.last_name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Admission:</span>
              <span className="info-value">{learner.admission_number}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Grade:</span>
              <span className="info-value">{learner.current_grade?.name}</span>
            </div>
            {learner.current_stream && (
              <div className="info-item">
                <span className="info-label">Stream:</span>
                <span className="info-value">{learner.current_stream.name}</span>
              </div>
            )}
            {gradePosition && totalInGrade && (
              <div className="info-item">
                <span className="info-label">Grade Position:</span>
                <span className="info-value">{gradePosition} / {totalInGrade}</span>
              </div>
            )}
            {streamPosition && totalInStream && (
              <div className="info-item">
                <span className="info-label">Stream Position:</span>
                <span className="info-value">{streamPosition} / {totalInStream}</span>
              </div>
            )}
          </div>

          <table>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Learning Area</th>
                {activeExamTypes.map(et => (
                  <th key={et.id}>
                    {et.name}
                    <div style={{ fontSize: "6px", fontWeight: "normal" }}>/{et.max_marks || 100}</div>
                  </th>
                ))}
                <th>Average</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((area: any, index: number) => (
                <tr key={index}>
                  <td style={{ textAlign: "left" }}>{area.name}</td>
                  {activeExamTypes.map(et => {
                    const examData = area.examScores[et.name];
                    return (
                      <td key={et.id}>
                        {examData?.score !== null ? examData.score : "-"}
                      </td>
                    );
                  })}
                  <td style={{ fontWeight: "bold" }}>{area.average > 0 ? area.average.toFixed(1) : "-"}</td>
                  <td className={area.average > 0 ? getGradeClass(area.average) : ""}>
                    <strong>{area.average > 0 ? getGradeLabel(area.average) : "-"}</strong>
                  </td>
                </tr>
              ))}
              <tr className="overall-row">
                <td style={{ textAlign: "left" }}>OVERALL</td>
                {activeExamTypes.map(et => (
                  <td key={et.id}>-</td>
                ))}
                <td>{overallAverage.toFixed(1)}</td>
                <td className={getGradeClass(overallAverage)}>
                  <strong>{overallGrade}</strong>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="summary">
            <div className="summary-item">
              <div className="summary-label">Total Subjects</div>
              <div className="summary-value">{tableData.length}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Overall Average</div>
              <div className="summary-value">{overallAverage.toFixed(1)}%</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Overall Grade</div>
              <div className="summary-value">{overallGrade}</div>
            </div>
          </div>

          <div className="grading-key">
            <h4>Grading Key</h4>
            <div className="grading-key-grid">
              {gradingScales.length > 0 ? (
                gradingScales
                  .sort((a, b) => b.min_percentage - a.min_percentage)
                  .map(scale => (
                    <div key={scale.id} className="grading-key-item">
                      <strong>{scale.grade_name}</strong> {scale.min_percentage}-{scale.max_percentage}% {scale.description && `(${scale.description})`}
                    </div>
                  ))
              ) : (
                <>
                  <div className="grading-key-item">
                    <strong>E.E</strong> 80-100% Exceeding Expectation
                  </div>
                  <div className="grading-key-item">
                    <strong>M.E</strong> 50-79% Meeting Expectation
                  </div>
                  <div className="grading-key-item">
                    <strong>A.E</strong> 30-49% Approaching Expectation
                  </div>
                  <div className="grading-key-item">
                    <strong>B.E</strong> 0-29% Below Expectation
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="footer">
            <div className="signature-section">
              <div className="signature-line"></div>
              <div>Class Teacher</div>
            </div>
            <div className="signature-section">
              <div className="signature-line"></div>
              <div>Principal</div>
            </div>
            <div className="signature-section">
              <div className="signature-line"></div>
              <div>Parent/Guardian</div>
            </div>
          </div>

            <div style={{ marginTop: "8px", textAlign: "center", fontSize: "7px", color: "#999" }}>
              Generated: {new Date().toLocaleDateString()} | Computer-generated report
            </div>
          </div>
        </div>
      </div>
    </>
  );
}