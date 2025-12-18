import { useState } from 'react';
import { X, Sparkles, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DoubleDonPopupProps {
  isOpen: boolean;
  onClose: () => void;
  bonusAmount: number;
  deadline: string;
  contentType: string;
}

export function DoubleDonPopup({ isOpen, onClose, bonusAmount, deadline, contentType }: DoubleDonPopupProps) {
  const [isAccepting, setIsAccepting] = useState(false);

  if (!isOpen) return null;

  const handleAccept = async () => {
    setIsAccepting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsAccepting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-md glass-card p-6 animate-scale-in border-primary/50 glow-primary">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-glow-pulse">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Double-Down Opportunity!</h2>
          <p className="text-muted-foreground mt-1">AI has detected high performance potential</p>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-6">
          <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-success" />
                <span className="text-foreground font-medium">Bonus Offer</span>
              </div>
              <span className="text-2xl font-bold font-mono text-success">+${bonusAmount}</span>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Requested Content:</p>
            <p className="text-foreground font-medium">{contentType}</p>
          </div>

          <div className="flex items-center gap-2 text-sm text-warning">
            <Clock className="w-4 h-4" />
            <span>Offer expires: {deadline}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Decline
          </Button>
          <Button 
            variant="success" 
            className="flex-1"
            onClick={handleAccept}
            disabled={isAccepting}
          >
            {isAccepting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-success-foreground/30 border-t-success-foreground rounded-full animate-spin" />
                Accepting...
              </span>
            ) : (
              'Accept Bonus'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
