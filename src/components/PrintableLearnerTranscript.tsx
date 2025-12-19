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
}

export const PrintableLearnerTranscript = ({
  learner,
  learningAreas,
  examTypes = [],
  filters,
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

  // Check if showing combined/all exam types
  const showExamColumns = (filters.examType === "Combined Average" || filters.examType === "All Types") && examTypes.length > 0;

  // Calculate total and average from available marks
  const subjectsWithMarks = learningAreas.filter(la => learner.marks[la.code] !== null);
  const averageMarks = subjectsWithMarks.length > 0 
    ? subjectsWithMarks.reduce((sum, la) => sum + (learner.marks[la.code] || 0), 0) / subjectsWithMarks.length 
    : 0;

  // Determine compact mode based on number of subjects and exam columns
  const totalColumns = learningAreas.length + (showExamColumns ? examTypes.length : 0);
  const isCompact = totalColumns > 12 || learningAreas.length > 10;
  const cellPadding = isCompact ? "px-1 py-0.5" : "p-1";
  const fontSize = isCompact ? "8px" : "9px";

  return (
    <div 
      className="bg-white text-black" 
      style={{ 
        fontSize, 
        pageBreakAfter: "always",
        padding: isCompact ? "10px 12px" : "14px 18px",
        maxHeight: "100vh",
        overflow: "hidden"
      }}
    >
      {/* Compact Header */}
      <div className="text-center mb-2">
        <div className="flex items-center justify-center gap-2">
          {schoolInfo?.logo_url && (
            <img
              src={schoolInfo.logo_url}
              alt="School Logo"
              className="h-10 w-10 object-contain"
            />
          )}
          <div>
            <h1 className="text-base font-bold uppercase">{schoolInfo?.school_name || "School Name"}</h1>
            {schoolInfo?.motto && <p className="text-xs italic text-gray-500">"{schoolInfo.motto}"</p>}
          </div>
        </div>
        {schoolInfo?.address && <p className="text-xs text-gray-600">{schoolInfo.address}</p>}
        {(schoolInfo?.phone || schoolInfo?.email) && (
          <p className="text-xs text-gray-600">
            {schoolInfo?.phone && `Tel: ${schoolInfo.phone}`}
            {schoolInfo?.phone && schoolInfo?.email && " | "}
            {schoolInfo?.email && `Email: ${schoolInfo.email}`}
          </p>
        )}
      </div>

      {/* Title Bar */}
      <div className="text-center mb-2 border-y border-black py-1">
        <h2 className="text-sm font-bold uppercase">ACADEMIC REPORT CARD</h2>
        <p className="text-xs">
          {filters.academicYear} - {filters.term} | {filters.examType}
        </p>
      </div>

      {/* Learner Info - Compact */}
      <div className="mb-2 border border-black p-1.5">
        <div className="flex justify-between text-xs">
          <span><b>Name:</b> {learner.first_name} {learner.last_name}</span>
          <span><b>Adm No:</b> {learner.admission_number}</span>
          {filters.gradeName && <span><b>Grade:</b> {filters.gradeName}</span>}
          {filters.streamName && <span><b>Stream:</b> {filters.streamName}</span>}
        </div>
      </div>

      {/* Performance Table - With Exam Type Columns */}
      <table className="w-full border-collapse border border-black mb-2" style={{ fontSize }}>
        <thead>
          <tr className="bg-gray-100">
            <th className={`border border-black ${cellPadding} text-left font-semibold w-5`}>#</th>
            <th className={`border border-black ${cellPadding} text-left font-semibold`} style={{ minWidth: "60px" }}>Subject</th>
            {showExamColumns && examTypes.map(et => (
              <th key={et.id} className={`border border-black ${cellPadding} text-center font-semibold`}>
                <div>{et.name}</div>
                <div style={{ fontSize: "6px", fontWeight: "normal" }}>/{et.max_marks}</div>
              </th>
            ))}
            <th className={`border border-black ${cellPadding} text-center font-semibold w-10`}>Avg</th>
            <th className={`border border-black ${cellPadding} text-center font-semibold w-8`}>Grade</th>
          </tr>
        </thead>
        <tbody>
          {learningAreas.map((la, index) => {
            const avgMarks = learner.marks[la.code];
            const gradeInfo = avgMarks !== null ? getGradeFromScale(avgMarks) : null;
            const examData = learner.examMarks?.[la.code] || {};
            
            return (
              <tr key={la.id}>
                <td className={`border border-black ${cellPadding} text-center`}>{index + 1}</td>
                <td className={`border border-black ${cellPadding}`}>{la.name}</td>
                {showExamColumns && examTypes.map(et => {
                  const score = examData[et.name];
                  return (
                    <td key={et.id} className={`border border-black ${cellPadding} text-center`}>
                      {score !== null && score !== undefined ? score : "—"}
                    </td>
                  );
                })}
                <td className={`border border-black ${cellPadding} text-center font-semibold`}>
                  {avgMarks !== null ? avgMarks : "—"}
                </td>
                <td className={`border border-black ${cellPadding} text-center font-semibold`}>
                  {gradeInfo ? gradeInfo.grade : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-bold">
            <td colSpan={showExamColumns ? 2 + examTypes.length : 2} className={`border border-black ${cellPadding} text-right`}>
              OVERALL AVERAGE:
            </td>
            <td className={`border border-black ${cellPadding} text-center`}>{averageMarks.toFixed(1)}%</td>
            <td className={`border border-black ${cellPadding} text-center`}>{getGradeFromScale(averageMarks).grade}</td>
          </tr>
        </tfoot>
      </table>

      {/* Grading Key - Compact inline */}
      <div className="mb-2 p-1 border border-black text-xs">
        <span className="font-semibold">Grading Key: </span>
        {gradingScales.length > 0 ? (
          gradingScales
            .sort((a, b) => b.min_percentage - a.min_percentage)
            .map((scale, i) => (
              <span key={scale.id}>
                {scale.grade_name}={scale.min_percentage}-{scale.max_percentage}%
                {i < gradingScales.length - 1 ? " | " : ""}
              </span>
            ))
        ) : (
          <span>E.E=80-100% | M.E=50-79% | A.E=30-49% | B.E=0-29%</span>
        )}
      </div>

      {/* Signatures - Compact */}
      <div className="flex justify-between mt-3 text-xs">
        <div className="w-32">
          <div className="border-t border-black pt-0.5">Class Teacher</div>
        </div>
        <div className="w-32">
          <div className="border-t border-black pt-0.5">Principal</div>
        </div>
        <div className="w-32">
          <div className="border-t border-black pt-0.5">Date: {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 pt-1 border-t border-black text-center" style={{ fontSize: "7px" }}>
        <p className="text-gray-500">Computer generated document | {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};