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

interface ReportData {
  learners: LearnerRecord[];
  learningAreas: Array<{ id: string; code: string; name: string }>;
  gradeName: string;
  streamName?: string;
}

interface PrintablePerformanceReportProps {
  data: ReportData;
  filters: {
    academicYear: string;
    term: string;
    examType: string;
  };
}

export const PrintablePerformanceReportNew = ({ data, filters }: PrintablePerformanceReportProps) => {
  const { schoolInfo } = useSchoolInfo();

  const classAverage = data.learners.length > 0
    ? (data.learners.reduce((sum, l) => sum + l.average, 0) / data.learners.length).toFixed(1)
    : "0";

  return (
    <div className="p-6 bg-white text-black" style={{ fontSize: "10px" }}>
      {/* Header */}
      <div className="text-center mb-4 border-b-2 border-black pb-3">
        <div className="flex items-center justify-center gap-4 mb-2">
          {schoolInfo?.logo_url && (
            <img 
              src={schoolInfo.logo_url} 
              alt="School Logo" 
              className="h-14 w-14 object-contain"
            />
          )}
          <div>
            <h1 className="text-lg font-bold uppercase">
              {schoolInfo?.school_name || "School"}
            </h1>
            {schoolInfo?.motto && (
              <p className="text-xs italic">"{schoolInfo.motto}"</p>
            )}
          </div>
        </div>
        {schoolInfo?.address && (
          <p className="text-xs">{schoolInfo.address}</p>
        )}
        <div className="flex justify-center gap-4 text-xs mt-1">
          {schoolInfo?.phone && <span>Tel: {schoolInfo.phone}</span>}
          {schoolInfo?.email && <span>Email: {schoolInfo.email}</span>}
        </div>
      </div>

      {/* Report Title */}
      <div className="mb-4">
        <h2 className="text-sm font-bold text-center uppercase mb-2">
          Performance Report
        </h2>
        
        {/* Filters Summary */}
        <div className="flex flex-wrap justify-center gap-4 text-xs border border-black p-2">
          <div>
            <span className="font-semibold">Academic Year:</span> {filters.academicYear}
          </div>
          <div>
            <span className="font-semibold">Term:</span> {filters.term}
          </div>
          <div>
            <span className="font-semibold">Exam:</span> {filters.examType}
          </div>
          <div>
            <span className="font-semibold">Grade:</span> {data.gradeName}
          </div>
          {data.streamName && (
            <div>
              <span className="font-semibold">Stream:</span> {data.streamName}
            </div>
          )}
        </div>
      </div>

      {/* Performance Table */}
      <table className="w-full border-collapse" style={{ fontSize: "9px" }}>
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-1 text-left">#</th>
            <th className="border border-black p-1 text-left">Adm No.</th>
            <th className="border border-black p-1 text-left" style={{ minWidth: "100px" }}>Learner Name</th>
            {data.learningAreas.map((la) => (
              <th key={la.id} className="border border-black p-1 text-center" title={la.name}>
                {la.code}
              </th>
            ))}
            <th className="border border-black p-1 text-center">Total</th>
            <th className="border border-black p-1 text-center">Avg</th>
            <th className="border border-black p-1 text-center">Rank</th>
          </tr>
        </thead>
        <tbody>
          {data.learners.map((learner, index) => (
            <tr key={learner.id}>
              <td className="border border-black p-1">{index + 1}</td>
              <td className="border border-black p-1 font-mono">{learner.admission_number}</td>
              <td className="border border-black p-1 whitespace-nowrap">
                {learner.first_name} {learner.last_name}
              </td>
              {data.learningAreas.map((la) => (
                <td key={la.id} className="border border-black p-1 text-center">
                  {learner.marks[la.code] !== null ? learner.marks[la.code] : ""}
                </td>
              ))}
              <td className="border border-black p-1 text-center font-semibold">{learner.total}</td>
              <td className="border border-black p-1 text-center font-semibold">{learner.average}%</td>
              <td className="border border-black p-1 text-center font-bold">{index + 1}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.learners.length === 0 && (
        <p className="text-center py-4 border border-black mt-[-1px]">
          No performance records found for the selected filters.
        </p>
      )}

      {/* Summary Statistics */}
      {data.learners.length > 0 && (
        <div className="mt-4 flex gap-4 text-xs">
          <div className="border border-black p-2">
            <span className="font-semibold">Total Learners:</span> {data.learners.length}
          </div>
          <div className="border border-black p-2">
            <span className="font-semibold">Total Subjects:</span> {data.learningAreas.length}
          </div>
          <div className="border border-black p-2">
            <span className="font-semibold">Highest Avg:</span> {data.learners[0]?.average}%
          </div>
          <div className="border border-black p-2">
            <span className="font-semibold">Class Avg:</span> {classAverage}%
          </div>
        </div>
      )}

      {/* Subject Key */}
      <div className="mt-4 text-xs">
        <p className="font-semibold mb-1">Subject Key:</p>
        <div className="flex flex-wrap gap-2">
          {data.learningAreas.map((la) => (
            <span key={la.id} className="text-gray-600">
              {la.code} = {la.name}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-3 border-t border-black text-xs text-gray-600">
        <p>Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        <p className="mt-1">This is a computer-generated report.</p>
      </div>
    </div>
  );
};
