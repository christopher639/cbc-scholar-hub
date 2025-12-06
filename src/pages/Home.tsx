import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { supabase } from "@/integrations/supabase/client";
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
  UserPlus,
  Calendar,
  Clock,
  Star,
  Heart,
  Target,
  Lightbulb,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const { schoolInfo, loading } = useSchoolInfo();
  const [stats, setStats] = useState({ learners: 0 });
  const [grades, setGrades] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {schoolInfo?.logo_url ? (
                <img
                  src={schoolInfo.logo_url}
                  alt="School Logo"
                  className="h-12 w-12 md:h-14 md:w-14 object-contain rounded-xl shadow-sm"
                />
              ) : (
                <div className="h-12 w-12 md:h-14 md:w-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <GraduationCap className="h-7 w-7 md:h-8 md:w-8 text-primary-foreground" />
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-bold text-foreground leading-tight tracking-tight">
                  {schoolInfo?.school_name || "SAGME School"}
                </h1>
                {schoolInfo?.motto && (
                  <p className="text-xs text-muted-foreground italic">{schoolInfo.motto}</p>
                )}
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            {/* Login Button */}
            <div className="flex items-center gap-2">
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="hidden md:flex gap-2 shadow-lg shadow-primary/20">
                  <UserPlus className="h-4 w-4" />
                  Portal Access
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
          <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl">
            <nav className="flex flex-col py-4 px-4 gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="py-3 px-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <Link
                to="/auth"
                className="py-3 px-4 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn className="h-4 w-4" />
                Login to Portal
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="relative pt-28 md:pt-36 pb-20 md:pb-32 overflow-hidden"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[100px] opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 rounded-full text-primary text-sm font-semibold mb-8 border border-primary/20">
              <Sparkles className="h-4 w-4" />
              Excellence in Education
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight mb-6">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                {schoolInfo?.school_name || "SAGME School"}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              {schoolInfo?.motto || "Nurturing minds, building futures. Join us on a journey of academic excellence and holistic development."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#admissions">
                <Button size="lg" className="w-full sm:w-auto gap-2 h-12 px-8 text-base shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                  Apply Now
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </a>
              <a href="#about">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base">
                  Learn More
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-6 w-6 text-primary" />
                  <span className="text-4xl md:text-5xl font-bold text-foreground">{stats.learners}</span>
                </div>
                <p className="text-muted-foreground font-medium">Learners</p>
              </div>
              
              {grades.length > 0 && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <span className="text-4xl md:text-5xl font-bold text-foreground">{grades.length}</span>
                  </div>
                  <p className="text-muted-foreground font-medium">Grades</p>
                </div>
              )}
            </div>

            {/* Grade Names */}
            {grades.length > 0 && (
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {grades.map((grade, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-muted/50 text-muted-foreground text-sm font-medium rounded-full border border-border/50"
                  >
                    {grade}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">About Us</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-3 mb-4">About Our School</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              We are committed to providing quality education that empowers students to achieve their full potential.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            <Card className="border-0 bg-card/80 backdrop-blur-sm shadow-xl shadow-black/5 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              <CardContent className="p-8 lg:p-10 text-center">
                <div className="h-16 w-16 lg:h-20 lg:w-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Target className="h-8 w-8 lg:h-10 lg:w-10 text-primary" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-4">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {schoolInfo?.mission || "To provide a nurturing environment where every learner can discover their potential and develop into responsible citizens."}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-card/80 backdrop-blur-sm shadow-xl shadow-black/5 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              <CardContent className="p-8 lg:p-10 text-center">
                <div className="h-16 w-16 lg:h-20 lg:w-20 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Lightbulb className="h-8 w-8 lg:h-10 lg:w-10 text-secondary" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-4">Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {schoolInfo?.vision || "To be a center of academic excellence, producing well-rounded individuals who contribute positively to society."}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-card/80 backdrop-blur-sm shadow-xl shadow-black/5 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              <CardContent className="p-8 lg:p-10 text-center">
                <div className="h-16 w-16 lg:h-20 lg:w-20 bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Heart className="h-8 w-8 lg:h-10 lg:w-10 text-accent" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-foreground mb-4">Core Values</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {schoolInfo?.core_values || "Integrity, excellence, respect, and compassion guide everything we do in shaping young minds."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Director Message */}
          {schoolInfo?.director_name && (
            <div className="mt-20 bg-card rounded-3xl p-8 md:p-12 lg:p-16 border-0 shadow-xl shadow-black/5">
              <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-center">
                {schoolInfo.director_photo_url ? (
                  <img
                    src={schoolInfo.director_photo_url}
                    alt={schoolInfo.director_name}
                    className="h-40 w-40 lg:h-48 lg:w-48 rounded-2xl object-cover shadow-lg"
                  />
                ) : (
                  <div className="h-40 w-40 lg:h-48 lg:w-48 bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center">
                    <Users className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                <div className="text-center md:text-left flex-1">
                  <span className="text-primary font-semibold text-sm uppercase tracking-wider">Message from Leadership</span>
                  <h3 className="text-2xl lg:text-3xl font-bold text-foreground mt-2 mb-4">
                    From the Director's Desk
                  </h3>
                  <p className="text-muted-foreground italic text-lg leading-relaxed mb-6">
                    "{schoolInfo.director_message || "Welcome to our school. We are committed to providing the best education for your children."}"
                  </p>
                  <div>
                    <p className="font-bold text-foreground text-lg">{schoolInfo.director_name}</p>
                    {schoolInfo.director_qualification && (
                      <p className="text-muted-foreground">{schoolInfo.director_qualification}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">What We Offer</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-3 mb-4">Our Programs</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Comprehensive educational programs designed to nurture every aspect of student development.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BookOpen, title: "Academic Excellence", desc: "Rigorous curriculum aligned with national standards", color: "primary" },
              { icon: Users, title: "Small Class Sizes", desc: "Personalized attention for every learner", color: "secondary" },
              { icon: Award, title: "Co-curricular Activities", desc: "Sports, arts, and club activities", color: "accent" },
              { icon: GraduationCap, title: "Qualified Staff", desc: "Experienced and dedicated teachers", color: "primary" },
            ].map((program, i) => (
              <Card key={i} className="border-0 bg-card shadow-lg shadow-black/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group overflow-hidden">
                <CardContent className="p-6 lg:p-8">
                  <div className={`h-14 w-14 bg-${program.color}/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <program.icon className={`h-7 w-7 text-${program.color}`} />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">{program.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{program.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Admissions Section */}
      <section id="admissions" className="py-20 md:py-28 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Enroll Now</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-3 mb-6">
                Join Our School Community
              </h2>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                We welcome applications from students who are eager to learn and grow. Our admissions process is designed to be simple and transparent.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Calendar, text: "Admissions open throughout the year" },
                  { icon: Clock, text: "Quick and easy application process" },
                  { icon: Users, text: "Supportive admissions team" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-foreground font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Link to="/auth">
                  <Button size="lg" className="gap-2 h-12 px-8 text-base shadow-xl shadow-primary/25">
                    Start Application
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <Card className="border-0 bg-card shadow-2xl shadow-black/10">
              <CardContent className="p-8 lg:p-10">
                <h3 className="text-2xl font-bold text-foreground mb-8">Application Requirements</h3>
                <ul className="space-y-4">
                  {[
                    "Completed application form",
                    "Birth certificate copy",
                    "Previous school records",
                    "Passport photos (2)",
                    "Parent/Guardian ID copy",
                  ].map((req, i) => (
                    <li key={i} className="flex items-center gap-4 text-muted-foreground">
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <div className="h-2.5 w-2.5 bg-primary rounded-full" />
                      </div>
                      <span className="font-medium">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Get in Touch</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mt-3 mb-4">Contact Us</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Have questions? We'd love to hear from you. Reach out to us through any of the channels below.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            <Card className="border-0 bg-card shadow-lg shadow-black/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-8 lg:p-10 text-center">
                <div className="h-16 w-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">Address</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {schoolInfo?.address || "School Address, City, Country"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-card shadow-lg shadow-black/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-8 lg:p-10 text-center">
                <div className="h-16 w-16 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Phone className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">Phone</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {schoolInfo?.phone || "+254 XXX XXX XXX"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-card shadow-lg shadow-black/5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-8 lg:p-10 text-center">
                <div className="h-16 w-16 bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Mail className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">Email</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {schoolInfo?.email || "info@school.com"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                {schoolInfo?.logo_url ? (
                  <img
                    src={schoolInfo.logo_url}
                    alt="School Logo"
                    className="h-12 w-12 object-contain rounded-xl bg-background p-1"
                  />
                ) : (
                  <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center">
                    <GraduationCap className="h-7 w-7 text-primary-foreground" />
                  </div>
                )}
                <h3 className="text-xl font-bold text-background">
                  {schoolInfo?.school_name || "SAGME School"}
                </h3>
              </div>
              <p className="text-background/70 max-w-sm leading-relaxed">
                {schoolInfo?.motto || "Nurturing minds, building futures."}
              </p>
            </div>
            <div>
              <h4 className="font-bold text-background mb-5">Quick Links</h4>
              <ul className="space-y-3">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-background/70 hover:text-background transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-background mb-5">Portal Access</h4>
              <ul className="space-y-3">
                <li>
                  <Link to="/auth" className="text-background/70 hover:text-background transition-colors">
                    Student Portal
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="text-background/70 hover:text-background transition-colors">
                    Teacher Portal
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="text-background/70 hover:text-background transition-colors">
                    Admin Login
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/20 pt-8 text-center">
            <p className="text-background/60">
              © {new Date().getFullYear()} {schoolInfo?.school_name || "SAGME School"}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
