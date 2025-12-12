import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";

interface FeeStructureItem {
  id: string;
  item_name: string;
  amount: number;
  description?: string;
}

interface FeeStructure {
  id: string;
  academic_year: string;
  term: string;
  amount: number;
  description?: string;
  grade?: { name: string };
  category?: { name: string };
  fee_structure_items?: FeeStructureItem[];
}

interface FeeStructureDocumentPreviewProps {
  structures: FeeStructure[];
  academicYear: string;
  gradeName: string;
  loading: boolean;
  onDownload: () => void;
}

export function FeeStructureDocumentPreview({
  structures,
  academicYear,
  gradeName,
  loading,
  onDownload,
}: FeeStructureDocumentPreviewProps) {
  const { schoolInfo } = useSchoolInfo();

  // Group structures by term
  const termData: { [key: string]: FeeStructure[] } = {
    term_1: [],
    term_2: [],
    term_3: [],
  };

  structures.forEach((s) => {
    if (termData[s.term]) {
      termData[s.term].push(s);
    }
  });

  // Get fee items for each term
  const getTermItems = (termStructures: FeeStructure[]) => {
    const items: { name: string; amount: number }[] = [];
    termStructures.forEach((s) => {
      if (s.fee_structure_items && s.fee_structure_items.length > 0) {
        s.fee_structure_items.forEach((item) => {
          items.push({ name: item.item_name, amount: Number(item.amount) });
        });
      } else {
        items.push({
          name: s.category?.name || s.description || "Tuition Fee",
          amount: Number(s.amount),
        });
      }
    });
    return items;
  };

  const term1Items = getTermItems(termData.term_1);
  const term2Items = getTermItems(termData.term_2);
  const term3Items = getTermItems(termData.term_3);

  const term1Total = term1Items.reduce((sum, i) => sum + i.amount, 0);
  const term2Total = term2Items.reduce((sum, i) => sum + i.amount, 0);
  const term3Total = term3Items.reduce((sum, i) => sum + i.amount, 0);
  const grandTotal = term1Total + term2Total + term3Total;

  const maxRows = Math.max(term1Items.length, term2Items.length, term3Items.length, 1);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (structures.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              No fee structure found for {gradeName} in {academicYear}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Document Preview */}
        <div className="bg-background p-6 md:p-8">
          {/* Header */}
          <div className="text-center border-b border-border pb-4 mb-6">
            {schoolInfo?.logo_url && (
              <img 
                src={schoolInfo.logo_url} 
                alt="School Logo" 
                className="w-16 h-16 object-contain mx-auto mb-2"
              />
            )}
            <h1 className="text-xl font-bold">{schoolInfo?.school_name || "School Name"}</h1>
            {(schoolInfo?.address || schoolInfo?.phone || schoolInfo?.email) && (
              <p className="text-xs text-muted-foreground mt-1">
                {[schoolInfo?.address, schoolInfo?.phone, schoolInfo?.email].filter(Boolean).join(" | ")}
              </p>
            )}
            {schoolInfo?.motto && (
              <p className="text-xs text-muted-foreground italic mt-1">"{schoolInfo.motto}"</p>
            )}
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wide">Fee Structure</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Academic Year: {academicYear} | Grade: {gradeName}
            </p>
          </div>

          {/* 3-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Term 1 */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-primary text-primary-foreground px-3 py-2 text-center">
                <span className="font-semibold text-sm">TERM 1</span>
              </div>
              <div className="divide-y divide-border">
                {term1Items.length > 0 ? (
                  term1Items.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-3 py-2 text-sm">
                      <span className="text-muted-foreground truncate mr-2">{item.name}</span>
                      <span className="font-medium whitespace-nowrap">{formatCurrency(item.amount)}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground text-center">-</div>
                )}
                {/* Padding rows */}
                {Array.from({ length: maxRows - term1Items.length }).map((_, idx) => (
                  <div key={`pad-${idx}`} className="px-3 py-2 text-sm">&nbsp;</div>
                ))}
              </div>
              <div className="bg-muted/50 flex justify-between px-3 py-2 border-t border-border">
                <span className="font-semibold text-sm">Total</span>
                <span className="font-bold text-sm">{formatCurrency(term1Total)}</span>
              </div>
            </div>

            {/* Term 2 */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-primary text-primary-foreground px-3 py-2 text-center">
                <span className="font-semibold text-sm">TERM 2</span>
              </div>
              <div className="divide-y divide-border">
                {term2Items.length > 0 ? (
                  term2Items.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-3 py-2 text-sm">
                      <span className="text-muted-foreground truncate mr-2">{item.name}</span>
                      <span className="font-medium whitespace-nowrap">{formatCurrency(item.amount)}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground text-center">-</div>
                )}
                {/* Padding rows */}
                {Array.from({ length: maxRows - term2Items.length }).map((_, idx) => (
                  <div key={`pad-${idx}`} className="px-3 py-2 text-sm">&nbsp;</div>
                ))}
              </div>
              <div className="bg-muted/50 flex justify-between px-3 py-2 border-t border-border">
                <span className="font-semibold text-sm">Total</span>
                <span className="font-bold text-sm">{formatCurrency(term2Total)}</span>
              </div>
            </div>

            {/* Term 3 */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-primary text-primary-foreground px-3 py-2 text-center">
                <span className="font-semibold text-sm">TERM 3</span>
              </div>
              <div className="divide-y divide-border">
                {term3Items.length > 0 ? (
                  term3Items.map((item, idx) => (
                    <div key={idx} className="flex justify-between px-3 py-2 text-sm">
                      <span className="text-muted-foreground truncate mr-2">{item.name}</span>
                      <span className="font-medium whitespace-nowrap">{formatCurrency(item.amount)}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground text-center">-</div>
                )}
                {/* Padding rows */}
                {Array.from({ length: maxRows - term3Items.length }).map((_, idx) => (
                  <div key={`pad-${idx}`} className="px-3 py-2 text-sm">&nbsp;</div>
                ))}
              </div>
              <div className="bg-muted/50 flex justify-between px-3 py-2 border-t border-border">
                <span className="font-semibold text-sm">Total</span>
                <span className="font-bold text-sm">{formatCurrency(term3Total)}</span>
              </div>
            </div>
          </div>

          {/* Grand Total */}
          <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="font-bold">TOTAL ANNUAL FEES</span>
            <span className="font-bold text-lg">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {/* Download Button */}
        <div className="border-t border-border bg-muted/30 px-6 py-4 flex justify-end">
          <Button onClick={onDownload} className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
