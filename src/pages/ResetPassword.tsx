
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, MailCheck } from "lucide-react";

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    
    setLoading(true);
    
    try {
      const success = await resetPassword(email);
      if (success) {
        setIsSubmitted(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to send reset link");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-qualifind-blue to-qualifind-dark p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            <span className="text-qualifind-orange">QUALI</span>FIND
          </h1>
          <p className="text-gray-300 mt-2">Reset your password</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          
          {isSubmitted ? (
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
                <MailCheck size={48} className="text-green-500" />
                <h3 className="font-medium text-xl">Check your email</h3>
                <p className="text-gray-600">
                  We've sent a password reset link to {email}. The link will expire in 24 hours.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/login")}
                >
                  Return to Login
                </Button>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-md text-sm">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
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
              </CardContent>
              
              <CardFooter className="flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-qualifind-blue hover:bg-qualifind-blue/90"
                  disabled={loading}
                >
                  {loading ? "Sending Reset Link..." : "Send Reset Link"}
                </Button>
                
                <p className="text-sm text-center text-gray-600">
                  <Link to="/login" className="text-qualifind-orange hover:underline">
                    Back to login
                  </Link>
                </p>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
