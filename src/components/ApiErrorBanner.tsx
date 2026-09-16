import { AlertTriangle, X } from 'lucide-react';

interface ApiErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export default function ApiErrorBanner({ message, onDismiss }: ApiErrorBannerProps) {
  return (
    <div
      role="alert"
      className="fixed left-4 right-4 top-4 z-[60] mx-auto max-w-xl rounded-2xl border border-red-500/40 bg-zinc-950/95 p-4 text-sm text-red-100 shadow-2xl backdrop-blur"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">MeetEat could not complete that action</p>
          <p className="mt-1 break-words text-xs leading-relaxed text-red-100/80">{message}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg border border-zinc-800 p-1 text-zinc-400 transition hover:border-red-400/50 hover:text-white"
          aria-label="Dismiss error"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

