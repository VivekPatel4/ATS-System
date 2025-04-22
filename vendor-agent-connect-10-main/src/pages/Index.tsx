
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <AppLayout requireAuth={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="max-w-4xl px-4 text-center animate-fade-in">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            <span className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400 pb-1">
              Vendor Connect
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline the management of vendor contracts. Connect agents 
            with vendors, track contract status, and optimize your business operations.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className="group"
            >
              Get Started 
              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate('/about')}
            >
              Learn More
            </Button>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border rounded-lg bg-card/50 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <h3 className="text-xl font-semibold mb-2">For Admins</h3>
              <p className="text-muted-foreground mb-4">
                Manage agents and vendors, oversee all contracts, and track business performance.
              </p>
              <Button variant="link" className="p-0" onClick={() => navigate('/login')}>
                Admin Login <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 border rounded-lg bg-card/50 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <h3 className="text-xl font-semibold mb-2">For Agents</h3>
              <p className="text-muted-foreground mb-4">
                Create and manage contracts, communicate with vendors, and track contract statuses.
              </p>
              <Button variant="link" className="p-0" onClick={() => navigate('/login')}>
                Agent Login <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 border rounded-lg bg-card/50 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <h3 className="text-xl font-semibold mb-2">For Vendors</h3>
              <p className="text-muted-foreground mb-4">
                Review contracts, track history, and communicate with assigned agents.
              </p>
              <Button variant="link" className="p-0" onClick={() => navigate('/login')}>
                Learn More <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
