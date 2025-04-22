import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { BarChart2, Building2, FileText, Home, LogOut, Users, Layers, Shield, BarChart3, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export function Sidebar() {
  const {
    user,
    logout
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  const adminLinks = [{
    icon: Home,
    label: "Dashboard",
    path: "/dashboard"
  }, {
    icon: Users,
    label: "Agents",
    path: "/admin/agents"
  }, {
    icon: Building2,
    label: "Vendors",
    path: "/admin/vendors"
  }, {
    icon: Layers,
    label: "Services",
    path: "/admin/services"
  }, {
    icon: FileText,
    label: "Orders",
    path: "/admin/contracts"
  }, {
    icon: BarChart3,
    label: "Reports",
    path: "/admin/reports"
  }, {
    icon: Shield,
    label: "Admins",
    path: "/admin/admins"
  }];

  const vendorLinks = [{
    icon: Home,
    label: "Dashboard",
    path: "/dashboard"
  }, {
    icon: FileText,
    label: "Orders",
    path: "/vendor/contracts"
  }, {
    icon: Building,
    label: "Assigned Properties",
    path: "/vendor/assigned-properties"
  }];

  let links;
  switch (user.role) {
    case 'admin':
      links = adminLinks;
      break;
    case 'vendor':
      links = vendorLinks;
      break;
    default:
      links = [];
  }

  const handleLogout = () => {
    setIsLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
    setIsLogoutDialogOpen(false);
  };

  const sidebarTitle = user.role === 'admin' ? 'ADMIN-CONNECT' : 'VENDOR-CONNECT';

  return <>
      <aside className="h-screen w-64 border-r border-border/40 p-6 bg-card/50 flex flex-col fixed left-0 animate-fade-in">
        <div className="flex items-center justify-center mb-8">
          <span className="text-xl mx-[4px] my-0 font-bold text-blue-600">
            {sidebarTitle}
          </span>
        </div>
        
        <nav className="space-y-1 flex-1">
          {links.map(link => <Button key={link.path} variant={isActive(link.path) ? "secondary" : "ghost"} className={cn("w-full justify-start mb-1 group transition-all", isActive(link.path) ? "bg-secondary font-medium" : "text-muted-foreground")} onClick={() => navigate(link.path)}>
              <link.icon className={cn("mr-3 h-5 w-5", isActive(link.path) ? "text-primary animate-slide-up" : "text-muted-foreground group-hover:text-foreground")} />
              {link.label}
            </Button>)}
        </nav>
        
        <div className="mt-auto space-y-3">
          <Separator />
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive" onClick={handleLogout}>
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
}
