import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Send, Lock, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import ProUpgradeModal from '@/components/ProUpgradeModal';
import MarketAnalysisTab from '@/components/coach/MarketAnalysisTab';
import StrategySelector, { type Strategy } from '@/components/coach/StrategySelector';
import ChatImageUpload from '@/components/coach/ChatImageUpload';

interface Message {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  displayContent?: string;
  imageUrl?: string;
}

const QUICK_QUESTIONS = [
  "How does the Edge Score work?",
  "What is R-multiple?",
  "How do I improve my discipline score?",
  "How do I use the app effectively?",
];

const EDUCATION_QUESTIONS = [
  "Explain Order Blocks",
  "What is a Fair Value Gap?",
  "How do I trade BOS and CHoCH?",
  "Explain liquidity sweeps",
  "How do I read Premium and Discount zones?",
  "Teach me about Boom & Crash indices",
  "How do I trade V75 safely?",
];

const STRATEGY_LABELS: Record<string, string> = {
  smc: 'Smart Money Concepts (SMC)',
  trendline: 'Trendline (Break & Retest)',
  snr: 'Support & Resistance',
};

function getMessageText(content: Message['content']): string {
  if (typeof content === 'string') return content;
  return content.filter(c => c.type === 'text').map(c => c.text).join('');
}

export default function AICoach() {
  const { subscribed } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Welcome to your AI Trade Coach. I'm here to help you understand your performance, improve your trading discipline, and master trading strategies.\n\n📊 **New:** Upload chart screenshots for visual analysis, and select a strategy (SMC, Trendline, or S&R) for tailored feedback.\n\nAsk me anything about your trades, the app, or trading strategy.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'analysis'>('chat');
  const [strategy, setStrategy] = useState<Strategy>(null);
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const [attachedBase64, setAttachedBase64] = useState<string | null>(null);

  const send = async (text: string) => {
    if (!text.trim() && !attachedBase64) return;
    if (!subscribed) {
      setUpgradeOpen(true);
      return;
    }

    // Build strategy prefix if selected
    let finalText = text.trim();
    if (strategy) {
      finalText = `[Strategy: ${STRATEGY_LABELS[strategy]}]\n\n${finalText}`;
    }

    // Build message content (multimodal if image attached)
    let userContent: Message['content'];
    const currentImageUrl = attachedImageUrl;

    if (attachedBase64) {
      userContent = [
        { type: 'text', text: finalText || 'Analyze this chart' },
        { type: 'image_url', image_url: { url: attachedBase64 } },
      ];
    } else {
      userContent = finalText;
    }

    const userMsg: Message = {
      role: 'user',
      content: userContent,
      displayContent: text.trim() || 'Analyze this chart',
      imageUrl: currentImageUrl || undefined,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachedImageUrl(null);
    setAttachedBase64(null);
    setLoading(true);

    try {
      // Build API messages - only send content (not display fields)
      const apiMessages = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: { messages: apiMessages },
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
        <p className="text-sm text-muted-foreground">Multi-strategy chart analysis & trade coaching</p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'chat'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bot className="h-4 w-4" />
          Coach
        </button>
        <button
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'analysis'
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Market Analysis
        </button>
      </div>

      {activeTab === 'analysis' ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          <MarketAnalysisTab />
        </div>
      ) : (
        <>
          {!subscribed && (
            <div className="glass-card p-4 mb-4 border border-chart-4/30 bg-chart-4/5">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-chart-4 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Pro Feature</p>
                  <p className="text-xs text-muted-foreground mb-2">Upgrade to Pro to access your AI Trade Coach — unlimited conversation, chart analysis, trade setups, and personalized coaching.</p>
                  <button onClick={() => setUpgradeOpen(true)} className="text-xs bg-chart-4 text-background font-bold px-3 py-1.5 rounded-lg">
                    Upgrade to Pro
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Strategy Selector */}
          <div className="mb-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">Strategy</p>
            <StrategySelector selected={strategy} onSelect={setStrategy} />
          </div>

          {/* Quick questions — existing + education chips */}
          {messages.length <= 1 && (
            <div className="space-y-2 mb-4">
              <div className="flex flex-wrap gap-2">
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
              <div className="flex flex-wrap gap-2">
                {EDUCATION_QUESTIONS.map(q => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/30 hover:bg-primary/20 transition-colors"
                  >
                    📚 {q}
                  </button>
                ))}
              </div>
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
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Chart" className="rounded-lg mb-2 max-h-40 object-cover" />
                  )}
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm prose-invert max-w-none leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown>{getMessageText(msg.content)}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {msg.displayContent || getMessageText(msg.content)}
                    </p>
                  )}
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

          {/* Input area */}
          <div className="space-y-2">
            <ChatImageUpload
              imageUrl={attachedImageUrl}
              onImageChange={(url, base64) => {
                setAttachedImageUrl(url);
                setAttachedBase64(base64);
              }}
              disabled={loading}
            />
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
                placeholder={subscribed ? "Ask your trade coach or attach a chart..." : "Upgrade to Pro to chat..."}
                disabled={loading}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none px-2"
              />
              <button
                onClick={() => send(input)}
                disabled={(!input.trim() && !attachedBase64) || loading}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}

      <ProUpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
