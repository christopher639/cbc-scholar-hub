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
      const [learnersRes, gradesRes] = await Promise.all([
        supabase.from("learners").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("grades").select("name").order("grade_level"),
      ]);
      setStats({
        learners: learnersRes.count || 0,
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
        scrolled ? "bg-background/95 backdrop-blur-xl shadow-sm border-b border-border/50" : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {schoolInfo?.logo_url ? (
                <img
                  src={schoolInfo.logo_url}
                  alt="School Logo"
                  className="h-10 w-10 md:h-12 md:w-12 object-contain rounded-xl"
                />
              ) : (
                <div className="h-10 w-10 md:h-12 md:w-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="text-base md:text-lg font-bold text-foreground leading-tight">
                  {schoolInfo?.school_name || "SAGME School"}
                </h1>
                {schoolInfo?.motto && (
                  <p className="text-[10px] md:text-xs text-muted-foreground">{schoolInfo.motto}</p>
                )}
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            {/* Login Button */}
            <div className="flex items-center gap-2">
              <Link to="/auth">
                <Button 
                  variant={scrolled ? "outline" : "ghost"} 
                  size="sm" 
                  className="hidden sm:flex gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
              <Link to="/auth" className="sm:hidden">
                <Button size="icon" variant="ghost">
                  <LogIn className="h-5 w-5" />
                </Button>
              </Link>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
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
                <Link
                  to="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                >
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
      <section id="home" className="relative min-h-screen flex items-center pt-20 lg:pt-24">
        {/* Background Image */}
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={heroSchoolBg} 
            alt="School Campus" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Side - School Info */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 backdrop-blur-sm rounded-full text-primary text-xs sm:text-sm font-medium mb-6 border border-primary/20 animate-fade-in">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Excellence in Education</span>
              </div>
              
              {/* Main Heading - 2 lines */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight mb-2 animate-fade-in">
                Welcome to
              </h1>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight mb-4 md:mb-6 animate-fade-in">
                <span className="bg-gradient-to-r from-primary via-primary/90 to-secondary bg-clip-text text-transparent">
                  {schoolInfo?.school_name || "SAGME School"}
                </span>
              </h1>
              
              {/* Motto */}
              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-6 font-medium animate-fade-in">
                {schoolInfo?.motto || "Nurturing minds, building futures"}
              </p>

              {/* Stats - Below welcome on small screens, left side on all */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-6 animate-fade-in">
                <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm rounded-xl border border-border/50">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.learners}</p>
                    <p className="text-xs text-muted-foreground">Learners</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm rounded-xl border border-border/50">
                  <div className="h-10 w-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{grades.length}</p>
                    <p className="text-xs text-muted-foreground">Grades</p>
                  </div>
                </div>
              </div>

              {/* Grades List */}
              {grades.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-6 animate-fade-in">
                  {grades.map((grade, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-muted/60 backdrop-blur-sm text-foreground text-xs sm:text-sm font-medium rounded-lg border border-border/50"
                    >
                      {grade}
                    </span>
                  ))}
                </div>
              )}

              {/* Description Paragraph */}
              <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-in">
                We are a Center of Excellence committed to nurturing young minds through innovative teaching methods, 
                a supportive learning environment, and a curriculum designed to develop well-rounded individuals. 
                Our dedicated educators inspire curiosity, creativity, and critical thinking in every learner.
              </p>
              
              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start animate-fade-in">
                <a href="#admissions">
                  <Button size="lg" className="w-full sm:w-auto gap-2 h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                    Apply Now
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </a>
                <a href="#about">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base bg-background/50 backdrop-blur-sm">
                    <Play className="h-4 w-4" />
                    Learn More
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Side - Features Card (Large screens only) */}
            <div className="hidden lg:block animate-fade-in">
              <div className="bg-card/60 backdrop-blur-xl rounded-3xl border border-border/50 p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-foreground mb-6 text-center">Why Choose Us?</h3>
                
                <div className="space-y-4">
                  {[
                    { icon: Shield, title: "Safe Environment", desc: "Secure campus with caring staff" },
                    { icon: Zap, title: "Modern Learning", desc: "Technology-enhanced classrooms" },
                    { icon: Award, title: "Quality Education", desc: "Experienced and dedicated teachers" },
                    { icon: Heart, title: "Holistic Development", desc: "Academic, social & emotional growth" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
          <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center">
            <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full mt-2 animate-pulse" />
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
