import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserRole } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { ensureTablesExist, checkProfileExists, createProfile } from "@/utils/dbSetup";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, currentUser } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("general-contractor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [checkingDatabaseTables, setCheckingDatabaseTables] = useState(false);
  const [dbSetupResult, setDbSetupResult] = useState<string | null>(null);
  
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      if (currentUser.role === "general-contractor") {
        navigate("/dashboard");
      } else {
        navigate("/sub-dashboard");
      }
    }
  }, [isAuthenticated, currentUser, navigate]);
  
  const checkDbSetup = async () => {
    setCheckingDatabaseTables(true);
    try {
      const result = await ensureTablesExist();
      setDbSetupResult(result.message);
      
      if (result.success) {
        toast({
          title: "Database verification",
          description: result.message
        });
      } else {
        toast({
          title: "Database verification failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (err: any) {
      setDbSetupResult(`Error: ${err.message}`);
      toast({
        title: "Database verification error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setCheckingDatabaseTables(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      console.log("Attempting login with:", { email, role });
      
      // First check if database tables exist
      const dbCheck = await ensureTablesExist();
      if (!dbCheck.success) {
        console.warn("Database setup issue:", dbCheck.message);
      }
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) {
        throw authError;
      }
      
      if (!data.user) {
        throw new Error("No user returned from login");
      }
      
      console.log("Successfully signed in with Supabase:", data.user);
      
      // Check if profile exists
      const profileExists = await checkProfileExists(data.user.id);
      if (!profileExists) {
        console.warn("Profile doesn't exist for user. Attempting to create one.");
        
        // Create profile for the user if it doesn't exist
        const createResult = await createProfile({
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.name || email,
          role: role,
          company_name: data.user.user_metadata?.company_name || '',
        });
        
        if (!createResult.success) {
          console.error("Error creating profile during login:", createResult.message);
        }
      }
      
      // Attempt to login with our context
      const loginResult = await login(email, password, role);
      
      if (!loginResult) {
        // If login failed, sign out and return an error
        await supabase.auth.signOut();
        throw new Error(`Login failed. This account may not be registered as a ${role.replace('-', ' ')}.`);
      }
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${loginResult.name}!`
      });
      
      if (loginResult.role === "general-contractor") {
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
              
              {dbSetupResult && (
                <Alert variant={dbSetupResult.includes("Error") ? "destructive" : "default"} className="text-sm">
                  <AlertDescription>{dbSetupResult}</AlertDescription>
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
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
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
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={checkDbSetup}
                disabled={checkingDatabaseTables}
                className="w-full"
              >
                {checkingDatabaseTables ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking database...
                  </>
                ) : (
                  "Verify Database Setup"
                )}
              </Button>
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
