
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
import { AlertCircle, BadgeCheck } from "lucide-react";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isAuthenticated, currentUser } = useAuth();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState<UserRole>("general-contractor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invitationData, setInvitationData] = useState<any>(null);
  
  // Parse URL query params for invitation data
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const emailParam = queryParams.get('email');
    const isInvited = queryParams.get('invited') === 'true';

    if (emailParam) {
      setEmail(emailParam);
    }

    if (isInvited) {
      const storedInvitationData = localStorage.getItem('invitationData');
      if (storedInvitationData) {
        try {
          const parsedData = JSON.parse(storedInvitationData);
          setInvitationData(parsedData);
          setRole('subcontractor'); // Invited users are always subcontractors
        } catch (e) {
          console.error("Error parsing invitation data", e);
        }
      }
    }
  }, [location.search]);
  
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
    setError("");
    
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    
    setLoading(true);
    
    try {
      // If registering with an invitation
      if (invitationData) {
        const userData = {
          email,
          password,
          name,
          companyName,
          role: 'subcontractor' as UserRole, // Force role to be subcontractor
          invitedBy: invitationData.generalContractorId,
          invitationCode: invitationData.code
        };

        const user = await register(
          userData.email, 
          userData.password, 
          userData.name, 
          userData.companyName, 
          userData.role,
          userData.invitedBy,
          userData.invitationCode
        );

        if (user) {
          localStorage.removeItem('invitationData'); // Clear invitation data
          toast({
            title: "Registration successful",
            description: "Your account has been created successfully."
          });
          navigate("/sub-dashboard");
        }
      } else {
        // Regular registration
        const user = await register(email, password, name, companyName, role);
        
        if (user) {
          toast({
            title: "Registration successful",
            description: "Your account has been created successfully."
          });
          
          if (user.role === "general-contractor") {
            navigate("/dashboard");
          } else {
            navigate("/sub-dashboard");
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account");
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
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="John Smith"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder="ABC Construction"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@company.com"
                  disabled={!!invitationData}
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
              
              {!invitationData && (
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
              )}
            </CardContent>
            
            <CardFooter className="flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-qualifind-blue hover:bg-qualifind-blue/90"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Register"}
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
        </Card>
      </div>
    </div>
  );
};

export default Register;
