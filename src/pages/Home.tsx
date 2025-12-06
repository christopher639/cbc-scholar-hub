import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import heroSchoolBg from "@/assets/hero-school-bg.jpg";
import {
  GraduationCap,
  Users,
  BookOpen,
  Award,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Menu,
  X,
  LogIn,
  Calendar,
  Clock,
  Heart,
  Target,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Play,
  Shield,
  Zap,
  Quote,
  Send,
  Loader2,
  FileText,
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

// Generate or get visitor ID
const getVisitorId = (): string => {
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
};

export default function Home() {
  const { schoolInfo, loading } = useSchoolInfo();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
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
    
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim() || null,
        message: contactForm.message.trim(),
      });

      if (error) throw error;

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

  const heroBackground = heroBackgrounds.length > 0 
    ? heroBackgrounds[currentBgIndex] 
    : (schoolInfo?.hero_background_url || heroSchoolBg);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur-xl shadow-lg border-b border-border/50" : "bg-background/20 backdrop-blur-md"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-2 sm:gap-3">
              {schoolInfo?.logo_url ? (
                <img
                  src={schoolInfo.logo_url}
                  alt="School Logo"
                  className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 object-contain rounded-xl shadow-md"
                />
              ) : (
                <div className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-md">
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary-foreground" />
                </div>
              )}
              <div>
                <h1 className="text-sm sm:text-base md:text-lg font-bold text-foreground leading-tight line-clamp-1">
                  {schoolInfo?.school_name || "SAGME School"}
                </h1>
                {schoolInfo?.motto && (
                  <p className="hidden sm:block text-[10px] md:text-xs text-muted-foreground line-clamp-1">{schoolInfo.motto}</p>
                )}
              </div>
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
                <Button size="sm" className="hidden sm:flex gap-2 shadow-md">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
                <Button size="icon" variant="ghost" className="sm:hidden h-9 w-9">
                  <LogIn className="h-4 w-4" />
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
                    <LogIn className="h-4 w-4" />
                    Login to Portal
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="home" className="relative min-h-[90vh] flex items-center">
        <div className="absolute inset-0">
          <img 
            key={currentBgIndex}
            src={heroBackground} 
            alt="School Campus" 
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 animate-fade-in"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/60" />
        </div>
        
        <div className="relative w-full pt-24 pb-16 md:pt-32 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4 drop-shadow-md">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-lg">
                  {schoolInfo?.school_name || "SAGME School"}
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl md:text-2xl text-foreground mb-8 font-medium drop-shadow-sm">
                {schoolInfo?.motto || "Nurturing minds, building futures"}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a href="#contact">
                  <Button size="lg" className="gap-2 h-11 px-5">
                    Get in Touch
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <a href="#about">
                  <Button variant="outline" size="lg" className="gap-2 h-11 px-5 bg-background/60 backdrop-blur-sm">
                    <Play className="h-4 w-4" />
                    Learn More
                  </Button>
                </a>
              </div>

              {/* Why Choose Us Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { icon: Shield, title: "Safe Environment", color: "text-green-600" },
                  { icon: Zap, title: "Modern Facilities", color: "text-yellow-600" },
                  { icon: Award, title: "Quality Education", color: "text-blue-600" },
                  { icon: Heart, title: "Caring Teachers", color: "text-pink-600" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-card/80 backdrop-blur-md rounded-xl border border-border/50">
                    <item.icon className={`h-5 w-5 ${item.color} flex-shrink-0`} />
                    <span className="text-xs sm:text-sm font-medium text-foreground">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      {blogs.length > 0 && (
        <section id="blog" className="py-16 md:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-primary text-sm font-medium mb-2">Latest Updates</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
                News & Blog
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Stay updated with the latest news, events, and stories from our school community.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {blogs.map((blog) => (
                <Card key={blog.id} className="overflow-hidden border bg-card hover:shadow-lg transition-shadow group">
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
                        onClick={() => handleLikeBlog(blog.id)}
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
                    <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2">
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
            <div className="text-center mb-12">
              <p className="text-primary text-sm font-medium mb-2">Our School</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
                Photo Gallery
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explore our facilities, events, and vibrant school life through our gallery.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-medium mb-2">About Us</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              Shaping Tomorrow's Leaders
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We are committed to providing quality education that empowers students to achieve their full potential.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { 
                icon: Target, 
                title: "Our Mission", 
                content: schoolInfo?.mission || "To provide a nurturing environment where every learner can discover their potential and develop into responsible citizens.",
              },
              { 
                icon: Lightbulb, 
                title: "Our Vision", 
                content: schoolInfo?.vision || "To be a center of academic excellence, producing well-rounded individuals who contribute positively to society.",
              },
              { 
                icon: Heart, 
                title: "Core Values", 
                content: schoolInfo?.core_values || "Integrity, excellence, respect, and compassion guide everything we do in shaping young minds.",
              },
            ].map((item, i) => (
              <Card key={i} className="border bg-card">
                <CardContent className="p-6 text-center">
                  <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>

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
      <section id="programs" className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-medium mb-2">What We Offer</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Programs
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive educational programs designed to nurture every aspect of your child's development.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: "Early Years",
                description: "Foundation learning through play-based activities for ages 3-6 years.",
                color: "bg-blue-500/10 text-blue-600",
              },
              {
                icon: GraduationCap,
                title: "Primary Education",
                description: "Comprehensive CBC curriculum covering all learning areas for grades 1-6.",
                color: "bg-green-500/10 text-green-600",
              },
              {
                icon: Award,
                title: "Junior Secondary",
                description: "Advanced learning preparing students for senior secondary education.",
                color: "bg-purple-500/10 text-purple-600",
              },
              {
                icon: Users,
                title: "Extra-Curricular",
                description: "Sports, music, art, and clubs for holistic development.",
                color: "bg-orange-500/10 text-orange-600",
              },
              {
                icon: Lightbulb,
                title: "STEM Programs",
                description: "Science, technology, engineering, and mathematics focus.",
                color: "bg-cyan-500/10 text-cyan-600",
              },
              {
                icon: Heart,
                title: "Character Building",
                description: "Values-based education fostering responsible citizenship.",
                color: "bg-pink-500/10 text-pink-600",
              },
            ].map((program, i) => (
              <Card key={i} className="border bg-card hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${program.color}`}>
                    <program.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{program.title}</h3>
                  <p className="text-muted-foreground text-sm">{program.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-medium mb-2">Testimonials</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Parents Say
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hear from our community of satisfied parents and guardians.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <Card key={i} className="border bg-card">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-primary/30 mb-4" />
                  <p className="text-muted-foreground mb-6 italic leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{testimonial.name}</p>
                      <p className="text-muted-foreground text-xs">{testimonial.role}</p>
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
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <p className="text-primary text-sm font-medium mb-2">Get in Touch</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
                Contact Us
              </h2>
              <p className="text-muted-foreground mb-8">
                Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
              </p>

              <div className="space-y-4">
                {schoolInfo?.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium text-foreground">Address</p>
                      <p className="text-muted-foreground text-sm">{schoolInfo.address}</p>
                    </div>
                  </div>
                )}
                {schoolInfo?.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium text-foreground">Phone</p>
                      <p className="text-muted-foreground text-sm">{schoolInfo.phone}</p>
                    </div>
                  </div>
                )}
                {schoolInfo?.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <p className="font-medium text-foreground">Email</p>
                      <p className="text-muted-foreground text-sm">{schoolInfo.email}</p>
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
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="+254 7XX XXX XXX"
                    />
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
      <footer className="bg-card border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {schoolInfo?.logo_url ? (
                <img src={schoolInfo.logo_url} alt="Logo" className="h-8 w-8 object-contain" />
              ) : (
                <GraduationCap className="h-6 w-6 text-primary" />
              )}
              <span className="font-bold text-foreground">{schoolInfo?.school_name || "SAGME School"}</span>
            </div>
            <p className="text-muted-foreground text-sm text-center">
              © {new Date().getFullYear()} {schoolInfo?.school_name || "SAGME School"}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}