import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFighterProfiles } from "@/hooks/useFighterProfiles";
import LicenseWelcome from "@/pages/license/LicenseWelcome";

const SmartHomepage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { getUserFighterProfile } = useFighterProfiles();

  useEffect(() => {
    const checkUserState = async () => {
      // Wait for auth to finish loading
      if (loading) return;

      // If user is authenticated, check their preferences
      if (user) {
        try {
          // Check if user has fighter profile
          const profile = await getUserFighterProfile();
          
          if (profile) {
            // User has fighter profile, redirect to social feed
            navigate("/social/feed", { replace: true });
            return;
          }

          // Check if user already chose to be explorer
          const hasExplorerPreference = localStorage.getItem("user_preference_explorer") === "true";
          
          if (hasExplorerPreference) {
            // User chose to explore, redirect to social feed
            navigate("/social/feed", { replace: true });
            return;
          }

          // User is authenticated but has no profile and hasn't chosen explorer
          // Show LicenseWelcome (component will render below)
        } catch (error) {
          console.error("Error checking fighter profile:", error);
          // On error, show LicenseWelcome to give user option
        }
      }
      
      // If not authenticated or needs to see welcome, component renders below
    };

    checkUserState();
  }, [user, loading, navigate, getUserFighterProfile]);

  // Show loading state while checking
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Render LicenseWelcome for:
  // 1. Unauthenticated users
  // 2. Authenticated users without fighter profile who haven't chosen explorer
  return <LicenseWelcome />;
};

export default SmartHomepage;
