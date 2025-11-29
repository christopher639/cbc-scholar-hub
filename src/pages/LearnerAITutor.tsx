import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolInfo } from "@/hooks/useSchoolInfo";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function LearnerAITutor() {
  const { user } = useAuth();
  const { schoolInfo } = useSchoolInfo();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [gradeName, setGradeName] = useState<string>("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const learnerData = user?.role === "learner" ? user.data : null;

  // Fetch grade name
  useEffect(() => {
    const fetchGrade = async () => {
      if (learnerData?.current_grade_id) {
        const { data } = await supabase
          .from("grades")
          .select("name")
          .eq("id", learnerData.current_grade_id)
          .maybeSingle();
        if (data) setGradeName(data.name);
      }
    };
    fetchGrade();
  }, [learnerData?.current_grade_id]);

  const learnerInfo = {
    name: learnerData ? `${learnerData.first_name} ${learnerData.last_name}` : "Student",
    grade: gradeName || "their grade",
    school: schoolInfo?.school_name || "School",
  };

  // Initialize with a greeting
  useEffect(() => {
    if (!learnerData || !gradeName) return;
    
    const initializeChat = async () => {
      setIsInitializing(true);
      try {
        const { data, error } = await supabase.functions.invoke("ai-tutor", {
          body: {
            messages: [],
            learnerInfo: {
              ...learnerInfo,
              grade: gradeName,
            },
          },
        });

        if (error) throw error;

        if (data?.message) {
          setMessages([{ role: "assistant", content: data.message }]);
        }
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        setMessages([
          {
            role: "assistant",
            content: `Hello ${learnerInfo.name}! 👋 I'm your AI tutor. I'm here to help you learn and practice. What subject would you like to work on today? We can do Math, English, Science, or anything else you'd like to study!`,
          },
        ]);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeChat();
  }, [learnerData, gradeName]);

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
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-tutor", {
        body: {
          messages: [...messages, { role: "user", content: userMessage }],
          learnerInfo,
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

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Starting your AI tutor session...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b">
        <div className="p-2 rounded-full bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">AI Tutor</h1>
          <p className="text-xs text-muted-foreground">
            Ask questions and practice for {gradeName || "your grade"}
          </p>
        </div>
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
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
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
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
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
