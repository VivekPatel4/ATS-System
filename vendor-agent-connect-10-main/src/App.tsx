import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from "@/contexts/ThemeContext";
import NotFound from "./pages/NotFound";
import Agents from "./pages/admin/agents";
import Vendors from "./pages/admin/vendors";
import { AuthProvider } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import About from "./pages/About";
import AdminContracts from "./pages/admin/contracts";
import AdminReports from "./pages/admin/reports";
import EditAgent from "./pages/admin/agents/edit/[id]";
import EditVendor from "./pages/admin/vendors/edit/[id]";
import VendorContracts from "./pages/vendor/contracts";
import VendorContractDetails from "./pages/vendor/contracts/[id]";
import AdminServices from "./pages/admin/services";
import AgentDetails from "./pages/admin/agents/[id]";
import PrivateRoute from './components/PrivateRoute';
import VendorDetails from "./pages/admin/vendors/[id]";
import AdminList from "./pages/admin/admins";
import AssignedProperties from "./pages/vendor/AssignedProperties";

const queryClient = new QueryClient();

// Replace with your Google Client ID
const GOOGLE_CLIENT_ID = '197854560529-lvjvk99afliq6k2ck9k70855uuttc0v5.apps.googleusercontent.com';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                
                {/* Protected Routes */}
                <Route element={<PrivateRoute allowedRoles={['admin', 'vendor']} />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/about" element={<About />} />
                </Route>

                {/* Admin routes */}
                <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']} />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="agents" element={<Agents />} />
                  <Route path="agents/:id" element={<AgentDetails />} />
                  <Route path="agents/edit/:id" element={<EditAgent />} />
                  <Route path="vendors" element={<Vendors />} />
                  <Route path="vendors/:id" element={<VendorDetails />} />
                  <Route path="vendors/edit/:id" element={<EditVendor />} />
                  <Route path="services" element={<AdminServices />} />
                  <Route path="contracts" element={<AdminContracts />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="admins" element={<AdminList />} />
                </Route>
                
                {/* Vendor routes */}
                <Route path="/vendor" element={<PrivateRoute allowedRoles={['vendor']} />}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="contracts" element={<VendorContracts />} />
                  <Route path="contracts/:id" element={<VendorContractDetails />} />
                  <Route path="assigned-properties" element={<AssignedProperties />} />
                </Route>
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </GoogleOAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
