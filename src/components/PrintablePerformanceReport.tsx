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

  const activeExamTypes = examTypes
    .filter(et => et.is_active)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Performance_Report_${learner.first_name}_${learner.last_name}_${academicYear}_${term}`,
    pageStyle: `
      @page { margin: 15mm; size: A4; }
      body { font-family: Arial, sans-serif; font-size: 9px; }
      .header { display: flex; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 2px solid #333; }
      .logo { max-width: 60px; max-height: 60px; }
      .school-info { flex: 1; text-align: center; }
      .school-name { font-size: 16px; font-weight: bold; }
      .school-details { font-size: 8px; color: #666; }
      .learner-photo { max-width: 60px; max-height: 60px; border: 1px solid #ddd; border-radius: 4px; }
      .report-title { text-align: center; font-size: 12px; font-weight: bold; margin: 8px 0; }
      .student-info { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin: 8px 0; padding: 6px; background: #f9fafb; font-size: 8px; }
      .info-label { font-weight: bold; }
      table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 8px; }
      th, td { border: 1px solid #ddd; padding: 3px; text-align: center; }
      th { background: #f5f5f5; font-weight: bold; }
      .grade-ee { background: #d1fae5; }
      .grade-me { background: #dbeafe; }
      .grade-ae { background: #fef3c7; }
      .grade-be { background: #fee2e2; }
      .overall-row { background: #f0f0f0; font-weight: bold; }
      .summary { margin-top: 8px; padding: 6px; background: #f9fafb; display: flex; justify-content: space-around; }
      .grading-key { margin-top: 8px; padding: 6px; }
      .grading-key-grid { display: flex; flex-wrap: wrap; gap: 8px; font-size: 7px; }
      .footer { margin-top: 10px; padding-top: 8px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 7px; }
      .signature-line { border-top: 1px solid #333; width: 120px; margin: 15px auto 2px; }
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

  const groupedPerformance = performance.reduce((acc: any, record: any) => {
    const areaId = record.learning_area_id;
    const areaName = record.learning_area?.name || "N/A";
    
    if (!acc[areaId]) {
      acc[areaId] = {
        name: areaName,
        code: record.learning_area?.code || "N/A",
        examScores: {} as Record<string, { score: number | null; maxMarks: number }>,
      };
      activeExamTypes.forEach(et => {
        acc[areaId].examScores[et.name] = { score: null, maxMarks: et.max_marks || 100 };
      });
    }
    
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

  const tableData = Object.values(groupedPerformance).map((area: any) => {
    const validScores: { score: number; maxMarks: number }[] = [];
    
    Object.values(area.examScores).forEach((examData: any) => {
      if (examData.score !== null && examData.score !== undefined) {
        validScores.push({ score: Number(examData.score), maxMarks: examData.maxMarks });
      }
    });
    
    let average = 0;
    if (validScores.length > 0) {
      const totalPercentage = validScores.reduce((sum, item) => sum + (item.score / item.maxMarks) * 100, 0);
      average = totalPercentage / validScores.length;
    }
    
    return { ...area, average: Math.round(average * 10) / 10 };
  });

  const areasWithMarks = tableData.filter((area: any) => area.average > 0);
  const overallAverage = areasWithMarks.length > 0
    ? areasWithMarks.reduce((sum: number, area: any) => sum + (area.average || 0), 0) / areasWithMarks.length
    : 0;
  const overallGrade = getGradeLabel(overallAverage);

  return (
    <>
      <Button onClick={handlePrint} variant="default" size="sm">
        <Download className="mr-2 h-4 w-4" />
        Download Report (PDF)
      </Button>

      <div style={{ display: "none" }}>
        <div ref={printRef} style={{ padding: "15mm", fontFamily: "Arial, sans-serif" }}>
          <div className="header">
            <div>{schoolInfo?.logo_url && <img src={schoolInfo.logo_url} alt="Logo" className="logo" />}</div>
            <div className="school-info">
              <div className="school-name">{schoolInfo?.school_name || "School Name"}</div>
              <div className="school-details">
                {schoolInfo?.address && <div>{schoolInfo.address}</div>}
                {schoolInfo?.phone && <div>Tel: {schoolInfo.phone}</div>}
                {schoolInfo?.email && <div>Email: {schoolInfo.email}</div>}
              </div>
            </div>
            <div>{learner.photo_url && <img src={learner.photo_url} alt="Learner" className="learner-photo" />}</div>
          </div>

          <div className="report-title">
            Academic Performance Report - {academicYear} {term.replace("term_", "Term ")}
          </div>

          <div className="student-info">
            <div><span className="info-label">Name:</span> {learner.first_name} {learner.last_name}</div>
            <div><span className="info-label">Admission:</span> {learner.admission_number}</div>
            <div><span className="info-label">Grade:</span> {learner.current_grade?.name}</div>
            {learner.current_stream && <div><span className="info-label">Stream:</span> {learner.current_stream.name}</div>}
            {gradePosition && totalInGrade && <div><span className="info-label">Grade Position:</span> {gradePosition}/{totalInGrade}</div>}
            {streamPosition && totalInStream && <div><span className="info-label">Stream Position:</span> {streamPosition}/{totalInStream}</div>}
          </div>

          <table>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Learning Area</th>
                {activeExamTypes.map(et => <th key={et.id}>{et.name}<div style={{ fontSize: "6px" }}>/{et.max_marks || 100}</div></th>)}
                <th>Average</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((area: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ textAlign: "left" }}>{area.name}</td>
                  {activeExamTypes.map(et => <td key={et.id}>{area.examScores[et.name]?.score ?? "-"}</td>)}
                  <td style={{ fontWeight: "bold" }}>{area.average > 0 ? `${area.average.toFixed(1)}%` : "-"}</td>
                  <td className={area.average > 0 ? getGradeClass(area.average) : ""}><strong>{area.average > 0 ? getGradeLabel(area.average) : "-"}</strong></td>
                </tr>
              ))}
              <tr className="overall-row">
                <td style={{ textAlign: "left" }}>OVERALL</td>
                {activeExamTypes.map(et => <td key={et.id}>-</td>)}
                <td>{overallAverage.toFixed(1)}%</td>
                <td className={getGradeClass(overallAverage)}><strong>{overallGrade}</strong></td>
              </tr>
            </tbody>
          </table>

          <div className="summary">
            <div><div style={{ fontSize: "8px", color: "#666" }}>Total Subjects</div><div style={{ fontSize: "11px", fontWeight: "bold" }}>{tableData.length}</div></div>
            <div><div style={{ fontSize: "8px", color: "#666" }}>Overall Average</div><div style={{ fontSize: "11px", fontWeight: "bold" }}>{overallAverage.toFixed(1)}%</div></div>
            <div><div style={{ fontSize: "8px", color: "#666" }}>Overall Grade</div><div style={{ fontSize: "11px", fontWeight: "bold" }}>{overallGrade}</div></div>
          </div>

          <div className="grading-key">
            <h4 style={{ fontSize: "9px", fontWeight: "bold", marginBottom: "4px" }}>Grading Key</h4>
            <div className="grading-key-grid">
              {gradingScales.length > 0 ? gradingScales.sort((a, b) => b.min_percentage - a.min_percentage).map(scale => (
                <div key={scale.id}><strong>{scale.grade_name}</strong> {scale.min_percentage}-{scale.max_percentage}%</div>
              )) : (
                <>
                  <div><strong>E.E</strong> 80-100%</div>
                  <div><strong>M.E</strong> 50-79%</div>
                  <div><strong>A.E</strong> 30-49%</div>
                  <div><strong>B.E</strong> 0-29%</div>
                </>
              )}
            </div>
          </div>

          <div className="footer">
            <div style={{ textAlign: "center" }}><div className="signature-line"></div><div>Class Teacher</div></div>
            <div style={{ textAlign: "center" }}><div className="signature-line"></div><div>Principal</div></div>
            <div style={{ textAlign: "center" }}><div className="signature-line"></div><div>Parent/Guardian</div></div>
          </div>

          <div style={{ marginTop: "8px", textAlign: "center", fontSize: "7px", color: "#999" }}>
            Generated: {new Date().toLocaleDateString()} | Computer-generated report
          </div>
        </div>
      </div>
    </>
  );
}