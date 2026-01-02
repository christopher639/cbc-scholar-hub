import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import SchoolJsonLd from "@/components/SEO/SchoolJsonLd";
import PageMeta from "@/components/SEO/PageMeta";

import {
  GraduationCap,
  Users,
  BookOpen,
  Award,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  User,
  Calendar,
  Heart,
  Target,
  Lightbulb,
  Quote,
  Send,
  Loader2,
  Star,
  Palette,
  Music,
  Trophy,
  Cpu,
} from "lucide-react";

interface Blog {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  likes_count: number;
  created_at: string;
}

interface GalleryImage {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category: string;
}

interface Program {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  color: string;
}

// Generate or get visitor ID
const getVisitorId = (): string => {
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
};

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  GraduationCap,
  Award,
  Users,
  Lightbulb,
  Heart,
  Star,
  Palette,
  Music,
  Trophy,
  Cpu,
};

export default function Home() {
  const { schoolInfo, loading } = useSchoolInfo();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [likedBlogs, setLikedBlogs] = useState<Set<string>>(new Set());
  const [likingBlog, setLikingBlog] = useState<string | null>(null);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<GalleryImage | null>(null);
  const [heroBackgrounds, setHeroBackgrounds] = useState<string[]>([]);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track page visit
  useEffect(() => {
    const trackVisit = async () => {
      const visitorId = getVisitorId();
      try {
        await supabase.from("page_visits").insert({
          visitor_id: visitorId,
          page_path: '/',
          user_agent: navigator.userAgent,
        });
      } catch (error) {
        // Ignore duplicate visit errors
        console.log("Visit tracking:", error);
      }
    };
    trackVisit();
  }, []);

  useEffect(() => {
    const fetchBlogs = async () => {
      const { data } = await supabase
        .from("blogs")
        .select("id, title, description, image_url, likes_count, created_at")
        .eq("is_published", true)
        .order("likes_count", { ascending: false })
        .limit(4);
      setBlogs(data || []);
    };
    fetchBlogs();

    // Load liked blogs from localStorage
    const storedLikes = localStorage.getItem('liked_blogs');
    if (storedLikes) {
      setLikedBlogs(new Set(JSON.parse(storedLikes)));
    }
  }, []);

  useEffect(() => {
    const fetchGallery = async () => {
      const { data } = await supabase
        .from("gallery_images")
        .select("id, title, description, image_url, category")
        .eq("is_published", true)
        .order("display_order", { ascending: true })
        .limit(8);
      setGalleryImages(data || []);
    };
    fetchGallery();
  }, []);

  // Fetch programs
  useEffect(() => {
    const fetchPrograms = async () => {
      const { data } = await supabase
        .from("programs")
        .select("id, title, description, icon, color")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      setPrograms(data || []);
    };
    fetchPrograms();
  }, []);

  // Fetch hero backgrounds
  useEffect(() => {
    const fetchHeroBackgrounds = async () => {
      const { data } = await supabase
        .from("hero_backgrounds")
        .select("image_url")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (data && data.length > 0) {
        setHeroBackgrounds(data.map((bg) => bg.image_url));
      }
    };
    fetchHeroBackgrounds();
  }, []);

  // Cycle through hero backgrounds every 3 seconds
  useEffect(() => {
    if (heroBackgrounds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % heroBackgrounds.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [heroBackgrounds]);

  const handleLikeBlog = async (blogId: string) => {
    const visitorId = getVisitorId();
    setLikingBlog(blogId);

    try {
      if (likedBlogs.has(blogId)) {
        // Unlike
        await supabase
          .from("blog_likes")
          .delete()
          .eq("blog_id", blogId)
          .eq("visitor_id", visitorId);

        const newLikedBlogs = new Set(likedBlogs);
        newLikedBlogs.delete(blogId);
        setLikedBlogs(newLikedBlogs);
        localStorage.setItem('liked_blogs', JSON.stringify([...newLikedBlogs]));

        setBlogs(blogs.map(b => 
          b.id === blogId ? { ...b, likes_count: Math.max(0, b.likes_count - 1) } : b
        ));
      } else {
        // Like
        await supabase.from("blog_likes").insert({
          blog_id: blogId,
          visitor_id: visitorId,
        });

        const newLikedBlogs = new Set(likedBlogs);
        newLikedBlogs.add(blogId);
        setLikedBlogs(newLikedBlogs);
        localStorage.setItem('liked_blogs', JSON.stringify([...newLikedBlogs]));

        setBlogs(blogs.map(b => 
          b.id === blogId ? { ...b, likes_count: b.likes_count + 1 } : b
        ));
      }
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to update like", variant: "destructive" });
    } finally {
      setLikingBlog(null);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim() || !contactForm.phone.trim()) {
      toast({ title: "Error", description: "Please fill in all required fields including phone number", variant: "destructive" });
      return;
    }

    if (contactForm.phone.length !== 9) {
      toast({ title: "Error", description: "Please enter a valid 9-digit phone number", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const formattedPhone = "+254" + contactForm.phone;
      const { error } = await supabase.from("contact_messages").insert({
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        phone: formattedPhone,
        message: contactForm.message.trim(),
      });

      if (error) throw error;

      // Send confirmation email to the visitor
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: contactForm.name.trim(),
            email: contactForm.email.trim(),
            message: contactForm.message.trim(),
          }),
        });
      } catch (emailError) {
        console.log("Email confirmation error (non-blocking):", emailError);
      }

      toast({ title: "Message Sent!", description: "Thank you for contacting us. We'll get back to you soon." });
      setContactForm({ name: "", email: "", phone: "", message: "" });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to send message. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Blog", href: "#blog" },
    { name: "Gallery", href: "#gallery" },
    { name: "Programs", href: "#programs" },
    { name: "Contact", href: "#contact" },
  ];

  const testimonials = [
    {
      name: "Mary Wanjiku",
      role: "Parent of Grade 5 Student",
      content: "My daughter has thrived here. The teachers genuinely care about each child's progress and the communication with parents is excellent.",
      avatar: "MW",
    },
    {
      name: "James Omondi",
      role: "Parent of Two Students",
      content: "Both my children attend this school and I've seen remarkable improvement in their academics and confidence. Highly recommended!",
      avatar: "JO",
    },
    {
      name: "Grace Muthoni",
      role: "Parent of Grade 3 Student",
      content: "The school's holistic approach to education has helped my son develop not just academically but also in character. We're very happy.",
      avatar: "GM",
    },
  ];


  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* SEO Components */}
      <PageMeta 
        title={`${schoolInfo?.school_name || 'Samge Boarding School'} - Quality Education for All`}
        description={schoolInfo?.mission || "Samge Boarding School offers quality education with modern facilities, experienced teachers, and a nurturing environment for students to thrive."}
        canonical="https://samge.sc.ke/"
        keywords="Samge Boarding School, Kenya school, quality education, CBC curriculum, boarding school, primary school, secondary school"
      />
      <SchoolJsonLd />
      
      {/* Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur-xl shadow-lg border-b border-border/50" : "bg-background/20 backdrop-blur-md"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-2 sm:gap-3">
              {schoolInfo?.logo_url ? (
                <div className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full overflow-hidden shadow-md flex-shrink-0">
                  <img
                    src={schoolInfo.logo_url}
                    alt="School Logo"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-md">
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary-foreground" />
                </div>
              )}
              {(schoolInfo?.school_name || schoolInfo?.motto) && (
                <div>
                  {schoolInfo?.school_name && (
                    <h1 className="text-sm sm:text-base md:text-lg font-bold text-foreground leading-tight line-clamp-1">
                      {schoolInfo.school_name}
                    </h1>
                  )}
                  {schoolInfo?.motto && (
                    <p className="hidden sm:block text-[10px] md:text-xs text-muted-foreground line-clamp-1">{schoolInfo.motto}</p>
                  )}
                </div>
              )}
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/5 rounded-lg transition-all"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <Link to="/auth">
                <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full hover:bg-primary/10">
                  <User className="h-5 w-5" />
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden bg-background/98 backdrop-blur-xl border-t border-border animate-fade-in">
            <nav className="flex flex-col py-4 px-4 gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="py-3 px-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 border-t border-border mt-2">
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full gap-2">
                    <User className="h-4 w-4" />
                    Sign In / Sign Up
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section - Full Background */}
      <section id="home" className="relative min-h-[85vh] md:min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Image with Overlay */}
        {(heroBackgrounds.length > 0 || schoolInfo?.hero_background_url) && (
          <>
            <img 
              key={currentBgIndex}
              src={heroBackgrounds.length > 0 ? heroBackgrounds[currentBgIndex] : schoolInfo?.hero_background_url} 
              alt="School Campus" 
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 animate-fade-in scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
          </>
        )}
        
        {/* Hero Content */}
        <div className="relative w-full pt-32 md:pt-36 pb-20 flex items-center justify-center min-h-[85vh] md:min-h-[90vh]">
          <div className="max-w-4xl mx-auto px-4 text-center">
            {/* Decorative element */}
            <div className="flex justify-center mb-6">
              <div className="h-1 w-20 bg-primary rounded-full" />
            </div>
            
            {schoolInfo?.school_name && (
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 drop-shadow-2xl animate-fade-in">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-primary-foreground to-white bg-clip-text">
                  {schoolInfo.school_name}
                </span>
              </h1>
            )}
            
            {schoolInfo?.motto && (
              <p className="text-lg sm:text-xl md:text-2xl text-white/90 font-medium drop-shadow-lg mb-8 max-w-2xl mx-auto">
                "{schoolInfo.motto}"
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
              <a href="#about">
                <Button size="lg" className="gap-2 text-base px-8 shadow-lg hover:shadow-xl transition-all">
                  <BookOpen className="h-5 w-5" />
                  Learn More
                </Button>
              </a>
              <a href="#contact">
                <Button size="lg" variant="outline" className="gap-2 text-base px-8 bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm">
                  <Phone className="h-5 w-5" />
                  Contact Us
                </Button>
              </a>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
              <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
                <div className="w-1.5 h-3 bg-white/70 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Hero Background Indicators */}
        {heroBackgrounds.length > 1 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
            {heroBackgrounds.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentBgIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentBgIndex ? "bg-white w-8" : "bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Blog Section */}
      {blogs.length > 0 && (
        <section id="blog" className="py-16 md:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                <BookOpen className="h-4 w-4" />
                Latest Updates
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
                News & Blog
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Stay updated with the latest news, events, and stories from our school community.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-8">
              {blogs.map((blog) => (
                <Card 
                  key={blog.id} 
                  className="overflow-hidden border bg-card hover:shadow-lg transition-shadow group cursor-pointer"
                  onClick={() => navigate(`/blog/${blog.id}`)}
                >
                  {blog.image_url && (
                    <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden">
                      <img
                        src={blog.image_url}
                        alt={blog.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(blog.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikeBlog(blog.id);
                        }}
                        disabled={likingBlog === blog.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                          likedBlogs.has(blog.id)
                            ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-600"
                        }`}
                      >
                        <Heart className={`h-3 w-3 ${likedBlogs.has(blog.id) ? "fill-current" : ""}`} />
                        {blog.likes_count}
                      </button>
                    </div>
                    <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {blog.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {blog.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Photo Gallery Section */}
      {galleryImages.length > 0 && (
        <section id="gallery" className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                <Star className="h-4 w-4" />
                Our School
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
                Photo Gallery
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Explore our facilities, events, and vibrant school life through our gallery.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {galleryImages.map((image) => (
                <div
                  key={image.id}
                  className="group relative aspect-square overflow-hidden rounded-xl cursor-pointer"
                  onClick={() => setSelectedGalleryImage(image)}
                >
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-medium text-sm truncate">{image.title}</p>
                      <p className="text-white/70 text-xs capitalize">{image.category}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Lightbox Modal */}
      {selectedGalleryImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedGalleryImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <button
              onClick={() => setSelectedGalleryImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-primary transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={selectedGalleryImage.image_url}
              alt={selectedGalleryImage.title}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            <div className="mt-4 text-center">
              <h3 className="text-white text-xl font-bold">{selectedGalleryImage.title}</h3>
              {selectedGalleryImage.description && (
                <p className="text-white/70 mt-2">{selectedGalleryImage.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <section id="about" className="py-16 md:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
              <GraduationCap className="h-4 w-4" />
              About Us
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
              Shaping Tomorrow's Leaders
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              We are committed to providing quality education that empowers students to achieve their full potential.
            </p>
          </div>

          {(schoolInfo?.mission || schoolInfo?.vision || schoolInfo?.core_values) && (
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {schoolInfo?.mission && (
                <Card className="border bg-card">
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-3">Our Mission</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{schoolInfo.mission}</p>
                  </CardContent>
                </Card>
              )}
              {schoolInfo?.vision && (
                <Card className="border bg-card">
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Lightbulb className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-3">Our Vision</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{schoolInfo.vision}</p>
                  </CardContent>
                </Card>
              )}
              {schoolInfo?.core_values && (
                <Card className="border bg-card">
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Heart className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-3">Core Values</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{schoolInfo.core_values}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Director Message */}
          {schoolInfo?.director_name && (
            <Card className="bg-muted/30 border">
              <CardContent className="p-6 md:p-10">
                <div className="flex flex-col lg:flex-row gap-6 items-center">
                  <div className="flex-shrink-0">
                    {schoolInfo.director_photo_url ? (
                      <img
                        src={schoolInfo.director_photo_url}
                        alt={schoolInfo.director_name}
                        className="h-32 w-32 md:h-40 md:w-40 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="h-32 w-32 md:h-40 md:w-40 bg-muted rounded-2xl flex items-center justify-center">
                        <Users className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="text-center lg:text-left flex-1">
                    <p className="text-primary text-sm font-medium mb-2">Message from Leadership</p>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                      From the Director's Desk
                    </h3>
                    <p className="text-muted-foreground italic mb-4 leading-relaxed">
                      "{schoolInfo.director_message || "Welcome to our school. We are committed to providing the best education for your children."}"
                    </p>
                    <div>
                      <p className="font-bold text-foreground">{schoolInfo.director_name}</p>
                      {schoolInfo.director_qualification && (
                        <p className="text-muted-foreground text-sm">{schoolInfo.director_qualification}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Programs Section */}
      {programs.length > 0 && (
        <section id="programs" className="py-16 md:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                <Award className="h-4 w-4" />
                What We Offer
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
                Our Programs
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Comprehensive educational programs designed to nurture every aspect of your child's development.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program) => {
                const IconComponent = iconMap[program.icon] || BookOpen;
                return (
                  <Card key={program.id} className="border bg-card hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${program.color}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2">{program.title}</h3>
                      <p className="text-muted-foreground text-sm">{program.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
              <Users className="h-4 w-4" />
              Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
              What Parents Say
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Hear from our community of satisfied parents and guardians.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <Card key={i} className="border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <Quote className="h-10 w-10 text-primary/20 mb-4" />
                  <p className="text-muted-foreground mb-8 italic leading-relaxed text-base">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-primary-foreground font-bold">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{testimonial.name}</p>
                      <p className="text-muted-foreground text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                <Mail className="h-4 w-4" />
                Get in Touch
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
                Contact Us
              </h2>
              <p className="text-muted-foreground text-lg mb-10">
                Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>

              <div className="space-y-6">
                {schoolInfo?.address && (
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-card border hover:shadow-md transition-shadow">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Address</p>
                      <p className="text-muted-foreground">{schoolInfo.address}</p>
                    </div>
                  </div>
                )}
                {schoolInfo?.phone && (
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-card border hover:shadow-md transition-shadow">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Phone</p>
                      <p className="text-muted-foreground">{schoolInfo.phone}</p>
                    </div>
                  </div>
                )}
                {schoolInfo?.email && (
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-card border hover:shadow-md transition-shadow">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Email</p>
                      <p className="text-muted-foreground">{schoolInfo.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Card className="border bg-card">
              <CardContent className="p-6">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone *</Label>
                    <div className="flex">
                      <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm">
                        +254
                      </div>
                      <Input
                        id="phone"
                        value={contactForm.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 9);
                          setContactForm({ ...contactForm, phone: value });
                        }}
                        placeholder="7XX XXX XXX"
                        className="rounded-l-none"
                        maxLength={9}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Enter 9 digits after +254</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="How can we help you?"
                      rows={4}
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={submitting}>
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground/[0.03] border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                {schoolInfo?.logo_url ? (
                  <div className="h-12 w-12 rounded-full overflow-hidden shadow-md">
                    <img src={schoolInfo.logo_url} alt="Logo" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-primary-foreground" />
                  </div>
                )}
                <span className="font-bold text-lg text-foreground">{schoolInfo?.school_name || "SAGME School"}</span>
              </div>
              {schoolInfo?.motto && (
                <p className="text-muted-foreground text-sm italic">"{schoolInfo.motto}"</p>
              )}
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {navLinks.slice(0, 4).map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {schoolInfo?.phone && <li>{schoolInfo.phone}</li>}
                {schoolInfo?.email && <li>{schoolInfo.email}</li>}
                {schoolInfo?.address && <li>{schoolInfo.address}</li>}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8">
            <p className="text-muted-foreground text-sm text-center">
              © {new Date().getFullYear()} {schoolInfo?.school_name || "SAGME School"}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}