import { ArrowLeft, Shield } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { PageMeta } from "@/components/SEO/PageMeta";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const location = useLocation();
  const { schoolInfo } = useSchoolInfo();
  const schoolName = schoolInfo?.school_name || "The School";
  
  // Check if user came from the apply page
  const fromApply = location.state?.fromApply === true;
  
  const handleGoBack = () => {
    if (fromApply) {
      navigate("/apply", { state: { returnToReview: true } });
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <PageMeta 
        title={`Data Privacy Policy - ${schoolName}`}
        description={`Data protection and privacy policy for ${schoolName} in accordance with the Kenya Data Protection Act, 2019.`}
        keywords="data privacy, data protection, Kenya DPA, personal data, school privacy policy"
      />
      
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleGoBack} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-bold text-lg">Data Privacy Policy</h1>
              <p className="text-xs text-muted-foreground">Kenya Data Protection Act, 2019</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6 md:p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Data Protection & Privacy Policy</h1>
              <p className="text-muted-foreground">{schoolName}</p>
              <p className="text-sm text-muted-foreground">Last Updated: January 2026</p>
            </div>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-primary">1. Introduction</h2>
              <p className="text-sm text-muted-foreground mb-3">
                {schoolName} ("we," "our," or "the School") is committed to protecting the privacy and personal data 
                of all individuals whose information we collect and process. This policy outlines how we collect, use, 
                store, and protect personal data in accordance with the <strong>Kenya Data Protection Act, 2019</strong> 
                and the regulations issued thereunder by the Office of the Data Protection Commissioner (ODPC).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-primary">2. Data Controller</h2>
              <p className="text-sm text-muted-foreground mb-3">
                {schoolName} is the Data Controller responsible for the personal data collected through our 
                online application system, student management system, and related services.
              </p>
              {schoolInfo?.email && (
                <p className="text-sm text-muted-foreground">
                  <strong>Contact:</strong> {schoolInfo.email}
                </p>
              )}
              {schoolInfo?.phone && (
                <p className="text-sm text-muted-foreground">
                  <strong>Phone:</strong> {schoolInfo.phone}
                </p>
              )}
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-primary">3. Personal Data We Collect</h2>
              <p className="text-sm text-muted-foreground mb-3">We may collect the following categories of personal data:</p>
              <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                <li><strong>Child/Learner Information:</strong> Full name, date of birth, gender, photograph, birth certificate number, previous school details</li>
                <li><strong>Parent/Guardian Information:</strong> Full name, phone number, email address, occupation, physical address, residence</li>
                <li><strong>Medical Information:</strong> Allergies, medical conditions, emergency contact details</li>
                <li><strong>Academic Records:</strong> Grades, performance records, attendance, conduct reports</li>
                <li><strong>Financial Information:</strong> Fee payment records, invoice history</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-primary">4. Legal Basis for Processing</h2>
              <p className="text-sm text-muted-foreground mb-3">
                Under the Kenya Data Protection Act, 2019 (Section 30), we process personal data based on:
              </p>
              <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                <li><strong>Consent:</strong> You have given explicit consent for processing your personal data for specific purposes</li>
                <li><strong>Contractual Necessity:</strong> Processing is necessary for the performance of an educational services contract</li>
                <li><strong>Legal Obligation:</strong> Processing is required to comply with educational regulations and government requirements</li>
                <li><strong>Legitimate Interests:</strong> Processing is necessary for the legitimate interests of the School in providing quality education</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-primary">5. Purpose of Data Processing</h2>
              <p className="text-sm text-muted-foreground mb-3">We use your personal data for the following purposes:</p>
              <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                <li>Processing admission applications and enrollment</li>
                <li>Managing student records and academic performance</li>
                <li>Communicating with parents/guardians regarding student progress</li>
                <li>Fee management and financial record-keeping</li>
                <li>Health and safety management</li>
                <li>Compliance with Ministry of Education requirements</li>
                <li>Sending notifications and updates about school activities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-primary">6. Data Sharing and Disclosure</h2>
              <p className="text-sm text-muted-foreground mb-3">
                We do not sell, rent, or trade personal data to third parties. We may share data with:
              </p>
              <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                <li>Ministry of Education and relevant government authorities as required by law</li>
                <li>Examination bodies (KNEC) for registration and certification purposes</li>
                <li>Healthcare providers in case of medical emergencies</li>
                <li>Service providers who assist us in operating our systems (under strict confidentiality agreements)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-primary">7. Data Security</h2>
              <p className="text-sm text-muted-foreground mb-3">
                In accordance with Section 41 of the Kenya Data Protection Act, 2019, we implement appropriate 
                technical and organizational measures to protect personal data against unauthorized access, 
                alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                <li>Encrypted data transmission and storage</li>
                <li>Access controls and authentication systems</li>
                <li>Regular security assessments and updates</li>
                <li>Staff training on data protection</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-primary">8. Data Retention</h2>
              <p className="text-sm text-muted-foreground mb-3">
                We retain personal data only for as long as necessary to fulfill the purposes for which it was 
                collected, or as required by applicable laws and regulations. Student academic records may be 
                retained for extended periods as required by educational regulations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-primary">9. Your Rights Under the Kenya Data Protection Act</h2>
              <p className="text-sm text-muted-foreground mb-3">
                As a data subject, you have the following rights under Sections 26-29 of the Act:
              </p>
              <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-1">
                <li><strong>Right to be Informed:</strong> To know what data we hold about you and how we use it</li>
                <li><strong>Right of Access:</strong> To request a copy of your personal data</li>
                <li><strong>Right to Rectification:</strong> To request correction of inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> To request deletion of your data (subject to legal requirements)</li>
                <li><strong>Right to Object:</strong> To object to certain types of data processing</li>
                <li><strong>Right to Data Portability:</strong> To receive your data in a commonly used format</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                To exercise any of these rights, please contact us using the contact information provided above.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-primary">10. Children&apos;s Data</h2>
              <p className="text-sm text-muted-foreground mb-3">
                We are particularly committed to protecting the personal data of children. In accordance with 
                Section 33 of the Kenya Data Protection Act, 2019, we process children&apos;s data only with the 
                consent of a parent or guardian, and we implement enhanced safeguards for such data.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-primary">11. Cross-Border Data Transfers</h2>
              <p className="text-sm text-muted-foreground mb-3">
                In compliance with Section 48 of the Kenya Data Protection Act, 2019, we ensure that any 
                cross-border transfer of personal data is conducted only to countries that provide adequate 
                data protection, or where appropriate safeguards are in place.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-primary">12. Complaints</h2>
              <p className="text-sm text-muted-foreground mb-3">
                If you believe your data protection rights have been violated, you have the right to lodge a 
                complaint with the <strong>Office of the Data Protection Commissioner (ODPC)</strong>:
              </p>
              <p className="text-sm text-muted-foreground">
                Website: <a href="https://www.odpc.go.ke" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.odpc.go.ke</a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3 text-primary">13. Changes to This Policy</h2>
              <p className="text-sm text-muted-foreground mb-3">
                We may update this privacy policy from time to time to reflect changes in our practices or 
                applicable laws. We will notify you of any material changes by posting the updated policy on 
                our website.
              </p>
            </section>

            <section className="border-t pt-6 mt-8">
              <h2 className="text-lg font-semibold mb-3 text-primary">14. Consent Declaration</h2>
              <p className="text-sm text-muted-foreground mb-3">
                By submitting an application or using our services, you acknowledge that you have read and 
                understood this Data Protection & Privacy Policy and consent to the collection, processing, 
                and use of personal data as described herein, in accordance with the Kenya Data Protection Act, 2019.
              </p>
            </section>

            <div className="mt-8 text-center">
              <Button onClick={handleGoBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {fromApply ? "Back to Application" : "Go Back"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
