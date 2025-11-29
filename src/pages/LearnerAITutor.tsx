import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User, Sparkles, BookOpen, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface LearningArea {
  id: string;
  name: string;
  code: string;
}

export default function LearnerAITutor() {
  const { user } = useAuth();
  const { schoolInfo } = useSchoolInfo();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [gradeName, setGradeName] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<LearningArea | null>(null);
  const [learningAreas, setLearningAreas] = useState<LearningArea[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const learnerData = user?.role === "learner" ? user.data : null;

  // Fetch grade name and learning areas from performance records
  useEffect(() => {
    const fetchData = async () => {
      if (!learnerData?.id) return;
      
      setIsLoadingAreas(true);
      
      // Fetch grade name
      if (learnerData.current_grade_id) {
        const { data: gradeData } = await supabase
          .from("grades")
          .select("name")
          .eq("id", learnerData.current_grade_id)
          .maybeSingle();
        if (gradeData) setGradeName(gradeData.name);
      }
      
      // Fetch unique learning areas from learner's performance records
      const { data: performanceData } = await supabase
        .from("performance_records")
        .select("learning_area_id, learning_areas(id, name, code)")
        .eq("learner_id", learnerData.id);
      
      if (performanceData) {
        const uniqueAreas = new Map<string, LearningArea>();
        performanceData.forEach((record: any) => {
          if (record.learning_areas && !uniqueAreas.has(record.learning_areas.id)) {
            uniqueAreas.set(record.learning_areas.id, {
              id: record.learning_areas.id,
              name: record.learning_areas.name,
              code: record.learning_areas.code,
            });
          }
        });
        setLearningAreas(Array.from(uniqueAreas.values()));
      }
      
      setIsLoadingAreas(false);
    };
    fetchData();
  }, [learnerData?.id, learnerData?.current_grade_id]);

  const learnerInfo = {
    name: learnerData ? `${learnerData.first_name} ${learnerData.last_name}` : "Student",
    grade: gradeName || "their grade",
    school: schoolInfo?.school_name || "School",
  };

  // Initialize chat when subject is selected
  const startSession = async (area: LearningArea) => {
    setSelectedSubject(area);
    setMessages([]);
    setIsInitializing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("ai-tutor", {
        body: {
          messages: [],
          learnerInfo,
          subject: area.name.toLowerCase(),
        },
      });

      if (error) throw error;

      if (data?.message) {
        setMessages([{ role: "assistant", content: data.message }]);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Failed to initialize chat:", error);
      setMessages([
        {
          role: "assistant",
          content: `Hi ${learnerInfo.name}! 👋 Ready to practice ${area.name}? What topic shall we start with? 🎯`,
        },
      ]);
    } finally {
      setIsInitializing(false);
      inputRef.current?.focus();
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !selectedSubject) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-tutor", {
        body: {
          messages: [...messages, { role: "user", content: userMessage }],
          learnerInfo,
          subject: selectedSubject?.name.toLowerCase() || "general",
        },
      });

      if (error) throw error;

      if (data?.message) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to get response. Please try again.");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetSession = () => {
    setSelectedSubject(null);
    setMessages([]);
  };

  // Subject selection screen
  if (!selectedSubject) {
    if (isLoadingAreas) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your subjects...</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="text-center">
          <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">AI Tutor</h1>
          <p className="text-muted-foreground">
            Choose a subject to practice, {learnerInfo.name}!
          </p>
        </div>

        {learningAreas.length === 0 ? (
          <div className="text-center p-4">
            <p className="text-muted-foreground">No subjects found yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Your subjects will appear here once you have performance records.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-md">
            {learningAreas.map((area, index) => {
              const colors = [
                "bg-blue-500/10 text-blue-600",
                "bg-amber-500/10 text-amber-600",
                "bg-green-500/10 text-green-600",
                "bg-purple-500/10 text-purple-600",
                "bg-pink-500/10 text-pink-600",
                "bg-cyan-500/10 text-cyan-600",
              ];
              const color = colors[index % colors.length];
              
              return (
                <Button
                  key={area.id}
                  variant="outline"
                  className={`h-auto py-4 flex flex-col gap-2 hover:scale-105 transition-transform ${color}`}
                  onClick={() => startSession(area)}
                >
                  <div className={`p-2 rounded-full ${color}`}>
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{area.name}</span>
                  <span className="text-xs opacity-70">{area.code}</span>
                </Button>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center max-w-sm">
          Practice the subjects you've been learning in {gradeName || "your grade"}
        </p>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Starting your {selectedSubject?.name} session...</p>
      </div>
    );
  }

  const subjectColors = [
    "bg-blue-500/10 text-blue-600",
    "bg-amber-500/10 text-amber-600",
    "bg-green-500/10 text-green-600",
    "bg-purple-500/10 text-purple-600",
  ];
  const currentColor = subjectColors[learningAreas.findIndex(a => a.id === selectedSubject?.id) % subjectColors.length] || "bg-primary/10 text-primary";

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${currentColor}`}>
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">{selectedSubject?.name} Tutor</h1>
            <p className="text-xs text-muted-foreground">
              Practicing for {gradeName || "your grade"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={resetSession} className="text-muted-foreground">
          <RotateCcw className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Change Subject</span>
        </Button>
      </div>

      {/* Chat Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4">
        <div className="space-y-4 pb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
            {message.role === "assistant" && (
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${currentColor} flex items-center justify-center`}>
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <Card
                className={`max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <CardContent className="p-3">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </CardContent>
              </Card>
              {message.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full ${currentColor} flex items-center justify-center`}>
                <Bot className="h-4 w-4" />
              </div>
              <Card className="bg-muted">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="pt-4 border-t mt-auto">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your answer or ask a question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI responses are generated. Always verify important information with your teachers.
        </p>
      </div>
    </div>
  );
}
