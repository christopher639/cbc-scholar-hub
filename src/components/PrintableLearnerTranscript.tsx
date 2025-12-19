import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { useGradingScales } from "@/hooks/useGradingScales";

interface ExamTypeInfo {
  id: string;
  name: string;
  max_marks: number;
  display_order: number;
}

interface LearnerRecord {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  marks: Record<string, number | null>;
  examMarks?: Record<string, Record<string, number | null>>;
  total: number;
  average: number;
}

interface LearningArea {
  id: string;
  code: string;
  name: string;
}

interface PrintableLearnerTranscriptProps {
  learner: LearnerRecord;
  learningAreas: LearningArea[];
  examTypes?: ExamTypeInfo[];
  filters: {
    academicYear: string;
    term: string;
    examType: string;
    gradeName?: string;
    streamName?: string;
  };
  gradePosition?: number;
  totalInGrade?: number;
  streamPosition?: number;
  totalInStream?: number;
}

export const PrintableLearnerTranscript = ({
  learner,
  learningAreas,
  examTypes = [],
  filters,
  gradePosition,
  totalInGrade,
  streamPosition,
  totalInStream,
}: PrintableLearnerTranscriptProps) => {
  const { schoolInfo } = useSchoolInfo();
  const { gradingScales } = useGradingScales();

  const getGradeFromScale = (marks: number): { grade: string; description: string } => {
    const sortedScales = [...gradingScales].sort((a, b) => b.min_percentage - a.min_percentage);
    for (const scale of sortedScales) {
      if (marks >= scale.min_percentage && marks <= scale.max_percentage) {
        return { grade: scale.grade_name, description: scale.description || '' };
      }
    }
    return { grade: '-', description: '' };
  };

  const getGradeClass = (marks: number) => {
    if (marks >= 80) return "background-color: #d1fae5;";
    if (marks >= 50) return "background-color: #dbeafe;";
    if (marks >= 30) return "background-color: #fef3c7;";
    return "background-color: #fee2e2;";
  };

  // Check if showing combined/all exam types
  const showExamColumns = (filters.examType === "Combined Average" || filters.examType === "All Types") && examTypes.length > 0;

  // Calculate total and average from available marks
  const subjectsWithMarks = learningAreas.filter(la => learner.marks[la.code] !== null);
  const averageMarks = subjectsWithMarks.length > 0 
    ? subjectsWithMarks.reduce((sum, la) => sum + (learner.marks[la.code] || 0), 0) / subjectsWithMarks.length 
    : 0;

  return (
    <div 
      className="bg-white text-black" 
      style={{ 
        fontSize: "9px", 
        pageBreakAfter: "always",
        padding: "15mm",
        position: "relative",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Watermark */}
      {schoolInfo?.logo_url && (
        <div style={{
          position: "absolute",
          top: "120px",
          left: "50%",
          transform: "translateX(-50%)",
          opacity: 0.06,
          zIndex: 0,
          pointerEvents: "none",
        }}>
          <img 
            src={schoolInfo.logo_url} 
            alt="School Logo Watermark" 
            style={{ width: "300px", height: "300px", objectFit: "contain" }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "8px",
          paddingBottom: "8px",
          borderBottom: "2px solid #333",
        }}>
          {/* Logo Section */}
          <div style={{ width: "60px" }}>
            {schoolInfo?.logo_url && (
              <img 
                src={schoolInfo.logo_url} 
                alt="School Logo" 
                style={{ maxWidth: "60px", maxHeight: "60px", objectFit: "contain" }}
              />
            )}
          </div>

          {/* School Info */}
          <div style={{ flex: 1, textAlign: "center", padding: "0 10px" }}>
            <div style={{ fontSize: "16px", fontWeight: "bold", margin: "2px 0" }}>
              {schoolInfo?.school_name || "School Name"}
            </div>
            <div style={{ fontSize: "8px", color: "#666", lineHeight: 1.3 }}>
              {schoolInfo?.address && <div>{schoolInfo.address}</div>}
              {schoolInfo?.phone && <div>Tel: {schoolInfo.phone}</div>}
              {schoolInfo?.email && <div>Email: {schoolInfo.email}</div>}
            </div>
          </div>

          {/* Learner Photo Section */}
          <div style={{ width: "60px" }}>
            {learner.photo_url && (
              <img 
                src={learner.photo_url} 
                alt="Learner" 
                style={{ 
                  maxWidth: "60px", 
                  maxHeight: "60px", 
                  objectFit: "cover",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
            )}
          </div>
        </div>

        {/* Report Title */}
        <div style={{
          textAlign: "center",
          fontSize: "12px",
          fontWeight: "bold",
          margin: "8px 0 6px",
          textTransform: "uppercase",
        }}>
          Academic Performance Report - {filters.academicYear} {filters.term.replace("term_", "Term ")}
        </div>

        {/* Student Info Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "4px",
          margin: "8px 0",
          padding: "6px",
          backgroundColor: "#f9fafb",
          fontSize: "8px",
        }}>
          <div style={{ display: "flex", gap: "4px" }}>
            <span style={{ fontWeight: "bold", color: "#333" }}>Name:</span>
            <span style={{ color: "#666" }}>{learner.first_name} {learner.last_name}</span>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <span style={{ fontWeight: "bold", color: "#333" }}>Admission:</span>
            <span style={{ color: "#666" }}>{learner.admission_number}</span>
          </div>
          {filters.gradeName && (
            <div style={{ display: "flex", gap: "4px" }}>
              <span style={{ fontWeight: "bold", color: "#333" }}>Grade:</span>
              <span style={{ color: "#666" }}>{filters.gradeName}</span>
            </div>
          )}
          {filters.streamName && (
            <div style={{ display: "flex", gap: "4px" }}>
              <span style={{ fontWeight: "bold", color: "#333" }}>Stream:</span>
              <span style={{ color: "#666" }}>{filters.streamName}</span>
            </div>
          )}
          {gradePosition && totalInGrade && (
            <div style={{ display: "flex", gap: "4px" }}>
              <span style={{ fontWeight: "bold", color: "#333" }}>Grade Position:</span>
              <span style={{ color: "#666" }}>{gradePosition} / {totalInGrade}</span>
            </div>
          )}
          {streamPosition && totalInStream && (
            <div style={{ display: "flex", gap: "4px" }}>
              <span style={{ fontWeight: "bold", color: "#333" }}>Stream Position:</span>
              <span style={{ color: "#666" }}>{streamPosition} / {totalInStream}</span>
            </div>
          )}
        </div>

        {/* Performance Table */}
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          margin: "8px 0",
          fontSize: "8px",
        }}>
          <thead>
            <tr>
              <th style={{ 
                border: "1px solid #ddd", 
                padding: "3px", 
                textAlign: "left",
                backgroundColor: "#f5f5f5",
                fontWeight: "bold",
                fontSize: "7px",
              }}>
                Learning Area
              </th>
              {showExamColumns && examTypes.map(et => (
                <th key={et.id} style={{ 
                  border: "1px solid #ddd", 
                  padding: "3px", 
                  textAlign: "center",
                  backgroundColor: "#f5f5f5",
                  fontWeight: "bold",
                  fontSize: "7px",
                }}>
                  {et.name}
                  <div style={{ fontSize: "6px", fontWeight: "normal" }}>/{et.max_marks}</div>
                </th>
              ))}
              <th style={{ 
                border: "1px solid #ddd", 
                padding: "3px", 
                textAlign: "center",
                backgroundColor: "#f5f5f5",
                fontWeight: "bold",
                fontSize: "7px",
              }}>
                Average
              </th>
              <th style={{ 
                border: "1px solid #ddd", 
                padding: "3px", 
                textAlign: "center",
                backgroundColor: "#f5f5f5",
                fontWeight: "bold",
                fontSize: "7px",
              }}>
                Grade
              </th>
            </tr>
          </thead>
          <tbody>
            {learningAreas.map((la) => {
              const avgMarks = learner.marks[la.code];
              const gradeInfo = avgMarks !== null ? getGradeFromScale(avgMarks) : null;
              const examData = learner.examMarks?.[la.code] || {};
              
              return (
                <tr key={la.id}>
                  <td style={{ 
                    border: "1px solid #ddd", 
                    padding: "3px", 
                    textAlign: "left",
                  }}>
                    {la.name}
                  </td>
                  {showExamColumns && examTypes.map(et => {
                    const score = examData[et.name];
                    return (
                      <td key={et.id} style={{ 
                        border: "1px solid #ddd", 
                        padding: "3px", 
                        textAlign: "center",
                      }}>
                        {score !== null && score !== undefined ? score : "-"}
                      </td>
                    );
                  })}
                  <td style={{ 
                    border: "1px solid #ddd", 
                    padding: "3px", 
                    textAlign: "center",
                    fontWeight: "bold",
                  }}>
                    {avgMarks !== null ? avgMarks.toFixed(1) : "-"}
                  </td>
                  <td style={{ 
                    border: "1px solid #ddd", 
                    padding: "3px", 
                    textAlign: "center",
                    ...(avgMarks !== null ? { backgroundColor: getGradeClass(avgMarks).replace("background-color: ", "").replace(";", "") } : {}),
                  }}>
                    <strong>{gradeInfo ? gradeInfo.grade : "-"}</strong>
                  </td>
                </tr>
              );
            })}
            {/* Overall Row */}
            <tr style={{ backgroundColor: "#f0f0f0", fontWeight: "bold" }}>
              <td style={{ 
                border: "1px solid #ddd", 
                padding: "3px", 
                textAlign: "left",
              }}>
                OVERALL
              </td>
              {showExamColumns && examTypes.map(et => (
                <td key={et.id} style={{ 
                  border: "1px solid #ddd", 
                  padding: "3px", 
                  textAlign: "center",
                }}>
                  -
                </td>
              ))}
              <td style={{ 
                border: "1px solid #ddd", 
                padding: "3px", 
                textAlign: "center",
              }}>
                {averageMarks.toFixed(1)}
              </td>
              <td style={{ 
                border: "1px solid #ddd", 
                padding: "3px", 
                textAlign: "center",
                ...(averageMarks > 0 ? { backgroundColor: getGradeClass(averageMarks).replace("background-color: ", "").replace(";", "") } : {}),
              }}>
                <strong>{getGradeFromScale(averageMarks).grade}</strong>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Summary Section */}
        <div style={{
          marginTop: "8px",
          padding: "6px",
          backgroundColor: "#f9fafb",
          display: "flex",
          justifyContent: "space-around",
          fontSize: "9px",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "8px", color: "#666", marginBottom: "2px" }}>Total Subjects</div>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "#333" }}>{learningAreas.length}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "8px", color: "#666", marginBottom: "2px" }}>Overall Average</div>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "#333" }}>{averageMarks.toFixed(1)}%</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "8px", color: "#666", marginBottom: "2px" }}>Overall Grade</div>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "#333" }}>{getGradeFromScale(averageMarks).grade}</div>
          </div>
        </div>

        {/* Grading Key */}
        <div style={{ marginTop: "8px", padding: "6px" }}>
          <h4 style={{ fontSize: "9px", fontWeight: "bold", marginBottom: "4px" }}>Grading Key</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "7px" }}>
            {gradingScales.length > 0 ? (
              gradingScales
                .sort((a, b) => b.min_percentage - a.min_percentage)
                .map(scale => (
                  <div key={scale.id} style={{ padding: "3px", textAlign: "center" }}>
                    <strong>{scale.grade_name}</strong> {scale.min_percentage}-{scale.max_percentage}% {scale.description && `(${scale.description})`}
                  </div>
                ))
            ) : (
              <>
                <div style={{ padding: "3px", textAlign: "center" }}>
                  <strong>E.E</strong> 80-100% Exceeding Expectation
                </div>
                <div style={{ padding: "3px", textAlign: "center" }}>
                  <strong>M.E</strong> 50-79% Meeting Expectation
                </div>
                <div style={{ padding: "3px", textAlign: "center" }}>
                  <strong>A.E</strong> 30-49% Approaching Expectation
                </div>
                <div style={{ padding: "3px", textAlign: "center" }}>
                  <strong>B.E</strong> 0-29% Below Expectation
                </div>
              </>
            )}
          </div>
        </div>

        {/* Signatures */}
        <div style={{
          marginTop: "10px",
          paddingTop: "8px",
          borderTop: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          fontSize: "7px",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #333", width: "120px", margin: "15px auto 2px" }}></div>
            <div>Class Teacher</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #333", width: "120px", margin: "15px auto 2px" }}></div>
            <div>Principal</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ borderTop: "1px solid #333", width: "120px", margin: "15px auto 2px" }}></div>
            <div>Parent/Guardian</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: "8px", textAlign: "center", fontSize: "7px", color: "#999" }}>
          Generated: {new Date().toLocaleDateString()} | Computer-generated report
        </div>
      </div>
    </div>
  );
};
