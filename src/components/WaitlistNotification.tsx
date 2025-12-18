import { useState, useEffect } from 'react';
import { X, Crown, Sparkles } from 'lucide-react';

const NOTIFICATION_INTERVAL = 15000; // 15 seconds
const NOTIFICATION_DURATION = 5000; // 5 seconds visible

const firstNames = [
  'James', 'Sarah', 'Michael', 'Emma', 'David', 'Olivia', 'Chris', 'Sophia',
  'Daniel', 'Isabella', 'Matthew', 'Mia', 'Andrew', 'Charlotte', 'Ryan'
];

const cities = [
  'New York', 'Los Angeles', 'London', 'Toronto', 'Sydney', 'Berlin',
  'Miami', 'Chicago', 'San Francisco', 'Austin', 'Seattle', 'Boston'
];

export function WaitlistNotification() {
  const [visible, setVisible] = useState(false);
  const [notification, setNotification] = useState({ name: '', city: '' });
  const [spotsRemaining, setSpotsRemaining] = useState(12);

  useEffect(() => {
    const showNotification = () => {
      const name = firstNames[Math.floor(Math.random() * firstNames.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      setNotification({ name, city });
      setVisible(true);

      // Occasionally decrease spots
      if (Math.random() > 0.7 && spotsRemaining > 5) {
        setSpotsRemaining(prev => prev - 1);
      }

      setTimeout(() => setVisible(false), NOTIFICATION_DURATION);
    };

    // Show first notification after 5 seconds
    const initialTimeout = setTimeout(showNotification, 5000);
    
    // Then show periodically
    const interval = setInterval(showNotification, NOTIFICATION_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [spotsRemaining]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-left-full duration-500">
      <div className="glass-card p-4 pr-10 flex items-center gap-3 border-amber-400/30 shadow-lg shadow-amber-400/10 max-w-sm">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-300 flex items-center justify-center flex-shrink-0">
          <Crown className="w-5 h-5 text-black" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {notification.name} from {notification.city}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            just joined the Priority Waitlist!
          </p>
          <p className="text-xs text-amber-400 font-medium mt-0.5">
            Only {spotsRemaining} Founding Member spots left
          </p>
        </div>
        <button 
          onClick={() => setVisible(false)}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
