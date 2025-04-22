import { ReactNode, useEffect } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

interface AppLayoutProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export function AppLayout({ children, requireAuth = true }: AppLayoutProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // If auth is required and user is not logged in, redirect to login
        navigate('/login', { 
          replace: true,
          state: { from: location.pathname }
        });
      } else if (!requireAuth && user) {
        // If auth is not required and user is logged in, redirect to dashboard
        navigate('/dashboard', { replace: true });
      }
    }
  }, [loading, requireAuth, user, navigate, location.pathname]);
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (requireAuth && !user) {
    return null;
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      {user && <Header />}
      <div className="flex flex-1">
        {user && <Sidebar />}
        <main className={`flex-1 p-6 ${user ? 'ml-64' : ''} animate-slide-up`}>
          {children}
        </main>
      </div>
    </div>
  );
}
