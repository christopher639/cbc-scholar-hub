import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { supabase } from "@/integrations/supabase/client";
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
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Play,
  Shield,
  Zap,
} from "lucide-react";

export default function Home() {
  const { schoolInfo, loading } = useSchoolInfo();
  const [stats, setStats] = useState({ learners: 0 });
  const [grades, setGrades] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const [learnerCountRes, gradesRes] = await Promise.all([
        supabase.rpc("get_active_learner_count"),
        supabase.from("grades").select("name").order("grade_level"),
      ]);
      setStats({
        learners: learnerCountRes.data || 0,
      });
      setGrades(gradesRes.data?.map(g => g.name) || []);
    };
    fetchData();
  }, []);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Programs", href: "#programs" },
    { name: "Admissions", href: "#admissions" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur-xl shadow-lg border-b border-border/50" : "bg-background/20 backdrop-blur-md"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo + School Name (visible on all screens) */}
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
              {/* School name visible on ALL screens */}
              <div>
                <h1 className="text-sm sm:text-base md:text-lg font-bold text-foreground leading-tight line-clamp-1">
                  {schoolInfo?.school_name || "SAGME School"}
                </h1>
                {schoolInfo?.motto && (
                  <p className="hidden sm:block text-[10px] md:text-xs text-muted-foreground line-clamp-1">{schoolInfo.motto}</p>
                )}
              </div>
            </div>

            {/* Desktop Navigation */}
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

            {/* Right side actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Link to="/auth">
                <Button 
                  size="sm" 
                  className="hidden sm:flex gap-2 shadow-md"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
                <Button size="icon" variant="ghost" className="sm:hidden h-9 w-9">
                  <LogIn className="h-4 w-4" />
                </Button>
              </Link>

              {/* Mobile menu button */}
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

        {/* Mobile Navigation */}
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

      {/* Hero Section - Beautiful Redesign */}
      <section id="home" className="relative min-h-screen flex items-center">
        {/* Background Image with overlay */}
        <div className="absolute inset-0">
          <img 
            src={heroSchoolBg} 
            alt="School Campus" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Gradient overlays for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background" />
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--foreground)/0.1)_1px,transparent_0)] bg-[size:24px_24px]" />
        </div>
        
        <div className="relative w-full pt-24 pb-16 md:pt-32 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              {/* Excellence Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/15 backdrop-blur-sm rounded-full text-primary text-xs sm:text-sm font-semibold mb-6 border border-primary/30 shadow-lg animate-fade-in">
                <Sparkles className="h-4 w-4" />
                <span>Excellence in Education</span>
              </div>
              
              {/* Main Heading - 2 lines */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-foreground leading-[1.05] tracking-tight mb-3 animate-fade-in">
                Welcome to
              </h1>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6 animate-fade-in">
                <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent drop-shadow-sm">
                  {schoolInfo?.school_name || "SAGME School"}
                </span>
              </h1>
              
              {/* Motto */}
              <p className="text-xl sm:text-2xl md:text-3xl text-foreground/80 mb-8 font-medium animate-fade-in">
                {schoolInfo?.motto || "Nurturing minds, building futures"}
              </p>

              {/* Stats Row */}
              <div className="flex flex-wrap gap-4 mb-8 animate-fade-in">
                <div className="flex items-center gap-3 px-5 py-3 bg-card/90 backdrop-blur-md rounded-2xl border border-border/60 shadow-xl">
                  <div className="h-12 w-12 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.learners}+</p>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">Learners</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 px-5 py-3 bg-card/90 backdrop-blur-md rounded-2xl border border-border/60 shadow-xl">
                  <div className="h-12 w-12 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold text-foreground">{grades.length}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">Grade Levels</p>
                  </div>
                </div>
              </div>

              {/* Grades Pills */}
              {grades.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8 animate-fade-in">
                  {grades.map((grade, i) => (
                    <span
                      key={i}
                      className="px-4 py-2 bg-foreground/5 backdrop-blur-sm text-foreground text-sm font-medium rounded-full border border-foreground/10 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all cursor-default"
                    >
                      {grade}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <p className="text-base sm:text-lg text-muted-foreground mb-10 max-w-2xl leading-relaxed animate-fade-in">
                We are a Center of Excellence committed to nurturing young minds through innovative teaching, 
                a supportive environment, and a curriculum that develops well-rounded individuals ready for success.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
                <a href="#admissions">
                  <Button size="lg" className="w-full sm:w-auto gap-2 h-14 px-8 text-base font-semibold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02] transition-all">
                    Apply Now
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </a>
                <a href="#about">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 h-14 px-8 text-base font-semibold bg-background/60 backdrop-blur-sm border-2 hover:bg-background/80 hover:scale-[1.02] transition-all">
                    <Play className="h-5 w-5" />
                    Learn More
                  </Button>
                </a>
              </div>

              {/* Why Choose Us - Mobile/Tablet (shown below CTA on small screens) */}
              <div className="xl:hidden mt-10 animate-fade-in">
                <h3 className="text-lg font-bold text-foreground mb-4">Why Choose Us?</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Shield, title: "Safe & Secure", desc: "Protected environment", color: "from-green-500/20 to-green-500/5" },
                    { icon: Zap, title: "Modern Facilities", desc: "Tech classrooms", color: "from-yellow-500/20 to-yellow-500/5" },
                    { icon: Award, title: "Excellence", desc: "Quality education", color: "from-blue-500/20 to-blue-500/5" },
                    { icon: Heart, title: "Caring Community", desc: "Supportive staff", color: "from-pink-500/20 to-pink-500/5" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-card/80 backdrop-blur-md rounded-xl border border-border/50 shadow-md">
                      <div className={`h-10 w-10 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <item.icon className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-xs">{item.title}</h4>
                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feature Cards - Floating on right (XL screens only) */}
            <div className="hidden xl:block absolute right-8 top-1/2 -translate-y-1/2 w-80">
              <div className="space-y-4 animate-fade-in">
                {[
                  { icon: Shield, title: "Safe & Secure", desc: "Protected learning environment", color: "from-green-500/20 to-green-500/5" },
                  { icon: Zap, title: "Modern Facilities", desc: "Tech-enhanced classrooms", color: "from-yellow-500/20 to-yellow-500/5" },
                  { icon: Award, title: "Excellence", desc: "Quality education standards", color: "from-blue-500/20 to-blue-500/5" },
                  { icon: Heart, title: "Caring Community", desc: "Supportive staff & peers", color: "from-pink-500/20 to-pink-500/5" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-card/80 backdrop-blur-xl rounded-2xl border border-border/50 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
                    <div className={`h-12 w-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <item.icon className="h-6 w-6 text-foreground" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Scroll to explore</span>
          <div className="w-6 h-10 rounded-full border-2 border-foreground/20 flex justify-center bg-background/30 backdrop-blur-sm">
            <div className="w-1.5 h-3 bg-primary rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-24 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-primary text-xs font-medium mb-4">
              About Us
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Shaping Tomorrow's Leaders
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base md:text-lg">
              We are committed to providing quality education that empowers students to achieve their full potential.
            </p>
          </div>

          {/* Mission, Vision, Values Cards */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 mb-12 md:mb-16">
            {[
              { 
                icon: Target, 
                title: "Our Mission", 
                content: schoolInfo?.mission || "To provide a nurturing environment where every learner can discover their potential and develop into responsible citizens.",
                color: "primary"
              },
              { 
                icon: Lightbulb, 
                title: "Our Vision", 
                content: schoolInfo?.vision || "To be a center of academic excellence, producing well-rounded individuals who contribute positively to society.",
                color: "secondary"
              },
              { 
                icon: Heart, 
                title: "Core Values", 
                content: schoolInfo?.core_values || "Integrity, excellence, respect, and compassion guide everything we do in shaping young minds.",
                color: "accent"
              },
            ].map((item, i) => (
              <Card key={i} className="group relative overflow-hidden border-0 bg-gradient-to-b from-card to-card/50 shadow-lg hover:shadow-xl transition-all duration-500">
                <div className={`absolute inset-0 bg-gradient-to-br from-${item.color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <CardContent className="relative p-6 md:p-8 text-center">
                  <div className={`h-14 w-14 md:h-16 md:w-16 bg-${item.color}/10 rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className={`h-7 w-7 md:h-8 md:w-8 text-${item.color}`} />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{item.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Director Message */}
          {schoolInfo?.director_name && (
            <Card className="overflow-hidden border-0 bg-gradient-to-br from-card via-card to-muted/20 shadow-xl">
              <CardContent className="p-6 md:p-10 lg:p-12">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-center">
                  <div className="relative flex-shrink-0">
                    {schoolInfo.director_photo_url ? (
                      <img
                        src={schoolInfo.director_photo_url}
                        alt={schoolInfo.director_name}
                        className="h-32 w-32 md:h-40 md:w-40 lg:h-48 lg:w-48 rounded-2xl object-cover shadow-lg"
                      />
                    ) : (
                      <div className="h-32 w-32 md:h-40 md:w-40 lg:h-48 lg:w-48 bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center">
                        <Users className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                      <Sparkles className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="text-center lg:text-left flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-primary text-xs font-medium mb-3">
                      Message from Leadership
                    </div>
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-4">
                      From the Director's Desk
                    </h3>
                    <p className="text-muted-foreground italic text-sm md:text-base lg:text-lg leading-relaxed mb-6">
                      "{schoolInfo.director_message || "Welcome to our school. We are committed to providing the best education for your children."}"
                    </p>
                    <div>
                      <p className="font-bold text-foreground text-base md:text-lg">{schoolInfo.director_name}</p>
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
      <section id="programs" className="py-16 md:py-24 lg:py-32 bg-muted/30 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary/10 rounded-full text-secondary text-xs font-medium mb-4">
              What We Offer
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Our Programs
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base md:text-lg">
              Comprehensive educational programs designed to nurture every aspect of student development.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: BookOpen, title: "Academic Excellence", desc: "Rigorous curriculum aligned with national standards", color: "primary" },
              { icon: Shield, title: "Safe Environment", desc: "Secure and nurturing learning atmosphere", color: "secondary" },
              { icon: Award, title: "Co-curricular", desc: "Sports, arts, and club activities", color: "accent" },
              { icon: Zap, title: "Modern Learning", desc: "Technology-enhanced education", color: "primary" },
            ].map((program, i) => (
              <Card key={i} className="group border-0 bg-card hover:bg-card/80 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <CardContent className="p-5 md:p-6">
                  <div className={`h-12 w-12 bg-${program.color}/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <program.icon className={`h-6 w-6 text-${program.color}`} />
                  </div>
                  <h3 className="font-bold text-foreground text-base md:text-lg mb-2">{program.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{program.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Admissions Section */}
      <section id="admissions" className="py-16 md:py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-primary text-xs font-medium mb-4">
                Enroll Now
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 md:mb-6">
                Join Our School Community
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-6 md:mb-8 leading-relaxed">
                We welcome applications from students who are eager to learn and grow. Our admissions process is designed to be simple and transparent.
              </p>
              <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                {[
                  { icon: Calendar, text: "Admissions open throughout the year" },
                  { icon: Clock, text: "Quick and easy application process" },
                  { icon: Users, text: "Supportive admissions team" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 md:gap-4">
                    <div className="h-10 w-10 md:h-12 md:w-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                    </div>
                    <span className="text-foreground text-sm md:text-base font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
              <Link to="/auth">
                <Button size="lg" className="gap-2 h-11 md:h-12 px-6 md:px-8 shadow-lg shadow-primary/20">
                  Start Application
                  <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </Link>
            </div>
            
            <Card className="border-0 bg-card shadow-2xl overflow-hidden">
              <CardContent className="p-6 md:p-8 lg:p-10">
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-6 md:mb-8">Application Requirements</h3>
                <ul className="space-y-3 md:space-y-4">
                  {[
                    "Completed application form",
                    "Birth certificate copy",
                    "Previous school records",
                    "Passport photos (2)",
                    "Parent/Guardian ID copy",
                  ].map((req, i) => (
                    <li key={i} className="flex items-center gap-3 md:gap-4">
                      <div className="h-6 w-6 md:h-7 md:w-7 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-secondary" />
                      </div>
                      <span className="text-muted-foreground text-sm md:text-base font-medium">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-24 lg:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-full text-accent text-xs font-medium mb-4">
              Get in Touch
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Contact Us
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base md:text-lg">
              Have questions? We'd love to hear from you.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[
              { icon: MapPin, title: "Address", content: schoolInfo?.address || "School Address, City, Country", color: "primary" },
              { icon: Phone, title: "Phone", content: schoolInfo?.phone || "+254 XXX XXX XXX", color: "secondary" },
              { icon: Mail, title: "Email", content: schoolInfo?.email || "info@school.com", color: "accent" },
            ].map((item, i) => (
              <Card key={i} className="group border-0 bg-card shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6 md:p-8 text-center">
                  <div className={`h-14 w-14 md:h-16 md:w-16 bg-${item.color}/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className={`h-7 w-7 md:h-8 md:w-8 text-${item.color}`} />
                  </div>
                  <h3 className="font-bold text-foreground text-base md:text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm md:text-base">{item.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8 md:mb-12">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                {schoolInfo?.logo_url ? (
                  <img
                    src={schoolInfo.logo_url}
                    alt="School Logo"
                    className="h-10 w-10 md:h-12 md:w-12 object-contain rounded-xl bg-background/10 p-1"
                  />
                ) : (
                  <div className="h-10 w-10 md:h-12 md:w-12 bg-primary rounded-xl flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
                  </div>
                )}
                <h3 className="text-lg md:text-xl font-bold">
                  {schoolInfo?.school_name || "SAGME School"}
                </h3>
              </div>
              <p className="text-background/70 max-w-sm text-sm md:text-base leading-relaxed">
                {schoolInfo?.motto || "Nurturing minds, building futures."}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm md:text-base">Quick Links</h4>
              <ul className="space-y-2 md:space-y-3">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-background/70 hover:text-background transition-colors text-sm">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm md:text-base">Portal Access</h4>
              <ul className="space-y-2 md:space-y-3">
                {["Student Portal", "Teacher Portal", "Admin Login"].map((item) => (
                  <li key={item}>
                    <Link to="/auth" className="text-background/70 hover:text-background transition-colors text-sm">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-background/20 pt-6 md:pt-8 text-center">
            <p className="text-background/60 text-xs md:text-sm">
              © {new Date().getFullYear()} {schoolInfo?.school_name || "SAGME School"}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
