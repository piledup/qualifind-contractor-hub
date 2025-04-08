import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserRole } from "@/types";
import { toast } from "@/components/ui/use-toast";
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
    const isInvited = queryParams.get('invited') === 'true';

    if (emailParam) {
      form.setValue('email', emailParam);
    }

    if (isInvited) {
      const storedInvitationData = localStorage.getItem('invitationData');
      if (storedInvitationData) {
        try {
          const parsedData = JSON.parse(storedInvitationData);
          setInvitationData(parsedData);
          form.setValue('role', 'subcontractor');
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
  
  const handleManualProfileCreation = async (userId: string, userData: RegisterFormValues, role: UserRole) => {
    console.log("Creating profile manually for user:", userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userData.email,
          name: userData.name,
          company_name: userData.companyName,
          role: role,
          email_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error("Error creating profile manually:", error);
        return false;
      }
      
      console.log("Profile created successfully:", data);
      return true;
    } catch (err) {
      console.error("Exception in manual profile creation:", err);
      return false;
    }
  };
  
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
      
      toast({
        title: "Creating account",
        description: "Setting up your account. This might take a moment...",
      });
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            company_name: formData.companyName,
            role: invitationData ? 'subcontractor' as UserRole : formData.role
          },
          emailRedirectTo: `${window.location.origin}/update-password`
        }
      });
      
      if (authError) {
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error("Failed to create user");
      }
      
      console.log("User created in auth system:", authData.user.id);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { data: profileData, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();
      
      console.log("Profile check result:", profileData, profileCheckError);
      
      if (!profileData) {
        console.log("Profile not found, creating manually");
        const roleToUse = invitationData ? 'subcontractor' as UserRole : formData.role;
        await handleManualProfileCreation(authData.user.id, formData, roleToUse);
      }
      
      if (invitationData) {
        console.log("Processing invitation data:", invitationData);
        const { error: inviteUpdateError } = await supabase
          .from('invitations')
          .update({ status: 'accepted' })
          .eq('code', invitationData.code);
        
        if (inviteUpdateError) {
          console.error("Error updating invitation status:", inviteUpdateError);
        } else {
          localStorage.removeItem('invitationData');
        }
      }
      
      let user = {
        id: authData.user.id,
        email: formData.email,
        name: formData.name,
        role: invitationData ? 'subcontractor' as UserRole : formData.role,
        companyName: formData.companyName,
        createdAt: new Date(),
        emailVerified: false
      };
      
      setCurrentUser(user);
      setShowVerificationBanner(true);
      
      toast({
        title: "Registration successful",
        description: "Your account has been created. Please verify your email."
      });
      
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
