
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

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, currentUser } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("general-contractor");
  const [loading, setLoading] = useState(false);
  
  // Redirect if already authenticated
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
    
    try {
      const user = await login(email, password, role);
      if (user) {
        toast({
          title: "Login successful",
          description: `Welcome back, ${user.name}!`
        });
        
        if (user.role === "general-contractor") {
          navigate("/dashboard");
        } else {
          navigate("/sub-dashboard");
        }
      }
    } catch (err) {
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
          <p className="text-gray-300 mt-2">Sign in to your account</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
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
                {loading ? "Logging in..." : "Sign In"}
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
