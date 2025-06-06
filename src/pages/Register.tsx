
import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserRole } from "@/types";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, BadgeCheck, Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { checkDatabaseConnectivity } from "@/utils/dbHelpers";
import { verifyInvitationCode } from "@/utils/dbHelpers";

// Form schema with validation
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  companyName: z.string().min(1, "Company name is required"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  role: z.enum(["general-contractor", "subcontractor"])
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register: registerUser, isAuthenticated, currentUser, sendEmailVerification } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      companyName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "general-contractor" as UserRole,
    },
  });
  
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const emailParam = queryParams.get('email');
    const codeParam = queryParams.get('code');

    if (emailParam) {
      form.setValue('email', emailParam);
    }

    if (codeParam) {
      // Validate invitation code
      const checkInvitation = async () => {
        try {
          const { data, error } = await verifyInvitationCode(codeParam);
          
          if (error) {
            toast({
              title: "Invitation Error",
              description: error,
              variant: "destructive"
            });
            return;
          }
          
          if (data && data.length > 0 && data[0].valid) {
            const invitationInfo = data[0];
            setInvitationData({
              email: invitationInfo.email,
              generalContractorId: invitationInfo.general_contractor_id,
              generalContractorName: invitationInfo.general_contractor_name,
              code: codeParam
            });
            
            form.setValue('email', invitationInfo.email);
            form.setValue('role', 'subcontractor');
            
            localStorage.setItem('invitationData', JSON.stringify({
              email: invitationInfo.email,
              generalContractorId: invitationInfo.general_contractor_id,
              generalContractorName: invitationInfo.general_contractor_name,
              code: codeParam
            }));
          } else {
            toast({
              title: "Invalid Invitation",
              description: "The invitation code is invalid or has expired.",
              variant: "destructive"
            });
          }
        } catch (err) {
          console.error("Error verifying invitation:", err);
          toast({
            title: "Invitation Error",
            description: "Failed to verify invitation code.",
            variant: "destructive"
          });
        }
      };
      
      checkInvitation();
    } else {
      // Check for stored invitation data
      const storedInvitationData = localStorage.getItem('invitationData');
      if (storedInvitationData) {
        try {
          const parsedData = JSON.parse(storedInvitationData);
          setInvitationData(parsedData);
          form.setValue('role', 'subcontractor');
          if (parsedData.email) {
            form.setValue('email', parsedData.email);
          }
        } catch (e) {
          console.error("Error parsing invitation data", e);
        }
      }
    }
  }, [location.search, form]);
  
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (!currentUser.emailVerified) {
        setShowVerificationBanner(true);
      } else if (currentUser.role === "general-contractor") {
        navigate("/dashboard");
      } else {
        navigate("/sub-dashboard");
      }
    }
  }, [isAuthenticated, currentUser, navigate]);
  
  const onSubmit = async (formData: RegisterFormValues) => {
    setRegisterError(null);
    setLoading(true);
    
    try {
      console.log("Starting registration with form data:", { 
        email: formData.email, 
        name: formData.name, 
        companyName: formData.companyName, 
        role: invitationData ? 'subcontractor' as UserRole : formData.role 
      });
      
      // Check database connectivity
      const isConnected = await checkDatabaseConnectivity();
      if (!isConnected) {
        console.warn("Database connectivity issue during registration");
        toast({
          title: "Connection Warning",
          description: "There might be a problem connecting to the database, but we'll try to register you anyway.",
          variant: "default"
        });
      }
      
      toast({
        title: "Creating account",
        description: "Setting up your account. This might take a moment...",
      });
      
      // Use the registerUser method from AuthContext
      const user = await registerUser(
        formData.email,
        formData.password,
        formData.name,
        formData.companyName,
        invitationData ? 'subcontractor' as UserRole : formData.role,
        invitationData?.generalContractorId,
        invitationData?.code
      );
      
      if (user) {
        setShowVerificationBanner(true);
        
        toast({
          title: "Registration successful",
          description: "Your account has been created. Please verify your email."
        });
        
        // Clear invitation data from localStorage
        if (invitationData) {
          localStorage.removeItem('invitationData');
        }
      } else {
        throw new Error("Failed to register user");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      
      const errorMessage = err.message || "Failed to create account. Please try again.";
      setRegisterError(errorMessage);
      
      toast({
        title: "Registration Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendVerification = async () => {
    const success = await sendEmailVerification();
    if (success) {
      toast({
        title: "Email sent",
        description: "Verification email has been resent to your email address."
      });
    }
  };

  if (showVerificationBanner && currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-qualifind-blue to-qualifind-dark p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Verify your email</CardTitle>
              <CardDescription>
                Please check your email and click the verification link to activate your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 text-blue-700 rounded-md flex items-center space-x-3">
                <Mail className="h-5 w-5" />
                <div>
                  <p className="font-medium">Verification email sent</p>
                  <p className="text-sm">We've sent a verification email to {currentUser.email}</p>
                </div>
              </div>
              
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  Didn't receive an email? Check your spam folder or click below to resend.
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleResendVerification}
                >
                  Resend verification email
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex-col space-y-4">
              <Button 
                variant="link"
                onClick={() => {
                  navigate(currentUser.role === "general-contractor" ? "/dashboard" : "/sub-dashboard");
                }}
              >
                Continue to dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-qualifind-blue to-qualifind-dark p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            <span className="text-qualifind-orange">QUALI</span>FIND
          </h1>
          <p className="text-gray-300 mt-2">Create your account</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
            {invitationData && (
              <CardDescription className="flex items-center gap-2 mt-2 p-2 bg-green-50 text-green-700 rounded-md">
                <BadgeCheck size={18} />
                <span>You were invited by {invitationData.generalContractorName}</span>
              </CardDescription>
            )}
          </CardHeader>
          
          {registerError && (
            <div className="px-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Registration Error</AlertTitle>
                <AlertDescription>
                  {registerError}
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John Smith" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ABC Construction" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="email@company.com" 
                          {...field}
                          disabled={!!invitationData}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pr-10"
                            {...field}
                          />
                          <button 
                            type="button" 
                            className="absolute right-2 top-1/2 transform -translate-y-1/2" 
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </FormControl>
                      <p className="text-xs text-gray-500">Password must be at least 6 characters</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pr-10"
                            {...field}
                          />
                          <button 
                            type="button" 
                            className="absolute right-2 top-1/2 transform -translate-y-1/2" 
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {!invitationData && (
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Type</FormLabel>
                        <FormControl>
                          <RadioGroup 
                            onValueChange={field.onChange} 
                            value={field.value}
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="general-contractor" id="gc" />
                              <Label htmlFor="gc" className="cursor-pointer">General Contractor</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="subcontractor" id="sub" />
                              <Label htmlFor="sub" className="cursor-pointer">Subcontractor</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
              
              <CardFooter className="flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-qualifind-blue hover:bg-qualifind-blue/90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Register"
                  )}
                </Button>
                
                <p className="text-sm text-center text-gray-600">
                  Already have an account?{" "}
                  <Link to="/login" className="text-qualifind-orange hover:underline">
                    Sign in
                  </Link>
                </p>
                {!invitationData && (
                  <p className="text-sm text-center text-gray-500">
                    <Link to="/invitation" className="hover:underline">
                      Have an invitation code?
                    </Link>
                  </p>
                )}
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
