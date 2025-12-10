import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Heart, User, Loader2, GraduationCap } from "lucide-react";

interface Blog {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  likes_count: number;
  created_at: string;
}

const getVisitorId = (): string => {
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
};

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { schoolInfo } = useSchoolInfo();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likingBlog, setLikingBlog] = useState(false);

  useEffect(() => {
    const fetchBlog = async () => {
      if (!id) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from("blogs")
        .select("id, title, description, image_url, likes_count, created_at")
        .eq("id", id)
        .eq("is_published", true)
        .single();

      if (error || !data) {
        navigate("/", { replace: true });
        return;
      }

      setBlog(data);
      setLoading(false);

      // Check if user has liked this blog
      const storedLikes = localStorage.getItem('liked_blogs');
      if (storedLikes) {
        const likedBlogs = new Set(JSON.parse(storedLikes));
        setLiked(likedBlogs.has(id));
      }
    };

    fetchBlog();
  }, [id, navigate]);

  const handleLike = async () => {
    if (!blog) return;
    
    const visitorId = getVisitorId();
    setLikingBlog(true);

    try {
      if (liked) {
        await supabase
          .from("blog_likes")
          .delete()
          .eq("blog_id", blog.id)
          .eq("visitor_id", visitorId);

        const storedLikes = localStorage.getItem('liked_blogs');
        const likedBlogs = storedLikes ? new Set(JSON.parse(storedLikes)) : new Set();
        likedBlogs.delete(blog.id);
        localStorage.setItem('liked_blogs', JSON.stringify([...likedBlogs]));

        setBlog({ ...blog, likes_count: Math.max(0, blog.likes_count - 1) });
        setLiked(false);
      } else {
        await supabase.from("blog_likes").insert({
          blog_id: blog.id,
          visitor_id: visitorId,
        });

        const storedLikes = localStorage.getItem('liked_blogs');
        const likedBlogs = storedLikes ? new Set(JSON.parse(storedLikes)) : new Set();
        likedBlogs.add(blog.id);
        localStorage.setItem('liked_blogs', JSON.stringify([...likedBlogs]));

        setBlog({ ...blog, likes_count: blog.likes_count + 1 });
        setLiked(true);
      }
    } catch (error) {
      console.error("Error updating like:", error);
    } finally {
      setLikingBlog(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!blog) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              {schoolInfo?.logo_url ? (
                <img src={schoolInfo.logo_url} alt="Logo" className="h-8 w-8 object-contain rounded" />
              ) : (
                <div className="h-8 w-8 bg-primary/10 rounded flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
              )}
              <span className="font-bold text-foreground">{schoolInfo?.school_name || "School"}</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article>
          {blog.image_url && (
            <div className="aspect-video bg-muted rounded-xl overflow-hidden mb-8">
              <img
                src={blog.image_url}
                alt={blog.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(blog.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <button
              onClick={handleLike}
              disabled={likingBlog}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                liked
                  ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-muted hover:bg-red-100 hover:text-red-600"
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              {blog.likes_count} likes
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
            {blog.title}
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {blog.description}
            </p>
          </div>
        </article>

        {/* Back Button */}
        <div className="mt-12 pt-8 border-t border-border">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </main>

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
              <span className="font-bold text-foreground">{schoolInfo?.school_name || "School"}</span>
            </div>
            <p className="text-muted-foreground text-sm text-center">
              © {new Date().getFullYear()} {schoolInfo?.school_name || "School"}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
