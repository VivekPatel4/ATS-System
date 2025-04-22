
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Home, LayoutDashboard } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const isAdminPath = location.pathname.startsWith('/admin');
  const isVendorPath = location.pathname.startsWith('/vendor');

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-5xl font-bold mb-4 text-primary">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <p className="text-gray-500 mb-6">
          The page at <code className="bg-gray-100 px-2 py-1 rounded">{location.pathname}</code> is under construction or doesn't exist.
        </p>
        <div className="space-y-2">
          <Button asChild className="w-full flex gap-2">
            <Link to={user ? '/dashboard' : '/'}>
              {user ? <LayoutDashboard className="h-4 w-4" /> : <Home className="h-4 w-4" />}
              {user ? 'Go to Dashboard' : 'Return to Home'}
            </Link>
          </Button>
          
          {isAdminPath && user?.role === 'admin' && (
            <Button asChild variant="outline" className="w-full flex gap-2">
              <Link to="/admin/agents">
                <ArrowLeft className="h-4 w-4" />
                Back to Admin Panel
              </Link>
            </Button>
          )}
          
          {isVendorPath && user?.role === 'vendor' && (
            <Button asChild variant="outline" className="w-full flex gap-2">
              <Link to="/vendor/contracts">
                <ArrowLeft className="h-4 w-4" />
                Back to Vendor Panel
              </Link>
            </Button>
          )}
          
          {user && !isAdminPath && !isVendorPath && (
            <Button asChild variant="outline" className="w-full flex gap-2">
              <Link to="/">
                <Home className="h-4 w-4" />
                Go to Home
              </Link>
            </Button>
          )}
          
          {!user && (
            <Button asChild variant="outline" className="w-full flex gap-2">
              <Link to="/login">
                Sign In
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
