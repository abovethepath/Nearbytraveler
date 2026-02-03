import { useContext } from "react";
import { Button } from "@/components/ui/button";
import { AuthContext } from "@/App";

interface LogoutButtonProps {
  onLogout?: () => void;
}

export function LogoutButton({ onLogout }: LogoutButtonProps) {
  const { logout } = useContext(AuthContext);
  
  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    }
    await logout();
  };

  return (
    <Button 
      onClick={handleLogout}
      variant="outline" 
      className="text-red-600 border-red-600 hover:bg-red-50"
    >
      Logout
    </Button>
  );
}