import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Label } from '@/components/ui/label';
import { Camera, X, ZoomIn } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ChartScreenshotUploadProps {
  beforeUrl: string;
  afterUrl: string;
  onBeforeChange: (url: string) => void;
  onAfterChange: (url: string) => void;
}

export default function ChartScreenshotUpload({
  beforeUrl, afterUrl, onBeforeChange, onAfterChange
}: ChartScreenshotUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState<'before' | 'after' | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File, type: 'before' | 'after') => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setUploading(type);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}-${type}.${ext}`;
      const { error } = await supabase.storage.from('chart-screenshots').upload(path, file);
      if (error) throw error;
      // Use signed URL instead of public URL (bucket is now private)
      const { data: signedData, error: signError } = await supabase.storage
        .from('chart-screenshots')
        .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year
      if (signError) throw signError;
      const signedUrl = signedData.signedUrl;
      // Store the path for DB, but pass signed URL for immediate display
      if (type === 'before') onBeforeChange(signedUrl);
      else onAfterChange(signedUrl);
      toast.success(`${type === 'before' ? 'Before' : 'After'} chart uploaded!`);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const renderSlot = (type: 'before' | 'after', url: string, inputRef: React.RefObject<HTMLInputElement>, onChange: (url: string) => void) => (
    <div className="flex-1">
      <Label className="text-xs text-muted-foreground mb-1.5 block">{type === 'before' ? 'Before Entry' : 'After Exit'}</Label>
      {url ? (
        <div className="relative group rounded-lg overflow-hidden border border-border">
          <img src={url} alt={`${type} chart`} className="w-full h-24 object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button onClick={() => setViewUrl(url)} className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <ZoomIn className="h-4 w-4 text-primary" />
            </button>
            <button onClick={() => onChange('')} className="h-8 w-8 rounded-full bg-loss/20 flex items-center justify-center">
              <X className="h-4 w-4 text-loss" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading === type}
          className="w-full h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1"
        >
          {uploading === type ? (
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Camera className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Add Chart</span>
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleUpload(f, type);
        }}
      />
    </div>
  );

  return (
    <section className="glass-card p-4 space-y-3 animate-fade-in">
      <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Chart Screenshots</h2>
      <div className="flex gap-3">
        {renderSlot('before', beforeUrl, beforeRef as any, onBeforeChange)}
        {renderSlot('after', afterUrl, afterRef as any, onAfterChange)}
      </div>

      <Dialog open={!!viewUrl} onOpenChange={() => setViewUrl(null)}>
        <DialogContent className="bg-card border-border max-w-lg p-1">
          {viewUrl && (
            <img src={viewUrl} alt="Chart" className="w-full rounded-lg" style={{ touchAction: 'pinch-zoom' }} />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
