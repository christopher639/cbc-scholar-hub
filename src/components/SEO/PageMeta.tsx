import { useEffect } from 'react';

interface PageMetaProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  keywords?: string;
}

export const PageMeta = ({ 
  title, 
  description, 
  canonical,
  ogImage = "https://storage.googleapis.com/gpt-engineer-file-uploads/iIZ6561knQR2vIdUu6Hvn1dymg33/social-images/social-1764332326507-samge-logo.jpg",
  keywords
}: PageMetaProps) => {
  useEffect(() => {
    // Update title
    document.title = title;

    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }

    // Update OG title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', title);
    }

    // Update OG description
    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', description);
    }

    // Update OG image
    let ogImageMeta = document.querySelector('meta[property="og:image"]');
    if (ogImageMeta && ogImage) {
      ogImageMeta.setAttribute('content', ogImage);
    }

    // Update Twitter title
    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', title);
    }

    // Update Twitter description
    let twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', description);
    }

    // Update Twitter image
    let twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage && ogImage) {
      twitterImage.setAttribute('content', ogImage);
    }

    // Add/update canonical link
    if (canonical) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = canonical;
    }

    // Add/update keywords
    if (keywords) {
      let keywordsMeta = document.querySelector('meta[name="keywords"]');
      if (!keywordsMeta) {
        keywordsMeta = document.createElement('meta');
        keywordsMeta.setAttribute('name', 'keywords');
        document.head.appendChild(keywordsMeta);
      }
      keywordsMeta.setAttribute('content', keywords);
    }

    // Cleanup
    return () => {
      // Reset to default on unmount if needed
    };
  }, [title, description, canonical, ogImage, keywords]);

  return null;
};

export default PageMeta;
