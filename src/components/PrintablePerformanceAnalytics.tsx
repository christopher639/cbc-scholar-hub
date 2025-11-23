import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { formatCurrency } from "@/lib/currency";

interface PrintablePerformanceAnalyticsProps {
  data: any[];
  filters: {
    academicYear?: string;
    term?: string;
    examType?: string;
    grade?: string;
    stream?: string;
    learningArea?: string;
  };
}

export const PrintablePerformanceAnalytics = ({ data, filters }: PrintablePerformanceAnalyticsProps) => {
  const { schoolInfo } = useSchoolInfo();

  const getTermLabel = (term?: string) => {
    if (!term) return "All Terms";
    return term.replace("term_", "Term ");
  };

  return (
    <div className="p-8 bg-background">
      {/* Header */}
      <div className="text-center mb-8 border-b-2 border-foreground pb-4">
        {schoolInfo?.logo_url && (
          <img 
            src={schoolInfo.logo_url} 
            alt="School Logo" 
            className="h-20 w-20 mx-auto mb-2 object-contain"
          />
        )}
        <h1 className="text-2xl font-bold text-foreground">
          {schoolInfo?.school_name || "School"}
        </h1>
        {schoolInfo?.address && (
          <p className="text-sm text-muted-foreground">{schoolInfo.address}</p>
        )}
        {schoolInfo?.phone && (
          <p className="text-sm text-muted-foreground">Tel: {schoolInfo.phone}</p>
        )}
      </div>

      {/* Report Title */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-center mb-4">
          Performance Analytics Report
        </h2>
        
        {/* Filters Summary */}
        <div className="bg-muted p-4 rounded-lg text-sm">
          <div className="grid grid-cols-2 gap-2">
            {filters.academicYear && (
              <div>
                <span className="font-semibold">Academic Year:</span> {filters.academicYear}
              </div>
            )}
            {filters.term && (
              <div>
                <span className="font-semibold">Term:</span> {getTermLabel(filters.term)}
              </div>
            )}
            {filters.examType && (
              <div>
                <span className="font-semibold">Exam Type:</span> {filters.examType}
              </div>
            )}
            {filters.grade && (
              <div>
                <span className="font-semibold">Grade:</span> {filters.grade}
              </div>
            )}
            {filters.stream && (
              <div>
                <span className="font-semibold">Stream:</span> {filters.stream}
              </div>
            )}
            {filters.learningArea && (
              <div>
                <span className="font-semibold">Subject:</span> {filters.learningArea}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <table className="w-full border-collapse border border-border">
        <thead>
          <tr className="bg-muted">
            <th className="border border-border p-2 text-left">Rank</th>
            <th className="border border-border p-2 text-left">Admission No.</th>
            <th className="border border-border p-2 text-left">Learner Name</th>
            <th className="border border-border p-2 text-left">Grade</th>
            <th className="border border-border p-2 text-left">Stream</th>
            <th className="border border-border p-2 text-right">Subjects</th>
            <th className="border border-border p-2 text-right">Total Marks</th>
            <th className="border border-border p-2 text-right">Average</th>
          </tr>
        </thead>
        <tbody>
          {data.map((record) => (
            <tr key={record.learner_id} className={record.rank <= 3 ? 'bg-success/10' : ''}>
              <td className="border border-border p-2 font-semibold">
                {record.rank}
                {record.rank === 1 && " 🥇"}
                {record.rank === 2 && " 🥈"}
                {record.rank === 3 && " 🥉"}
              </td>
              <td className="border border-border p-2">{record.learner?.admission_number}</td>
              <td className="border border-border p-2">
                {record.learner?.first_name} {record.learner?.last_name}
              </td>
              <td className="border border-border p-2">{record.grade?.name}</td>
              <td className="border border-border p-2">{record.stream?.name}</td>
              <td className="border border-border p-2 text-right">{record.subjects_count}</td>
              <td className="border border-border p-2 text-right">{record.total_marks.toFixed(1)}</td>
              <td className="border border-border p-2 text-right font-semibold">
                {record.average_marks.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <p className="text-center py-8 text-muted-foreground">
          No performance records found for the selected filters.
        </p>
      )}

      {/* Summary Statistics */}
      {data.length > 0 && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="border border-border p-4 rounded">
            <p className="text-sm text-muted-foreground">Total Learners</p>
            <p className="text-2xl font-bold">{data.length}</p>
          </div>
          <div className="border border-border p-4 rounded">
            <p className="text-sm text-muted-foreground">Highest Average</p>
            <p className="text-2xl font-bold">{data[0]?.average_marks.toFixed(2)}%</p>
          </div>
          <div className="border border-border p-4 rounded">
            <p className="text-sm text-muted-foreground">Class Average</p>
            <p className="text-2xl font-bold">
              {(data.reduce((sum, r) => sum + r.average_marks, 0) / data.length).toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-border text-sm text-muted-foreground">
        <p>Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        <p className="mt-2">This is a computer-generated report and does not require a signature.</p>
      </div>
    </div>
  );
};
