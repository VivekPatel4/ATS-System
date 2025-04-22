import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Shield, Mail, Lock, ArrowRight, Eye, EyeOff, Send, Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { GoogleLogin } from '@react-oauth/google';


// Schema for admin login
const adminFormSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address'
  }),
  password: z.string().min(1, {
    message: 'Password is required'
  })
});

// Schema for vendor login
const vendorLoginSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address'
  }),
  password: z.string().min(1, {
    message: 'Password is required'
  })
});

// Schema for vendor email OTP
const vendorEmailSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address'
  })
});

// Schema for vendor OTP verification
const vendorOtpSchema = z.object({
  otp: z.string().length(6, {
    message: 'OTP must be 6 digits'
  })
});

// Schema for vendor password setup
const vendorPasswordSchema = z.object({
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters'
  }),
  confirmPassword: z.string().min(6, {
    message: 'Confirm password is required'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
const Login = () => {
  const {
    login,
    completeVendorRegistration,
    handleGoogleLogin
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'admin' | 'vendor'>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [vendorView, setVendorView] = useState<'login' | 'email' | 'otp' | 'password'>('login');
  const [vendorEmail, setVendorEmail] = useState('');

  // Get the redirect path from location state or default to dashboard
  const from = (location.state as any)?.from || '/dashboard';

  // Admin login form
  const adminForm = useForm<z.infer<typeof adminFormSchema>>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Vendor login form
  const vendorLoginForm = useForm<z.infer<typeof vendorLoginSchema>>({
    resolver: zodResolver(vendorLoginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Vendor email form
  const vendorEmailForm = useForm<z.infer<typeof vendorEmailSchema>>({
    resolver: zodResolver(vendorEmailSchema),
    defaultValues: {
      email: ''
    }
  });

  // Vendor OTP verification form
  const vendorOtpForm = useForm<z.infer<typeof vendorOtpSchema>>({
    resolver: zodResolver(vendorOtpSchema),
    defaultValues: {
      otp: ''
    }
  });

  // Vendor password setup form
  const vendorPasswordForm = useForm<z.infer<typeof vendorPasswordSchema>>({
    resolver: zodResolver(vendorPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });
  const onSubmitAdmin = async (values: z.infer<typeof adminFormSchema>) => {
    setIsLoading(true);
    try {
      await login(values.email, values.password, 'admin');
      toast.success('Login successful!');
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };
  const onSubmitVendorLogin = async (values: z.infer<typeof vendorLoginSchema>) => {
    setIsLoading(true);
    try {
      await login(values.email, values.password, 'vendor');
      toast.success('Login successful!');
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };
  const onSubmitVendorEmail = async (values: z.infer<typeof vendorEmailSchema>) => {
    setIsLoading(true);
    try {
      // Simulate sending OTP email
      await new Promise(resolve => setTimeout(resolve, 1500));
      setVendorEmail(values.email);
      setVendorView('otp');
      toast.success(`OTP sent to ${values.email}`);
    } catch (error) {
      toast.error('Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };
  const onSubmitVendorOtp = async (values: z.infer<typeof vendorOtpSchema>) => {
    setIsLoading(true);
    try {
      // Simulate verifying OTP
      await new Promise(resolve => setTimeout(resolve, 1500));

      // For demo purposes we'll consider "123456" as valid OTP
      if (values.otp === "123456") {
        // Check if this vendor has already set up a password
        const storedVendors = localStorage.getItem('verified_vendors');
        let verifiedVendors: Record<string, {
          password: string;
          name: string;
        }> = {};
        if (storedVendors) {
          verifiedVendors = JSON.parse(storedVendors);
        }
        if (verifiedVendors[vendorEmail]) {
          // Already has password - proceed with normal login
          await login(vendorEmail, verifiedVendors[vendorEmail].password, 'vendor');
          toast.success("Login successful!");
          navigate(from, { replace: true });
        } else {
          // No password yet - show password setup
          toast.success("OTP verified successfully. Please set your password.");
          setVendorView('password');
        }
      } else {
        toast.error("Invalid OTP, please try again");
      }
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setIsLoading(false);
    }
  };
  const onSubmitVendorPassword = async (values: z.infer<typeof vendorPasswordSchema>) => {
    setIsLoading(true);
    try {
      if (completeVendorRegistration) {
        await completeVendorRegistration(vendorEmail, values.password);
        toast.success("Password set successfully!");
        navigate(from, { replace: true });
      } else {
        throw new Error("Registration function not available");
      }
    } catch (error) {
      toast.error('Failed to set password');
    } finally {
      setIsLoading(false);
    }
  };
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      await handleGoogleLogin(credentialResponse.credential, activeTab);
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google login failed');
  };

  // Set demo credentials based on active tab and view
  const setDemoCredentials = () => {
    if (activeTab === 'admin') {
      adminForm.setValue('email', 'admin@example.com');
      adminForm.setValue('password', 'password');
    } else if (activeTab === 'vendor') {
      if (vendorView === 'login') {
        vendorLoginForm.setValue('email', 'vendor@example.com');
        vendorLoginForm.setValue('password', 'password');
      } else if (vendorView === 'email') {
        vendorEmailForm.setValue('email', 'vendor@example.com');
      } else if (vendorView === 'otp') {
        vendorOtpForm.setValue('otp', '123456');
      } else if (vendorView === 'password') {
        vendorPasswordForm.setValue('password', 'password');
        vendorPasswordForm.setValue('confirmPassword', 'password');
      }
    }
  };

  // Reset vendor step when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'admin' | 'vendor');
    if (value === 'vendor') {
      setVendorView('login');
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      // Simulate resending OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`OTP resent to ${vendorEmail}`);
    } catch (error) {
      toast.error('Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">ATS by outamation</h1>
          <p className="text-muted-foreground mt-2">Streamline vendor & orders management</p>
        </div>
        
        <Card className="border-border/50 shadow-xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary to-blue-400"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">
              {activeTab === 'admin' ? 'Admin Login' : vendorView === 'login' ? 'Vendor Login' : vendorView === 'email' ? 'Vendor Email Verification' : vendorView === 'otp' ? 'OTP Verification' : 'Set Password'}
            </CardTitle>
            <CardDescription className="text-sm">
              {activeTab === 'admin' ? 'Sign in to manage vendors and contracts' : vendorView === 'login' ? 'Sign in with your email and password' : vendorView === 'email' ? 'Enter your email to receive a verification code' : vendorView === 'otp' ? 'Enter the verification code sent to your email' : 'Create a password for your account'}
            </CardDescription>
            
            <Tabs defaultValue="admin" className="w-full mt-4" onValueChange={handleTabChange} value={activeTab}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Admin
                </TabsTrigger>
                <TabsTrigger value="vendor" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Vendor
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-4">
            {activeTab === 'admin' ? <Form {...adminForm}>
                <form onSubmit={adminForm.handleSubmit(onSubmitAdmin)} className="space-y-4">
                  <FormField control={adminForm.control} name="email" render={({
                field
              }) => <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input className="pl-10" placeholder="admin@example.com" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  <FormField control={adminForm.control} name="password" render={({
                field
              }) => <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input type={showPassword ? "text" : "password"} className="pl-10 pr-10" placeholder="••••••••" {...field} />
                            <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  <Button type="submit" className="w-full group relative overflow-hidden" disabled={isLoading}>
                    {isLoading ? <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                        Signing in...
                      </span> : <>
                        <span>Sign in as Admin</span>
                        <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4" />
                      </>}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap
                    theme="outline"
                    size="large"
                    width="100%"
                    text="signin_with"
                    shape="rectangular"
                    locale="en"
                  />
                </form>
              </Form> : vendorView === 'login' ? <div className="space-y-6">
                <Form {...vendorLoginForm}>
                  <form onSubmit={vendorLoginForm.handleSubmit(onSubmitVendorLogin)} className="space-y-4">
                    <FormField control={vendorLoginForm.control} name="email" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                              <Input className="pl-10" placeholder="vendor@example.com" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={vendorLoginForm.control} name="password" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                              <Input type={showPassword ? "text" : "password"} className="pl-10 pr-10" placeholder="••••••••" {...field} />
                              <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <Button type="submit" className="w-full group relative overflow-hidden" disabled={isLoading}>
                      {isLoading ? <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                          Signing in...
                        </span> : <>
                          <span>Sign in</span>
                          <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4" />
                        </>}
                    </Button>
                  </form>
                </Form>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                  theme="outline"
                  size="large"
                  width="100%"
                  text="signin_with"
                  shape="rectangular"
                  locale="en"
                />
              </div> : vendorView === 'email' ? <>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={handleGoogleSuccess}
                  disabled={isLoading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign in with Google
                </Button>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>

                <Form {...vendorEmailForm}>
                  <form onSubmit={vendorEmailForm.handleSubmit(onSubmitVendorEmail)} className="space-y-4">
                    <FormField control={vendorEmailForm.control} name="email" render={({
                  field
                }) => <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input className="pl-10" placeholder="vendor@example.com" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                    <Button type="submit" className="w-full group relative overflow-hidden" disabled={isLoading}>
                      {isLoading ? <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                          Sending OTP...
                        </span> : <>
                          <Send className="w-4 h-4 mr-2" />
                          <span>Send Verification Code</span>
                        </>}
                    </Button>
                  </form>
                </Form>
                
                <div className="text-center mt-4">
                  <Button variant="link" className="text-sm p-0" onClick={() => setVendorView('login')}>
                    Back to login
                  </Button>
                </div>
              </> : vendorView === 'otp' ? <Form {...vendorOtpForm}>
                <form onSubmit={vendorOtpForm.handleSubmit(onSubmitVendorOtp)} className="space-y-4">
                  <div className="mb-4 text-center">
                    <div className="text-sm font-medium text-primary mb-2">Verification Code Sent</div>
                    <div className="text-sm text-muted-foreground">
                      We've sent a 6-digit code to <span className="font-medium">{vendorEmail}</span>
                    </div>
                  </div>
                  
                  <FormField control={vendorOtpForm.control} name="otp" render={({
                field
              }) => <FormItem>
                      <FormLabel>Enter 6-Digit Code</FormLabel>
                      <FormControl>
                        <Input className="text-center tracking-[0.5em] font-mono text-lg" maxLength={6} inputMode="numeric" autoComplete="one-time-code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                        Verifying...
                      </span> : <>
                        <Check className="w-4 h-4 mr-2" />
                        <span>Verify Code</span>
                      </>}
                  </Button>
                  
                  <div className="text-center mt-4">
                    <Button variant="link" type="button" className="text-sm" onClick={() => setVendorView('email')}>
                      Use a different email
                    </Button>
                    <span className="text-muted-foreground mx-2">•</span>
                    <Button variant="link" type="button" className="text-sm" onClick={handleResendOtp} disabled={isLoading}>
                      Resend code
                    </Button>
                  </div>
                </form>
              </Form> : <Form {...vendorPasswordForm}>
                <form onSubmit={vendorPasswordForm.handleSubmit(onSubmitVendorPassword)} className="space-y-4">
                  <div className="mb-4 text-center">
                    <div className="text-sm font-medium text-primary mb-2">Set Your Password</div>
                    <div className="text-sm text-muted-foreground">
                      Create a password for your account
                    </div>
                  </div>
                  
                  <FormField control={vendorPasswordForm.control} name="password" render={({
                field
              }) => <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input type={showPassword ? "text" : "password"} className="pl-10 pr-10" placeholder="••••••••" {...field} />
                            <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  
                  <FormField control={vendorPasswordForm.control} name="confirmPassword" render={({
                field
              }) => <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input type={showPassword ? "text" : "password"} className="pl-10" placeholder="••••••••" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                        Setting password...
                      </span> : <span>Complete Registration</span>}
                  </Button>
                </form>
              </Form>}
          </CardContent>
          
        </Card>
      </div>
    </div>;
};
export default Login;