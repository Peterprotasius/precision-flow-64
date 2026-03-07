import { useMemo, useState } from 'react';
import { useTrades } from '@/hooks/useTrades';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calcPsychStats, calcDisciplineScore } from '@/lib/analytics';
import { Brain, AlertTriangle, TrendingUp, TrendingDown, Zap, Lock, Shield, Activity, Heart, Target, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import ProUpgradeModal from '@/components/ProUpgradeModal';
import { toast } from 'sonner';

function LockedOverlay({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/70 backdrop-blur-sm z-10">
      <Lock className="h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm font-semibold text-foreground mb-1">Pro Feature</p>
      <button onClick={onUpgrade} className="bg-chart-4 text-background text-xs font-bold px-4 py-2 rounded-lg">Upgrade to Pro</button>
    </div>
  );
}

interface Checkin {
  id: string;
  checkin_type: string;
  emotional_state: string;
  energy_level: number;
  sleep_quality: number;
  confidence_rating: number;
  htf_bias: string | null;
  market_conditions: string | null;
  notes: string | null;
  created_at: string;
}

const EMOTIONS = ['Calm', 'Confident', 'Focused', 'Anxious', 'Fearful', 'FOMO', 'Revenge', 'Tired', 'Neutral'];
const MARKET_CONDITIONS = ['Trending', 'Ranging', 'Volatile', 'Low Volume', 'News Day'];

function BehavioralPillar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  const color = score >= 75 ? 'text-success' : score >= 50 ? 'text-chart-4' : 'text-loss';
  const bg = score >= 75 ? 'bg-success' : score >= 50 ? 'bg-chart-4' : 'bg-loss';
  return (
    <div className="glass-card p-3 text-center">
      <div className={`mx-auto mb-1 ${color}`}>{icon}</div>
      <p className={`text-xl font-bold ${color}`}>{score}</p>
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <div className="h-1 bg-secondary rounded-full mt-2">
        <div className={`h-1 rounded-full ${bg}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function Psychology() {
  const { data: trades = [], isLoading } = useTrades();
  const { user, subscribed } = useAuth();
  const queryClient = useQueryClient();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'checkin' | 'behavioral'>('overview');

  // Checkin form state
  const [emotionalState, setEmotionalState] = useState('Calm');
  const [energyLevel, setEnergyLevel] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(7);
  const [confidenceRating, setConfidenceRating] = useState(7);
  const [marketConditions, setMarketConditions] = useState('Trending');
  const [checkinNotes, setCheckinNotes] = useState('');

  const psych = useMemo(() => calcPsychStats(trades), [trades]);

  const { data: checkins = [] } = useQuery({
    queryKey: ['psychology-checkins', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('psychology_checkins')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as Checkin[];
    },
    enabled: !!user,
  });

  const addCheckin = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('psychology_checkins').insert({
        user_id: user!.id,
        checkin_type: 'pre_session',
        emotional_state: emotionalState,
        energy_level: energyLevel,
        sleep_quality: sleepQuality,
        confidence_rating: confidenceRating,
        market_conditions: marketConditions,
        notes: checkinNotes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['psychology-checkins'] });
      setCheckinOpen(false);
      toast.success('Check-in logged!');
    },
    onError: () => toast.error('Failed to save check-in'),
  });

  const emotionRows = Object.entries(psych.emotionWR)
    .map(([emotion, { wins, total }]) => ({
      emotion,
      wr: total > 0 ? Math.round((wins / total) * 100) : 0,
      total,
    }))
    .sort((a, b) => b.wr - a.wr);

  const disciplineHistory = useMemo(() => {
    const closed = trades.filter(t => t.result === 'win' || t.result === 'loss');
    return closed.slice(-10).map((t, i) => ({
      trade: i + 1,
      score: calcDisciplineScore(t, trades),
    }));
  }, [trades]);

  // ── Behavioral Scoring (4 Pillars) ──
  const behavioralScores = useMemo(() => {
    const closed = trades.filter(t => t.result === 'win' || t.result === 'loss');
    if (closed.length === 0) return { discipline: 0, patience: 0, emotionalStability: 0, execution: 0 };

    // Discipline: based on discipline scores
    const discipline = Math.round(closed.reduce((s, t) => s + calcDisciplineScore(t, trades), 0) / closed.length);

    // Patience: penalize low confidence entries and FOMO
    const fomoTrades = closed.filter(t => t.emotionBefore === 'FOMO' || t.emotionBefore === 'Revenge').length;
    const patience = Math.max(0, Math.min(100, 100 - (fomoTrades / closed.length) * 100 - (closed.filter(t => t.confidenceLevel < 5).length / closed.length) * 30));

    // Emotional Stability: variance of confidence levels + negative emotions
    const avgConf = closed.reduce((s, t) => s + t.confidenceLevel, 0) / closed.length;
    const confStd = Math.sqrt(closed.reduce((s, t) => s + Math.pow(t.confidenceLevel - avgConf, 2), 0) / closed.length);
    const negEmotions = closed.filter(t => ['Anxious', 'Fearful', 'Revenge', 'FOMO', 'Greedy'].includes(t.emotionBefore)).length;
    const emotionalStability = Math.max(0, Math.min(100, 100 - confStd * 10 - (negEmotions / closed.length) * 40));

    // Execution: R:R quality + setup completeness
    const goodRR = closed.filter(t => t.rrRatio >= 2).length;
    const fullSetup = closed.filter(t => t.bosPresent && t.liquiditySweep && t.orderBlock).length;
    const execution = Math.min(100, ((goodRR / closed.length) * 50 + (fullSetup / closed.length) * 50) * 1.5);

    return {
      discipline: Math.round(discipline),
      patience: Math.round(patience),
      emotionalStability: Math.round(emotionalStability),
      execution: Math.round(execution),
    };
  }, [trades]);

  // ── Tilt Detection ──
  const tiltDetected = useMemo(() => {
    const closed = trades.filter(t => t.result === 'win' || t.result === 'loss');
    const recent = closed.slice(0, 5);
    if (recent.length < 3) return false;

    const recentLosses = recent.filter(t => t.result === 'loss').length;
    const hasNegEmotion = recent.some(t => ['Revenge', 'Anxious', 'FOMO', 'Fearful'].includes(t.emotionBefore));
    return recentLosses >= 3 && hasNegEmotion;
  }, [trades]);

  // Today's checkin
  const todayCheckin = checkins.find(c => {
    const d = new Date(c.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  if (isLoading) return <div className="px-4 pt-6"><p className="text-muted-foreground">Loading...</p></div>;

  return (
    <div className="px-4 pt-6 pb-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Psychology</h1>
          <p className="text-sm text-muted-foreground">Mental performance & behavioral scoring</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setCheckinOpen(true)}>
          <Brain className="h-4 w-4 mr-1" /> Check-in
        </Button>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        {[
          { key: 'overview' as const, label: 'Overview' },
          { key: 'behavioral' as const, label: 'Behavioral' },
          { key: 'checkin' as const, label: 'Check-ins' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === key ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tilt Alert */}
      {tiltDetected && (
        <div className="glass-card p-4 border border-loss/40 bg-loss/5 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-loss shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h3 className="text-sm font-semibold text-loss">🚨 Tilt Detected — Step Away</h3>
              <p className="text-xs text-muted-foreground mt-1">
                3+ consecutive losses with negative emotional tags detected. Your edge is compromised.
                Take a 30-minute break before your next trade.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Readiness */}
      {todayCheckin && (
        <div className="glass-card p-4 border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Today's Readiness</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-secondary/30 rounded-lg p-2">
              <p className="text-sm font-bold text-foreground">{todayCheckin.emotional_state}</p>
              <p className="text-[9px] text-muted-foreground">Emotion</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-2">
              <p className="text-sm font-bold text-foreground">{todayCheckin.energy_level}/10</p>
              <p className="text-[9px] text-muted-foreground">Energy</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-2">
              <p className="text-sm font-bold text-foreground">{todayCheckin.confidence_rating}/10</p>
              <p className="text-[9px] text-muted-foreground">Confidence</p>
            </div>
          </div>
        </div>
      )}

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Overview metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-3 text-center">
              <p className="stat-label mb-1">Avg Discipline</p>
              <p className={`text-2xl font-bold ${psych.avgDiscipline >= 70 ? 'text-success' : psych.avgDiscipline >= 50 ? 'text-chart-4' : 'text-loss'}`}>
                {psych.avgDiscipline}
              </p>
              <p className="text-[10px] text-muted-foreground">/ 100</p>
            </div>
            <div className="glass-card p-3 text-center">
              <p className="stat-label mb-1">High Conf WR</p>
              <p className="text-2xl font-bold text-primary">{psych.wrHighConf}%</p>
              <p className="text-[10px] text-muted-foreground">{psych.highConfCount} trades (conf ≥8)</p>
            </div>
          </div>

          {/* Revenge trading alert */}
          {psych.revengeDetected && (
            <div className="glass-card p-4 border border-loss/40 bg-loss/5 animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-loss shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-loss">⚠️ Revenge Trading Detected</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    You placed 3+ trades within 1 hour after a loss. Take a break and reset.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Post-loss performance */}
          <div className="glass-card p-4 space-y-3">
            <h2 className="stat-label flex items-center gap-2"><Brain className="h-4 w-4" /> Post-Loss Performance</h2>
            <div className="space-y-2">
              {[
                { label: 'Win rate after 1 loss', value: psych.wrAfterLoss, count: psych.afterLossCount },
                { label: 'Win rate after 2 losses', value: psych.wrAfterTwoLosses, count: psych.afterTwoLossCount },
              ].map(({ label, value, count }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className={`text-xs font-bold ${value >= 50 ? 'text-success' : 'text-loss'}`}>{count > 0 ? `${value}%` : '—'}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full">
                      <div className={`h-1.5 rounded-full ${value >= 50 ? 'bg-success' : 'bg-loss'}`} style={{ width: `${count > 0 ? value : 0}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emotion correlation — Pro */}
          <div className="relative">
            <div className={`glass-card p-4 space-y-3 ${!subscribed ? 'blur-sm pointer-events-none select-none' : ''}`}>
              <h2 className="stat-label flex items-center gap-2"><Zap className="h-4 w-4" /> Emotion → Win Rate</h2>
              {emotionRows.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">No emotion data logged</p>
              ) : (
                <div className="space-y-2">
                  {emotionRows.map(({ emotion, wr, total }) => (
                    <div key={emotion} className="flex items-center gap-2">
                      <span className="text-xs text-foreground w-20 shrink-0">{emotion}</span>
                      <div className="flex-1 h-2 bg-secondary rounded-full">
                        <div className={`h-2 rounded-full ${wr >= 60 ? 'bg-success' : wr >= 40 ? 'bg-chart-4' : 'bg-loss'}`} style={{ width: `${wr}%` }} />
                      </div>
                      <span className={`text-xs font-bold w-8 text-right ${wr >= 60 ? 'text-success' : wr >= 40 ? 'text-chart-4' : 'text-loss'}`}>{wr}%</span>
                      <span className="text-[10px] text-muted-foreground w-10 text-right">{total} tr.</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {!subscribed && <LockedOverlay onUpgrade={() => setUpgradeOpen(true)} />}
          </div>

          {/* Discipline trend — Pro */}
          <div className="relative">
            <div className={`glass-card p-4 space-y-3 ${!subscribed ? 'blur-sm pointer-events-none select-none' : ''}`}>
              <h2 className="stat-label">Discipline Score (Last 10 Trades)</h2>
              <div className="flex items-end gap-1 h-20">
                {disciplineHistory.map(({ trade, score }) => (
                  <div key={trade} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full rounded-t ${score >= 70 ? 'bg-success' : score >= 50 ? 'bg-chart-4' : 'bg-loss'}`} style={{ height: `${(score / 100) * 72}px` }} />
                    <span className="text-[8px] text-muted-foreground">{trade}</span>
                  </div>
                ))}
                {disciplineHistory.length === 0 && <p className="text-sm text-muted-foreground text-center w-full py-4">No trades yet</p>}
              </div>
            </div>
            {!subscribed && <LockedOverlay onUpgrade={() => setUpgradeOpen(true)} />}
          </div>

          {/* Psychological Insights */}
          <div className="glass-card p-4 space-y-3">
            <h2 className="stat-label">Insights</h2>
            <div className="space-y-2 text-sm">
              {psych.wrHighConf > psych.wrAfterLoss && (
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">You perform <span className="text-foreground font-semibold">{psych.wrHighConf - psych.wrAfterLoss}% better</span> when confidence is high.</p>
                </div>
              )}
              {psych.wrAfterTwoLosses < 40 && psych.afterTwoLossCount > 0 && (
                <div className="flex items-start gap-2">
                  <TrendingDown className="h-4 w-4 text-loss shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">Win rate drops to <span className="text-loss font-semibold">{psych.wrAfterTwoLosses}%</span> after 2 consecutive losses.</p>
                </div>
              )}
              {psych.avgDiscipline < 60 && (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-chart-4 shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">Discipline below 60. Review risk management.</p>
                </div>
              )}
              {psych.avgDiscipline >= 80 && (
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <p className="text-muted-foreground">Excellent discipline: <span className="text-success font-semibold">{psych.avgDiscipline}/100</span>. Professional level.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── BEHAVIORAL TAB ── */}
      {activeTab === 'behavioral' && (
        <div className="space-y-4">
          <div className="relative">
            <div className={`space-y-4 ${!subscribed ? 'blur-sm pointer-events-none select-none' : ''}`}>
              {/* 4 Pillars */}
              <div className="grid grid-cols-2 gap-3">
                <BehavioralPillar label="Discipline" score={behavioralScores.discipline} icon={<Shield className="h-5 w-5" />} />
                <BehavioralPillar label="Patience" score={behavioralScores.patience} icon={<Target className="h-5 w-5" />} />
                <BehavioralPillar label="Emotional Stability" score={behavioralScores.emotionalStability} icon={<Heart className="h-5 w-5" />} />
                <BehavioralPillar label="Execution" score={behavioralScores.execution} icon={<Activity className="h-5 w-5" />} />
              </div>

              {/* Overall Score */}
              <div className="glass-card p-4 text-center">
                <p className="stat-label mb-2">Overall Behavioral Score</p>
                {(() => {
                  const overall = Math.round((behavioralScores.discipline + behavioralScores.patience + behavioralScores.emotionalStability + behavioralScores.execution) / 4);
                  const color = overall >= 75 ? 'text-success' : overall >= 50 ? 'text-chart-4' : 'text-loss';
                  const label = overall >= 75 ? 'Professional Mindset' : overall >= 50 ? 'Developing Trader' : 'Needs Improvement';
                  return (
                    <>
                      <p className={`text-4xl font-bold ${color}`}>{overall}</p>
                      <p className={`text-xs font-semibold ${color} mt-1`}>{label}</p>
                    </>
                  );
                })()}
              </div>

              {/* Improvement Areas */}
              <div className="glass-card p-4">
                <h2 className="stat-label mb-3">Improvement Areas</h2>
                <div className="space-y-2">
                  {Object.entries(behavioralScores)
                    .sort(([, a], [, b]) => a - b)
                    .slice(0, 2)
                    .map(([key, score]) => {
                      const tips: Record<string, string> = {
                        discipline: 'Stick to your risk rules and avoid impulsive entries.',
                        patience: 'Wait for A+ setups only. Reduce FOMO-driven trades.',
                        emotionalStability: 'Practice pre-session meditation. Log emotions consistently.',
                        execution: 'Focus on full SMC confluence setups with 2:1+ R:R.',
                      };
                      return (
                        <div key={key} className="flex items-start gap-2 bg-secondary/30 rounded-lg p-3">
                          <AlertTriangle className="h-4 w-4 text-chart-4 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}: {score}/100</p>
                            <p className="text-[10px] text-muted-foreground">{tips[key]}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
            {!subscribed && <LockedOverlay onUpgrade={() => setUpgradeOpen(true)} />}
          </div>
        </div>
      )}

      {/* ── CHECK-IN TAB ── */}
      {activeTab === 'checkin' && (
        <div className="space-y-4">
          {!todayCheckin ? (
            <div className="glass-card p-6 text-center">
              <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-semibold text-foreground mb-1">No Check-in Today</p>
              <p className="text-xs text-muted-foreground mb-4">Log your pre-session readiness before trading</p>
              <Button size="sm" onClick={() => setCheckinOpen(true)}>
                <Brain className="h-4 w-4 mr-1" /> Start Check-in
              </Button>
            </div>
          ) : (
            <div className="glass-card p-4 border border-success/20 bg-success/5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <h3 className="text-sm font-bold text-foreground">Today's Check-in Complete</h3>
              </div>
              <p className="text-xs text-muted-foreground">Logged at {new Date(todayCheckin.created_at).toLocaleTimeString()}</p>
            </div>
          )}

          {/* Recent check-ins */}
          <div className="glass-card p-4">
            <h2 className="stat-label mb-3">Recent Check-ins</h2>
            {checkins.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No check-ins yet</p>
            ) : (
              <div className="space-y-3">
                {checkins.slice(0, 7).map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-secondary/30 rounded-lg p-3">
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {new Date(c.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{c.emotional_state} • Energy {c.energy_level}/10</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${c.confidence_rating >= 7 ? 'text-success' : c.confidence_rating >= 5 ? 'text-chart-4' : 'text-loss'}`}>
                        {c.confidence_rating}/10
                      </p>
                      <p className="text-[9px] text-muted-foreground">confidence</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Readiness Trend */}
          {checkins.length >= 3 && (
            <div className="relative">
              <div className={`glass-card p-4 ${!subscribed ? 'blur-sm pointer-events-none select-none' : ''}`}>
                <h2 className="stat-label mb-3">Readiness Trend</h2>
                <div className="flex items-end gap-1 h-20">
                  {checkins.slice(0, 14).reverse().map((c, i) => {
                    const avg = (c.energy_level + c.sleep_quality + c.confidence_rating) / 3;
                    const pct = (avg / 10) * 100;
                    const color = pct >= 70 ? 'bg-success' : pct >= 50 ? 'bg-chart-4' : 'bg-loss';
                    return (
                      <div key={c.id} className="flex-1 flex flex-col items-center gap-1">
                        <div className={`w-full rounded-t ${color}`} style={{ height: `${pct * 0.72}px` }} />
                        <span className="text-[7px] text-muted-foreground">{i + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {!subscribed && <LockedOverlay onUpgrade={() => setUpgradeOpen(true)} />}
            </div>
          )}
        </div>
      )}

      {/* Check-in Dialog */}
      <Dialog open={checkinOpen} onOpenChange={setCheckinOpen}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" /> Pre-Session Check-in
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">How are you feeling?</label>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map(e => (
                  <button
                    key={e}
                    onClick={() => setEmotionalState(e)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      emotionalState === e ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">Market Conditions</label>
              <div className="flex flex-wrap gap-2">
                {MARKET_CONDITIONS.map(m => (
                  <button
                    key={m}
                    onClick={() => setMarketConditions(m)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      marketConditions === m ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-muted-foreground'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Energy</label>
                <Input type="number" min={1} max={10} value={energyLevel} onChange={e => setEnergyLevel(parseInt(e.target.value) || 5)} className="bg-secondary/50 text-center" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Sleep</label>
                <Input type="number" min={1} max={10} value={sleepQuality} onChange={e => setSleepQuality(parseInt(e.target.value) || 5)} className="bg-secondary/50 text-center" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Confidence</label>
                <Input type="number" min={1} max={10} value={confidenceRating} onChange={e => setConfidenceRating(parseInt(e.target.value) || 5)} className="bg-secondary/50 text-center" />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Notes (optional)</label>
              <Input value={checkinNotes} onChange={e => setCheckinNotes(e.target.value)} className="bg-secondary/50" placeholder="Any thoughts before trading..." />
            </div>

            <Button className="w-full" onClick={() => addCheckin.mutate()} disabled={addCheckin.isPending}>
              {addCheckin.isPending ? 'Saving...' : 'Complete Check-in'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProUpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}
