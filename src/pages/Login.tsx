
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserRole } from "@/types";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { checkDatabaseConnectivity } from "@/utils/dbHelpers";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, currentUser } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("general-contractor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (currentUser.role === "general-contractor") {
        navigate("/dashboard");
      } else {
        navigate("/sub-dashboard");
      }
    }
  }, [isAuthenticated, currentUser, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      console.log("Attempting login with:", { email, role });
      
      // Check database connectivity
      const isConnected = await checkDatabaseConnectivity();
      if (!isConnected) {
        console.warn("Database connectivity issue during login");
        toast({
          title: "Connection Warning",
          description: "There might be a problem connecting to the database, but we'll try to log you in anyway.",
          variant: "default"
        });
      }
      
      // Attempt to login
      const user = await login(email, password, role);
      
      if (!user) {
        throw new Error(`Login failed. This account may not be registered as a ${role.replace('-', ' ')}.`);
      }
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`
      });
      
      if (user.role === "general-contractor") {
        navigate("/dashboard");
      } else {
        navigate("/sub-dashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      
      if (err.message?.includes("Email not confirmed") || err.message?.includes("email_not_confirmed")) {
        setError("Your email has not been confirmed. Please check your inbox or click 'Resend confirmation' below.");
      } else {
        setError(err.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendConfirmation = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address first",
        variant: "destructive"
      });
      return;
    }
    
    setIsResendingEmail(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Confirmation email sent",
        description: "Please check your inbox for the confirmation link"
      });
    } catch (err: any) {
      console.error("Error resending confirmation:", err);
      toast({
        title: "Failed to resend confirmation",
        description: err.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsResendingEmail(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-qualifind-blue to-qualifind-dark p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            <span className="text-qualifind-orange">QUALI</span>FIND
          </h1>
          <p className="text-gray-300 mt-2">Sign in to your account</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="ml-2">{error}</AlertDescription>
                  {error.includes("email has not been confirmed") && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleResendConfirmation}
                      disabled={isResendingEmail}
                      className="mt-2 w-full"
                    >
                      {isResendingEmail ? "Sending..." : "Resend confirmation email"}
                    </Button>
                  )}
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@company.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button 
                    type="button" 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="text-right">
                  <Link 
                    to="/reset-password" 
                    className="text-sm text-qualifind-orange hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Account Type</Label>
                <RadioGroup 
                  value={role} 
                  onValueChange={(val) => setRole(val as UserRole)}
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
              </div>
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
                    Logging in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              
              <p className="text-sm text-center text-gray-600">
                Don't have an account?{" "}
                <Link to="/register" className="text-qualifind-orange hover:underline">
                  Sign up
                </Link>
              </p>
              <p className="text-sm text-center text-gray-500">
                <Link to="/invitation" className="hover:underline">
                  Have an invitation code?
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
