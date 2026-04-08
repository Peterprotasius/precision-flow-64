import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';

interface ChatImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null, base64: string | null) => void;
  disabled?: boolean;
}

export default function ChatImageUpload({ imageUrl, onImageChange, disabled }: ChatImageUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      // Convert to base64 for AI vision
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const base64 = await base64Promise;

      // Also upload for display
      const ext = file.name.split('.').pop();
      const path = `${user.id}/coach-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('chart-screenshots').upload(path, file);
      if (error) throw error;

      const { data: signedData, error: signError } = await supabase.storage
        .from('chart-screenshots')
        .createSignedUrl(path, 60 * 60 * 24);
      if (signError) throw signError;

      onImageChange(signedData.signedUrl, base64);
      toast.success('Chart attached!');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {imageUrl && (
        <div className="relative inline-block mb-2">
          <img src={imageUrl} alt="Chart" className="h-16 rounded-lg border border-border object-cover" />
          <button
            onClick={() => onImageChange(null, null)}
            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
        title="Attach chart screenshot"
      >
        {uploading ? (
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) handleUpload(f);
          if (inputRef.current) inputRef.current.value = '';
        }}
      />
    </>
  );
}
