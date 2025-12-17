import { useSchoolInfo } from "@/hooks/useSchoolInfo";

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
  learningAreas: LearningArea[];
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

  const getGradeCategory = (marks: number): string => {
    if (marks >= 80) return "E.E";
    if (marks >= 50) return "M.E";
    if (marks >= 30) return "A.E";
    return "B.E";
  };

  const getGradeCategoryFull = (marks: number): string => {
    if (marks >= 80) return "Exceeding Expectation";
    if (marks >= 50) return "Meeting Expectation";
    if (marks >= 30) return "Approaching Expectation";
    return "Below Expectation";
  };

  // Calculate total and average from available marks
  const subjectsWithMarks = learningAreas.filter(la => learner.marks[la.code] !== null);
  const totalMarks = subjectsWithMarks.reduce((sum, la) => sum + (learner.marks[la.code] || 0), 0);
  const averageMarks = subjectsWithMarks.length > 0 ? totalMarks / subjectsWithMarks.length : 0;

  return (
    <div className="p-8 bg-white text-black" style={{ fontSize: "11px", pageBreakAfter: "always" }}>
      {/* Header with School Info */}
      <div className="text-center mb-6">
        {schoolInfo?.logo_url && (
          <img
            src={schoolInfo.logo_url}
            alt="School Logo"
            className="h-16 w-16 mx-auto mb-2 object-contain"
          />
        )}
        <h1 className="text-xl font-bold uppercase">{schoolInfo?.school_name || "School Name"}</h1>
        {schoolInfo?.address && <p className="text-sm text-gray-600">{schoolInfo.address}</p>}
        {(schoolInfo?.phone || schoolInfo?.email) && (
          <p className="text-sm text-gray-600">
            {schoolInfo?.phone && `Tel: ${schoolInfo.phone}`}
            {schoolInfo?.phone && schoolInfo?.email && " | "}
            {schoolInfo?.email && `Email: ${schoolInfo.email}`}
          </p>
        )}
        {schoolInfo?.motto && <p className="text-sm italic text-gray-500 mt-1">"{schoolInfo.motto}"</p>}
      </div>

      {/* Title */}
      <div className="text-center mb-6 border-y border-black py-2">
        <h2 className="text-lg font-bold uppercase">ACADEMIC TRANSCRIPT / REPORT CARD</h2>
        <p className="text-sm mt-1">
          {filters.academicYear} - {filters.term} | {filters.examType}
        </p>
      </div>

      {/* Learner Info */}
      <div className="mb-6 border border-black p-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><span className="font-semibold">Name:</span> {learner.first_name} {learner.last_name}</p>
            <p><span className="font-semibold">Admission No:</span> {learner.admission_number}</p>
          </div>
          <div>
            {filters.gradeName && <p><span className="font-semibold">Grade:</span> {filters.gradeName}</p>}
            {filters.streamName && <p><span className="font-semibold">Stream:</span> {filters.streamName}</p>}
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <table className="w-full border-collapse border border-black mb-6">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 text-left font-semibold">#</th>
            <th className="border border-black p-2 text-left font-semibold">Subject Code</th>
            <th className="border border-black p-2 text-left font-semibold">Subject Name</th>
            <th className="border border-black p-2 text-center font-semibold">Marks (%)</th>
            <th className="border border-black p-2 text-center font-semibold">Grade</th>
            <th className="border border-black p-2 text-left font-semibold">Remarks</th>
          </tr>
        </thead>
        <tbody>
          {learningAreas.map((la, index) => {
            const marks = learner.marks[la.code];
            return (
              <tr key={la.id}>
                <td className="border border-black p-2 text-center">{index + 1}</td>
                <td className="border border-black p-2 font-mono">{la.code}</td>
                <td className="border border-black p-2">{la.name}</td>
                <td className="border border-black p-2 text-center font-semibold">
                  {marks !== null ? marks : "—"}
                </td>
                <td className="border border-black p-2 text-center font-semibold">
                  {marks !== null ? getGradeCategory(marks) : "—"}
                </td>
                <td className="border border-black p-2">
                  {marks !== null ? getGradeCategoryFull(marks) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-gray-100 font-bold">
            <td colSpan={3} className="border border-black p-2 text-right">OVERALL AVERAGE:</td>
            <td className="border border-black p-2 text-center">{averageMarks.toFixed(1)}%</td>
            <td className="border border-black p-2 text-center">{getGradeCategory(averageMarks)}</td>
            <td className="border border-black p-2">{getGradeCategoryFull(averageMarks)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Grading Key */}
      <div className="mb-6 p-3 border border-black">
        <p className="font-semibold mb-2">Grading Key:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>E.E = Exceeding Expectation (80-100%)</div>
          <div>M.E = Meeting Expectation (50-79%)</div>
          <div>A.E = Approaching Expectation (30-49%)</div>
          <div>B.E = Below Expectation (0-29%)</div>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 mt-8">
        <div>
          <p className="border-t border-black pt-1 w-48">Class Teacher's Signature</p>
        </div>
        <div>
          <p className="border-t border-black pt-1 w-48">Principal's Signature</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-3 border-t border-black text-xs text-gray-500 text-center">
        <p>Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        <p className="mt-1">This is a computer-generated document.</p>
      </div>
    </div>
  );
};
