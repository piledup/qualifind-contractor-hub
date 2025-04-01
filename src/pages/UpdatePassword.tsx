
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const UpdatePassword: React.FC = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check if user is authenticated via recovery token
  useEffect(() => {
    const checkAuthStatus = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsAuthenticated(true);
      } else {
        // If not authenticated, redirect to login
        navigate("/login", { replace: true });
      }
    };
    
    checkAuthStatus();
  }, [navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    
    try {
      const success = await updatePassword(password);
      if (success) {
        navigate("/login", { replace: true });
      }
    } catch (err: any) {
      setError(err.message || "Failed to update password");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-qualifind-blue to-qualifind-dark p-4">
        <div className="text-white">Verifying authentication...</div>
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
          <p className="text-gray-300 mt-2">Set a new password</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Update Password</CardTitle>
            <CardDescription>
              Enter and confirm your new password.
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-qualifind-blue hover:bg-qualifind-blue/90"
                disabled={loading}
              >
                {loading ? "Updating Password..." : "Update Password"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default UpdatePassword;
