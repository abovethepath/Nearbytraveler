import { useState, useEffect } from "react";
import { X, MessageCircle, Volume2 } from "lucide-react";
import websocketService from "@/services/websocketService";

interface IMAlert {
  id: string;
  from: string;
  preview: string;
  timestamp: Date;
}

export default function IMAlert() {
  const [alerts, setAlerts] = useState<IMAlert[]>([]);

  useEffect(() => {
    const handleIMAlert = (data: { from: string; preview: string; timestamp: Date }) => {
      const alert: IMAlert = {
        id: Math.random().toString(36).substr(2, 9),
        from: data.from,
        preview: data.preview,
        timestamp: data.timestamp
      };

      setAlerts(prev => [...prev, alert]);

      // Auto-remove alert after 5 seconds
      setTimeout(() => {
        setAlerts(prev => prev.filter(a => a.id !== alert.id));
      }, 5000);
    };

    websocketService.on('im_alert', handleIMAlert);

    return () => {
      websocketService.off('im_alert', handleIMAlert);
    };
  }, []);

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className="bg-blue-600 text-white p-4 rounded-lg shadow-lg max-w-sm animate-slide-in-right"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span className="font-medium">New Message</span>
              <Volume2 className="w-3 h-3 text-blue-300" />
            </div>
            <button
              onClick={() => removeAlert(alert.id)}
              className="text-blue-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-1">
            <div className="font-medium text-sm">From: @{alert.from}</div>
            <div className="text-sm opacity-90">{alert.preview}</div>
            <div className="text-xs opacity-75">
              {alert.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      ))}
      
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}