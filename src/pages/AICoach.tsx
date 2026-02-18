import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Send, Lock, X, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import ProUpgradeModal from '@/components/ProUpgradeModal';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  "How does the Edge Score work?",
  "What is R-multiple?",
  "How do I improve my discipline score?",
  "How to use the app effectively?",
];

export default function AICoach() {
  const { subscribed } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Welcome to your AI Trade Coach. I'm here to help you understand your performance, improve your trading discipline, and master Smart Money Concepts. Ask me anything about your trades, the app, or trading strategy.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const send = async (text: string) => {
    if (!text.trim()) return;
    if (!subscribed) {
      setUpgradeOpen(true);
      return;
    }

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: { messages: [...messages, userMsg] },
      });
      if (error) throw error;
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (e: any) {
      if (e?.message?.includes('429')) {
        toast.error('Rate limit reached. Please wait a moment.');
      } else if (e?.message?.includes('402')) {
        toast.error('AI credits needed. Contact support.');
      } else {
        toast.error('Coach unavailable. Try again.');
      }
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] px-4 pt-6 pb-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Trade Coach
        </h1>
        <p className="text-sm text-muted-foreground">Institutional-grade performance feedback</p>
      </div>

      {!subscribed && (
        <div className="glass-card p-4 mb-4 border border-chart-4/30 bg-chart-4/5">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-chart-4 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Pro Feature</p>
              <p className="text-xs text-muted-foreground mb-2">Upgrade to Pro to access your AI Trade Coach — unlimited conversation, trade analysis, and personalized coaching.</p>
              <button onClick={() => setUpgradeOpen(true)} className="text-xs bg-chart-4 text-background font-bold px-3 py-1.5 rounded-lg">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick questions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_QUESTIONS.map(q => (
            <button
              key={q}
              onClick={() => send(q)}
              className="text-xs bg-secondary text-foreground px-3 py-1.5 rounded-full border border-border hover:border-primary/50 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 scrollbar-hide">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 mr-2 mt-1">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-card border border-border text-foreground rounded-tl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 mr-2 mt-1">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
          placeholder={subscribed ? "Ask your trade coach..." : "Upgrade to Pro to chat..."}
          disabled={loading}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none px-2"
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      <ProUpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
