
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Mail, Users, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();
  
  return (
    <AppLayout requireAuth={false}>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight mb-2">About Vendor Connect</h1>
        <p className="text-muted-foreground mb-8">Streamlining agent-vendor contract management</p>
        
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
              <CardDescription>Simplifying complex contract management</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Vendor Connect was created to streamline the often complex process of managing contracts between agents and vendors. Our platform provides a centralized hub where all stakeholders can efficiently create, review, and manage contracts.
              </p>
              <p>
                By digitalizing the contract management process, we're helping businesses save time, reduce errors, and improve collaboration between agents and vendors.
              </p>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>For Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Create and manage contracts with vendors, track status updates, and maintain clear communication channels.
                </p>
                <Button variant="link" className="px-0" onClick={() => navigate('/login')}>
                  Learn More
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <Building2 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>For Vendors</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Review contract details, track payment schedules, and communicate directly with assigned agents.
                </p>
                <Button variant="link" className="px-0" onClick={() => navigate('/login')}>
                  Learn More
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <FileText className="h-8 w-8 text-primary mb-2" />
                <CardTitle>For Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Oversee all contracts, manage agents and vendors, and generate comprehensive reports.
                </p>
                <Button variant="link" className="px-0" onClick={() => navigate('/login')}>
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
              <CardDescription>Get in touch with our team</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center justify-between">
              <div className="flex items-center mb-4 sm:mb-0">
                <Mail className="h-5 w-5 text-primary mr-2" />
                <span>support@vendorconnect.example.com</span>
              </div>
              <Button>Contact Support</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default About;
