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
} from "lucide-react";

export default function SagmeHome() {
  const { schoolInfo, loading } = useSchoolInfo();
  const [stats, setStats] = useState({ learners: 0, teachers: 0, grades: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      const [learnersRes, teachersRes, gradesRes] = await Promise.all([
        supabase.from("learners").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("teachers").select("id", { count: "exact", head: true }),
        supabase.from("grades").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        learners: learnersRes.count || 0,
        teachers: teachersRes.count || 0,
        grades: gradesRes.count || 0,
      });
    };
    fetchStats();
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {schoolInfo?.logo_url ? (
                <img
                  src={schoolInfo.logo_url}
                  alt="School Logo"
                  className="h-10 w-10 md:h-12 md:w-12 object-contain rounded-lg"
                />
              ) : (
                <div className="h-10 w-10 md:h-12 md:w-12 bg-primary rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 md:h-7 md:w-7 text-primary-foreground" />
                </div>
              )}
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-bold text-foreground leading-tight">
                  {schoolInfo?.school_name || "SAGME School"}
                </h1>
                {schoolInfo?.motto && (
                  <p className="text-xs text-muted-foreground italic">{schoolInfo.motto}</p>
                )}
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            {/* Login Button */}
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="hidden md:flex gap-2">
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
          <div className="lg:hidden border-t border-border bg-background">
            <nav className="flex flex-col py-4 px-4 gap-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="py-2 px-4 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <Link
                to="/auth"
                className="py-2 px-4 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login to Portal
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section
        id="home"
        className="relative pt-24 md:pt-32 pb-16 md:pb-24 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5" />
        <div className="absolute top-20 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
                <Star className="h-4 w-4" />
                Excellence in Education
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                Welcome to{" "}
                <span className="text-primary">
                  {schoolInfo?.school_name || "SAGME School"}
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                {schoolInfo?.motto || "Nurturing minds, building futures. Join us on a journey of academic excellence and holistic development."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a href="#admissions">
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    Apply Now
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </a>
                <a href="#about">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Learn More
                  </Button>
                </a>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">{stats.learners}+</div>
                  <div className="text-sm text-muted-foreground">Active Learners</div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="h-12 w-12 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">{stats.teachers}+</div>
                  <div className="text-sm text-muted-foreground">Expert Teachers</div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="h-12 w-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-6 w-6 text-accent" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">{stats.grades}</div>
                  <div className="text-sm text-muted-foreground">Grade Levels</div>
                </CardContent>
              </Card>
              <Card className="bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="h-12 w-12 bg-destructive/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Award className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">100%</div>
                  <div className="text-sm text-muted-foreground">Commitment</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 md:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">About Our School</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We are committed to providing quality education that empowers students to achieve their full potential.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border/50 hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Our Mission</h3>
                <p className="text-muted-foreground">
                  To provide a nurturing environment where every learner can discover their potential and develop into responsible citizens.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50 hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Lightbulb className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Our Vision</h3>
                <p className="text-muted-foreground">
                  To be a center of academic excellence, producing well-rounded individuals who contribute positively to society.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50 hover:shadow-lg transition-all hover:-translate-y-1">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">Our Values</h3>
                <p className="text-muted-foreground">
                  Integrity, excellence, respect, and compassion guide everything we do in shaping young minds.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Director Message */}
          {schoolInfo?.director_name && (
            <div className="mt-16 bg-card rounded-2xl p-8 md:p-12 border border-border/50">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                {schoolInfo.director_photo_url ? (
                  <img
                    src={schoolInfo.director_photo_url}
                    alt={schoolInfo.director_name}
                    className="h-32 w-32 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="h-32 w-32 bg-muted rounded-2xl flex items-center justify-center">
                    <Users className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="text-center md:text-left flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Message from the Director
                  </h3>
                  <p className="text-muted-foreground italic mb-4">
                    "{schoolInfo.director_message || "Welcome to our school. We are committed to providing the best education for your children."}"
                  </p>
                  <div>
                    <p className="font-semibold text-foreground">{schoolInfo.director_name}</p>
                    {schoolInfo.director_qualification && (
                      <p className="text-sm text-muted-foreground">{schoolInfo.director_qualification}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Programs</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive educational programs designed to nurture every aspect of student development.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BookOpen, title: "Academic Excellence", desc: "Rigorous curriculum aligned with national standards" },
              { icon: Users, title: "Small Class Sizes", desc: "Personalized attention for every learner" },
              { icon: Award, title: "Co-curricular Activities", desc: "Sports, arts, and club activities" },
              { icon: GraduationCap, title: "Qualified Staff", desc: "Experienced and dedicated teachers" },
            ].map((program, i) => (
              <Card key={i} className="border-border/50 hover:shadow-lg transition-all hover:-translate-y-1 group">
                <CardContent className="p-6">
                  <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <program.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{program.title}</h3>
                  <p className="text-sm text-muted-foreground">{program.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Admissions Section */}
      <section id="admissions" className="py-16 md:py-24 bg-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Join Our School Community
              </h2>
              <p className="text-muted-foreground mb-8">
                We welcome applications from students who are eager to learn and grow. Our admissions process is designed to be simple and transparent.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Calendar, text: "Admissions open throughout the year" },
                  { icon: Clock, text: "Quick and easy application process" },
                  { icon: Users, text: "Supportive admissions team" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link to="/auth">
                  <Button size="lg" className="gap-2">
                    Start Application
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <Card className="border-border/50">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-foreground mb-6">Application Requirements</h3>
                <ul className="space-y-3">
                  {[
                    "Completed application form",
                    "Birth certificate copy",
                    "Previous school records",
                    "Passport photos (2)",
                    "Parent/Guardian ID copy",
                  ].map((req, i) => (
                    <li key={i} className="flex items-center gap-3 text-muted-foreground">
                      <div className="h-2 w-2 bg-primary rounded-full" />
                      {req}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Contact Us</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Have questions? We'd love to hear from you. Reach out to us through any of the channels below.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border/50 hover:shadow-lg transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Address</h3>
                <p className="text-muted-foreground text-sm">
                  {schoolInfo?.address || "School Address, City, Country"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50 hover:shadow-lg transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="h-14 w-14 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-7 w-7 text-secondary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Phone</h3>
                <p className="text-muted-foreground text-sm">
                  {schoolInfo?.phone || "+254 XXX XXX XXX"}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50 hover:shadow-lg transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="h-14 w-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-7 w-7 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Email</h3>
                <p className="text-muted-foreground text-sm">
                  {schoolInfo?.email || "info@school.com"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                {schoolInfo?.logo_url ? (
                  <img
                    src={schoolInfo.logo_url}
                    alt="School Logo"
                    className="h-10 w-10 object-contain rounded-lg bg-background p-1"
                  />
                ) : (
                  <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-primary-foreground" />
                  </div>
                )}
                <h3 className="text-lg font-bold text-background">
                  {schoolInfo?.school_name || "SAGME School"}
                </h3>
              </div>
              <p className="text-background/70 text-sm max-w-sm">
                {schoolInfo?.motto || "Nurturing minds, building futures."}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-background mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-background/70 hover:text-background text-sm transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-background mb-4">Portal Access</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/auth" className="text-background/70 hover:text-background text-sm transition-colors">
                    Student Portal
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="text-background/70 hover:text-background text-sm transition-colors">
                    Teacher Portal
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="text-background/70 hover:text-background text-sm transition-colors">
                    Admin Login
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/20 pt-8 text-center">
            <p className="text-background/60 text-sm">
              © {new Date().getFullYear()} {schoolInfo?.school_name || "SAGME School"}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
