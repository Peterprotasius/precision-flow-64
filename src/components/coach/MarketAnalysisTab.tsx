import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Bot, Send, TrendingUp, Lock } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_INSTRUMENTS = [
  { label: '🥇 Gold', instrument: 'XAU/USD (Gold)' },
  { label: '💵 USDT', instrument: 'BTC/USDT and general USDT market sentiment' },
  { label: '📊 V75', instrument: 'Volatility 75 Index (V75)' },
  { label: '💥 Boom 1000', instrument: 'Boom 1000 Index' },
  { label: '💔 Crash 500', instrument: 'Crash 500 Index' },
  { label: '📈 US30', instrument: 'US30 (Dow Jones)' },
  { label: '🖥 NAS100', instrument: 'NAS100 (Nasdaq)' },
  { label: '⚡ V25', instrument: 'Volatility 25 Index (V25)' },
  { label: '🔁 Step Index', instrument: 'Step Index' },
];

const ALL_INSTRUMENTS = [
  ...QUICK_INSTRUMENTS,
  { label: 'XAG/USD', instrument: 'XAG/USD (Silver)' },
  { label: 'EUR/USD', instrument: 'EUR/USD' },
  { label: 'GBP/USD', instrument: 'GBP/USD' },
  { label: 'USD/JPY', instrument: 'USD/JPY' },
  { label: 'AUD/USD', instrument: 'AUD/USD' },
  { label: 'USD/CAD', instrument: 'USD/CAD' },
  { label: 'NZD/USD', instrument: 'NZD/USD' },
  { label: 'ETH/USDT', instrument: 'ETH/USDT' },
  { label: 'BNB/USDT', instrument: 'BNB/USDT' },
  { label: 'SOL/USDT', instrument: 'SOL/USDT' },
  { label: 'V50', instrument: 'Volatility 50 Index (V50)' },
  { label: 'V100', instrument: 'Volatility 100 Index (V100)' },
  { label: 'Boom 500', instrument: 'Boom 500 Index' },
  { label: 'Crash 1000', instrument: 'Crash 1000 Index' },
  { label: 'Jump 10', instrument: 'Jump 10 Index' },
  { label: 'Jump 25', instrument: 'Jump 25 Index' },
  { label: 'Jump 50', instrument: 'Jump 50 Index' },
  { label: 'Jump 75', instrument: 'Jump 75 Index' },
  { label: 'Jump 100', instrument: 'Jump 100 Index' },
  { label: 'SPX500', instrument: 'SPX500 (S&P 500)' },
  { label: 'UK100', instrument: 'UK100 (FTSE)' },
  { label: 'GER40', instrument: 'GER40 (DAX)' },
];

export default function MarketAnalysisTab() {
  const { subscribed } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const analyzeInstrument = async (instrument: string) => {
    if (!subscribed) {
      toast.error('Market Analysis is a Pro feature. Upgrade to access.');
      return;
    }
    const text = `Analyze ${instrument} using the structured market analysis format. Include current bias, direction, SMC analysis, trade setup if valid, risk reminder and SMC tip.`;
    await send(text);
  };

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    if (!subscribed) {
      toast.error('Market Analysis is a Pro feature.');
      return;
    }

    const userMsg: Message = { role: 'user', content: text };
    const allMsgs = [...messages, userMsg];
    setMessages(allMsgs);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-market-analysis', {
        body: { messages: allMsgs },
      });
      
      if (error) {
        console.error('Market analysis error:', error);
        throw error;
      }
      
      if (!data?.content) {
        throw new Error('No content in response');
      }

      const assistantMsg: Message = { role: 'assistant', content: data.content };
      setMessages(prev => [...prev, assistantMsg]);

      // Log analysis (fire and forget)
      supabase.auth.getUser().then(({ data: userData }) => {
        if (userData?.user?.id) {
          supabase.from('market_analysis_log').insert({
            user_id: userData.user.id,
            instrument: text,
            analysis_text: data.content,
            bias: '',
            direction: '',
          }).then(() => {});
        }
      });
    } catch (e: any) {
      console.error('Market analysis catch:', e);
      if (e?.message?.includes('429')) {
        toast.error('Rate limit reached. Please wait a moment.');
      } else {
        toast.error('Analysis unavailable. Try again.');
      }
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const instrumentList = showAll ? ALL_INSTRUMENTS : QUICK_INSTRUMENTS;

  return (
    <div className="flex flex-col h-full">
      {!subscribed && (
        <div className="glass-card p-4 mb-4 border border-chart-4/30 bg-chart-4/5">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-chart-4 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground">Pro Feature</p>
              <p className="text-xs text-muted-foreground mb-2">Market Analysis requires a Pro subscription.</p>
            </div>
          </div>
        </div>
      )}

      {/* Instrument buttons */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {instrumentList.map(i => (
            <button
              key={i.label}
              onClick={() => analyzeInstrument(i.instrument)}
              className="text-xs bg-secondary text-foreground px-3 py-1.5 rounded-full border border-border hover:border-primary/50 transition-colors min-h-[36px]"
            >
              {i.label}
            </button>
          ))}
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/30 hover:bg-primary/20 transition-colors min-h-[36px]"
          >
            {showAll ? 'Show Less' : 'More...'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <TrendingUp className="h-10 w-10 text-primary/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Select an instrument above or type your analysis request below</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 mr-2 mt-1">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-card border border-border text-foreground rounded-tl-sm'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed prose prose-sm prose-invert max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 mr-2 mt-1">
              <TrendingUp className="h-4 w-4 text-primary" />
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
          placeholder={subscribed ? "Ask about any instrument..." : "Upgrade to Pro for market analysis..."}
          disabled={loading || !subscribed}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none px-2"
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading || !subscribed}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 transition-opacity"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
