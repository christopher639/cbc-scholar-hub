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
} from "lucide-react";

export default function Home() {
  const { schoolInfo, loading } = useSchoolInfo();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    { name: "Programs", href: "#programs" },
    { name: "Testimonials", href: "#testimonials" },
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
            src={heroSchoolBg} 
            alt="School Campus" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background" />
        </div>
        
        <div className="relative w-full pt-24 pb-16 md:pt-32 md:pb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {schoolInfo?.school_name || "SAGME School"}
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl md:text-2xl text-foreground/80 mb-6 font-medium">
                {schoolInfo?.motto || "Nurturing minds, building futures"}
              </p>

              <p className="text-base text-muted-foreground mb-8 max-w-2xl leading-relaxed">
                A center of excellence committed to nurturing young minds through innovative teaching and a supportive learning environment.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a href="#contact">
                  <Button size="lg" className="w-full sm:w-auto gap-2 h-12 px-8">
                    Get in Touch
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </a>
                <a href="#about">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 h-12 px-8 bg-background/60 backdrop-blur-sm">
                    <Play className="h-5 w-5" />
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

      {/* About Section */}
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
              Comprehensive educational programs designed to nurture every aspect of student development.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: BookOpen, title: "Academic Excellence", desc: "Rigorous curriculum aligned with national standards" },
              { icon: Shield, title: "Safe Environment", desc: "Secure and nurturing learning atmosphere" },
              { icon: Award, title: "Co-curricular", desc: "Sports, arts, and club activities" },
              { icon: Zap, title: "Modern Learning", desc: "Technology-enhanced education" },
            ].map((program, i) => (
              <Card key={i} className="border bg-card hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <program.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{program.title}</h3>
                  <p className="text-muted-foreground text-sm">{program.desc}</p>
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
              Hear from parents who have entrusted us with their children's education.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <Card key={i} className="border bg-card">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-primary/30 mb-4" />
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
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
          <div className="text-center mb-12">
            <p className="text-primary text-sm font-medium mb-2">Get in Touch</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              Contact Us
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="border bg-card">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Send us a Message</h3>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        required
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        required
                        maxLength={255}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      maxLength={20}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      required
                      maxLength={1000}
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-4">
              {[
                { icon: MapPin, title: "Address", content: schoolInfo?.address || "School Address, City, Country" },
                { icon: Phone, title: "Phone", content: schoolInfo?.phone || "+254 XXX XXX XXX" },
                { icon: Mail, title: "Email", content: schoolInfo?.email || "info@school.com" },
              ].map((item, i) => (
                <Card key={i} className="border bg-card">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">{item.content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Admissions CTA */}
              <Card className="border bg-primary text-primary-foreground">
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold mb-2">Ready to Enroll?</h3>
                  <p className="text-primary-foreground/80 text-sm mb-4">
                    Join our school community. Admissions open throughout the year.
                  </p>
                  <div className="space-y-2 mb-4">
                    {[
                      "Completed application form",
                      "Birth certificate copy",
                      "Previous school records",
                    ].map((req, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                  <Link to="/auth">
                    <Button variant="secondary" className="w-full gap-2">
                      Start Application
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                {schoolInfo?.logo_url ? (
                  <img
                    src={schoolInfo.logo_url}
                    alt="School Logo"
                    className="h-10 w-10 object-contain rounded-xl bg-background/10 p-1"
                  />
                ) : (
                  <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
                <h3 className="text-lg font-bold">
                  {schoolInfo?.school_name || "SAGME School"}
                </h3>
              </div>
              <p className="text-background/70 max-w-sm text-sm leading-relaxed">
                {schoolInfo?.motto || "Nurturing minds, building futures."}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">Quick Links</h4>
              <ul className="space-y-2">
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
              <h4 className="font-bold mb-4 text-sm">Portal Access</h4>
              <ul className="space-y-2">
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
          <div className="border-t border-background/20 pt-6 text-center">
            <p className="text-background/60 text-xs">
              © {new Date().getFullYear()} {schoolInfo?.school_name || "SAGME School"}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
