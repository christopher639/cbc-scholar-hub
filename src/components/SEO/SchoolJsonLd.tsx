import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SchoolInfo {
  school_name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  mission?: string;
}

export const SchoolJsonLd = () => {
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);

  useEffect(() => {
    const fetchSchoolInfo = async () => {
      const { data } = await supabase
        .from('school_info')
        .select('school_name, address, phone, email, logo_url, mission')
        .single();
      
      if (data) {
        setSchoolInfo(data);
      }
    };

    fetchSchoolInfo();
  }, []);

  if (!schoolInfo) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": "https://samge.sc.ke",
    "name": schoolInfo.school_name,
    "url": "https://samge.sc.ke",
    "logo": schoolInfo.logo_url || "https://samge.sc.ke/icon.png",
    "description": schoolInfo.mission || `${schoolInfo.school_name} - Quality Education for All`,
    "address": schoolInfo.address ? {
      "@type": "PostalAddress",
      "streetAddress": schoolInfo.address
    } : undefined,
    "telephone": schoolInfo.phone,
    "email": schoolInfo.email,
    "sameAs": [],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": schoolInfo.phone,
      "contactType": "admissions",
      "email": schoolInfo.email
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd, null, 2) }}
    />
  );
};

export default SchoolJsonLd;
