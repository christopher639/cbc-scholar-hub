import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { useGradingScales } from "@/hooks/useGradingScales";

interface LearnerRecord {
  id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  marks: Record<string, number | null>;
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
  learningAreas: LearningArea[]; // Only registered learning areas should be passed here
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
    // Fallback if no scale matches
    return { grade: '-', description: '' };
  };

  // Calculate total and average from available marks
  const subjectsWithMarks = learningAreas.filter(la => learner.marks[la.code] !== null);
  const totalMarks = subjectsWithMarks.reduce((sum, la) => sum + (learner.marks[la.code] || 0), 0);
  const averageMarks = subjectsWithMarks.length > 0 ? totalMarks / subjectsWithMarks.length : 0;

  // Determine compact mode based on number of subjects
  const isCompact = learningAreas.length > 10;
  const cellPadding = isCompact ? "px-1 py-0.5" : "p-1";
  const fontSize = isCompact ? "9px" : "10px";

  return (
    <div 
      className="bg-white text-black" 
      style={{ 
        fontSize, 
        pageBreakAfter: "always",
        padding: isCompact ? "12px 16px" : "16px 20px",
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
        <h2 className="text-sm font-bold uppercase">ACADEMIC TRANSCRIPT</h2>
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

      {/* Performance Table - Compact */}
      <table className="w-full border-collapse border border-black mb-2" style={{ fontSize }}>
        <thead>
          <tr className="bg-gray-100">
            <th className={`border border-black ${cellPadding} text-left font-semibold w-6`}>#</th>
            <th className={`border border-black ${cellPadding} text-left font-semibold`}>Code</th>
            <th className={`border border-black ${cellPadding} text-left font-semibold`}>Subject</th>
            <th className={`border border-black ${cellPadding} text-center font-semibold w-12`}>Marks</th>
            <th className={`border border-black ${cellPadding} text-center font-semibold w-10`}>Grade</th>
            <th className={`border border-black ${cellPadding} text-left font-semibold`}>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {learningAreas.map((la, index) => {
            const marks = learner.marks[la.code];
            const gradeInfo = marks !== null ? getGradeFromScale(marks) : null;
            return (
              <tr key={la.id}>
                <td className={`border border-black ${cellPadding} text-center`}>{index + 1}</td>
                <td className={`border border-black ${cellPadding} font-mono text-xs`}>{la.code}</td>
                <td className={`border border-black ${cellPadding}`}>{la.name}</td>
                <td className={`border border-black ${cellPadding} text-center font-semibold`}>
                  {marks !== null ? marks : "—"}
                </td>
                <td className={`border border-black ${cellPadding} text-center font-semibold`}>
                  {gradeInfo ? gradeInfo.grade : "—"}
                </td>
                <td className={`border border-black ${cellPadding} text-xs`}>
                  {gradeInfo ? gradeInfo.description : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-bold">
            <td colSpan={3} className={`border border-black ${cellPadding} text-right`}>AVERAGE:</td>
            <td className={`border border-black ${cellPadding} text-center`}>{averageMarks.toFixed(1)}%</td>
            <td className={`border border-black ${cellPadding} text-center`}>{getGradeFromScale(averageMarks).grade}</td>
            <td className={`border border-black ${cellPadding}`}>{getGradeFromScale(averageMarks).description}</td>
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
        <div className="w-36">
          <div className="border-t border-black pt-0.5">Class Teacher</div>
        </div>
        <div className="w-36">
          <div className="border-t border-black pt-0.5">Principal</div>
        </div>
        <div className="w-36">
          <div className="border-t border-black pt-0.5">Date: {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 pt-1 border-t border-black text-center" style={{ fontSize: "8px" }}>
        <p className="text-gray-500">Computer generated document | {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};
