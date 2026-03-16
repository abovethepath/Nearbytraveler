import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plane, Store, Check } from "lucide-react";

interface JoinNowWidgetNewProps {
  darkBackground?: boolean;
}

export default function JoinNowWidgetNew({ darkBackground }: JoinNowWidgetNewProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [userType, setUserType] = useState("");

  const handleUserTypeClick = (type: string) => {
    setUserType(type);
  };

  const handleContinue = () => {
    if (!userType) {
      toast({
        title: "Please select your type",
        description: "Choose your account type to continue.",
        variant: "destructive",
      });
      return;
    }
    sessionStorage.setItem('selectedUserType', userType);
    sessionStorage.removeItem('isNewToTown');
    setLocation('/signup/account');
  };

  const userTypes = [
    {
      type: "local",
      icon: MapPin,
      title: "Nearby Local",
      subtitle: "I live here & want to meet travelers",
      darkOverlayClass: "join-dark-overlay-local",
    },
    {
      type: "traveler",
      icon: Plane,
      title: "Nearby Traveler",
      subtitle: "I'm traveling & want to connect",
      darkOverlayClass: "join-dark-overlay-traveler",
    },
    {
      type: "business",
      icon: Store,
      title: "Nearby Business",
      subtitle: "I run a local business",
      darkOverlayClass: "join-dark-overlay-business",
    },
  ];

  return (
    <>
      <style>{`
        .join-dark-overlay-local   { background: transparent; }
        .join-dark-overlay-traveler { background: transparent; }
        .join-dark-overlay-business { background: transparent; }
        .dark .join-dark-overlay-local   { background: linear-gradient(to right, #3b82f6, #f97316); }
        .dark .join-dark-overlay-traveler { background: linear-gradient(to right, #3b82f6, #2563eb); }
        .dark .join-dark-overlay-business { background: linear-gradient(to right, #f97316, #ea580c); }
        .join-role-btn {
          position: relative; overflow: hidden; border-radius: 0.75rem;
          padding: 1rem; text-align: left; transition: all 0.2s;
          display: flex; align-items: center; gap: 1rem; width: 100%;
          background: #ffffff; border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          cursor: pointer;
        }
        .join-role-btn:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); transform: scale(1.005); border-color: #d1d5db; }
        .join-role-btn.selected { border: 2px solid #f97316; background: #fff7ed; box-shadow: 0 4px 16px rgba(249,115,22,0.15); transform: scale(1.01); }
        .dark .join-role-btn { background: transparent; border-color: rgba(255,255,255,0.1); }
        .dark .join-role-btn:hover { border-color: rgba(255,255,255,0.2); }
        .dark .join-role-btn.selected { border-color: rgba(255,255,255,0.4); background: transparent; }
        .join-role-overlay { position: absolute; inset: 0; border-radius: 0.75rem; pointer-events: none; }
        .join-role-content { position: relative; z-index: 10; }
        .join-icon-wrap {
          flex-shrink: 0; width: 3rem; height: 3rem; border-radius: 9999px;
          display: flex; align-items: center; justify-content: center;
          background: #f3f4f6;
        }
        .join-role-btn.selected .join-icon-wrap { background: #fed7aa; }
        .dark .join-icon-wrap { background: rgba(255,255,255,0.15); }
        .dark .join-role-btn.selected .join-icon-wrap { background: rgba(255,255,255,0.2); }
        .join-icon { width: 1.5rem; height: 1.5rem; color: #374151; }
        .dark .join-icon { color: #ffffff; }
        .join-role-btn.selected .join-icon { color: #c2410c; }
        .dark .join-role-btn.selected .join-icon { color: #ffffff; }
        .join-title { font-size: 1rem; font-weight: 700; color: #111827; line-height: 1.25; }
        .dark .join-title { color: #ffffff; }
        .join-subtitle { font-size: 0.875rem; color: #6b7280; line-height: 1.4; }
        .dark .join-subtitle { color: rgba(255,255,255,0.8); }
        .join-check { flex-shrink: 0; width: 2rem; height: 2rem; border-radius: 9999px; background: #f97316; display: flex; align-items: center; justify-content: center; }
        .dark .join-check { background: rgba(255,255,255,0.25); }
      `}</style>

      <div className="space-y-5">
        <p className="text-left text-gray-600 dark:text-gray-400 font-medium text-sm">
          Choose how you want to connect
        </p>

        <div className="space-y-3">
          {userTypes.map(({ type, icon: Icon, title, subtitle, darkOverlayClass }) => {
            const isSelected = userType === type;
            return (
              <button
                key={type}
                onClick={() => handleUserTypeClick(type)}
                type="button"
                data-testid={`button-select-${type}`}
                className={`join-role-btn${isSelected ? " selected" : ""}`}
              >
                <div className={`join-role-overlay ${darkOverlayClass}`} aria-hidden />
                <div className="join-role-content join-icon-wrap">
                  <Icon className="join-icon" />
                </div>
                <div className="join-role-content flex-grow">
                  <div className="join-title">{title}</div>
                  <div className="join-subtitle">{subtitle}</div>
                </div>
                {isSelected && (
                  <div className="join-role-content join-check">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <Button
          onClick={handleContinue}
          type="button"
          disabled={!userType}
          data-testid="button-continue"
          className={[
            "w-full py-6 text-lg font-semibold rounded-xl transition-all duration-200",
            userType
              ? "bg-black hover:bg-gray-900 text-white shadow-lg hover:shadow-xl"
              : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed",
          ].join(" ")}
        >
          {userType ? "Continue →" : "Select an option to continue"}
        </Button>
      </div>
    </>
  );
}
