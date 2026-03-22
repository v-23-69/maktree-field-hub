import { Loader2 } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
