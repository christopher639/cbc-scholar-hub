interface LearnerFeeBalance {
  admission_number: string;
  first_name: string;
  last_name: string;
  totalFees: number;
  amountPaid: number;
  balance: number;
  status: string;
  current_grade?: { name: string };
  current_stream?: { name: string };
}

export function generateFeeBalanceCSV(
  balances: LearnerFeeBalance[],
  gradeName: string,
  streamName: string | null,
  academicYear: string,
  term: string
): string {
  const headers = [
    "Admission Number",
    "First Name",
    "Last Name",
    "Grade",
    "Stream",
    "Total Fees (KSh)",
    "Amount Paid (KSh)",
    "Balance (KSh)",
    "Status",
  ];

  const rows = balances.map((learner) => [
    learner.admission_number,
    learner.first_name,
    learner.last_name,
    learner.current_grade?.name || gradeName,
    learner.current_stream?.name || streamName || "N/A",
    learner.totalFees.toFixed(2),
    learner.amountPaid.toFixed(2),
    learner.balance.toFixed(2),
    learner.status.toUpperCase(),
  ]);

  const csvContent = [
    [`Fee Balance Report - ${gradeName}${streamName ? ` - ${streamName}` : ""}`],
    [`Academic Year: ${academicYear}`],
    [`Term: ${term}`],
    [`Generated: ${new Date().toLocaleDateString()}`],
    [],
    headers,
    ...rows,
    [],
    ["Summary"],
    ["Total Learners", balances.length.toString()],
    ["Total Fees Expected", balances.reduce((sum, l) => sum + l.totalFees, 0).toFixed(2)],
    ["Total Amount Paid", balances.reduce((sum, l) => sum + l.amountPaid, 0).toFixed(2)],
    ["Total Balance", balances.reduce((sum, l) => sum + l.balance, 0).toFixed(2)],
  ]
    .map((row) => row.join(","))
    .join("\n");

  return csvContent;
}

export function downloadFeeBalanceReport(
  balances: LearnerFeeBalance[],
  gradeName: string,
  streamName: string | null,
  academicYear: string,
  term: string
): void {
  const csvContent = generateFeeBalanceCSV(balances, gradeName, streamName, academicYear, term);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  const filename = `fee_balance_${gradeName.replace(/\s+/g, "_")}${
    streamName ? `_${streamName.replace(/\s+/g, "_")}` : ""
  }_${academicYear.replace(/\//g, "-")}_${term.replace(/\s+/g, "_")}_${Date.now()}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
