import { useState, useEffect, useRef } from "react";
import { Search, Loader2, User, Users, FileText, Navigation, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAdminSearch, SearchResult } from "@/hooks/useAdminSearch";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export const AdminSearchBar = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { results, loading, search } = useAdminSearch();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    if (result.route) {
      navigate(result.route);
      setQuery("");
      setIsOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "learner":
        return <User className="h-4 w-4 text-primary" />;
      case "teacher":
        return <Users className="h-4 w-4 text-secondary" />;
      case "invoice":
        return <FileText className="h-4 w-4 text-success" />;
      case "route":
        return <Navigation className="h-4 w-4 text-muted-foreground" />;
      case "staff":
        return <Briefcase className="h-4 w-4 text-warning" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search learners, teachers, invoices, pages..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-9 pr-9 bg-background"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-background border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className={cn(
                    "w-full px-4 py-3 flex items-start gap-3 hover:bg-muted transition-colors text-left",
                    "border-b border-border last:border-0"
                  )}
                >
                  <div className="mt-1">{getIcon(result.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {result.title}
                    </p>
                    {result.subtitle && (
                      <p className="text-sm text-muted-foreground truncate">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize mt-1">
                    {result.type}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
