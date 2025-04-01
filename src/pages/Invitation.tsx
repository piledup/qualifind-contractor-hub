
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Invitation = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // For now, we'll just validate that the invitation code exists
      // In a real application, you would verify this against your database
      if (inviteCode.trim().length < 6) {
        toast({
          title: "Invalid invitation code",
          description: "Please enter a valid invitation code.",
          variant: "destructive"
        });
        return;
      }

      // Placeholder for real verification logic
      toast({
        title: "Invitation code accepted",
        description: "You can now register with this invitation.",
      });
      
      // In a real app, you would redirect to registration with the invite code
      // navigate('/register?invite=' + inviteCode);
      
    } catch (error) {
      console.error("Error verifying invitation code:", error);
      toast({
        title: "Verification failed",
        description: "Unable to verify the invitation code. Please try again.",
        variant: "destructive"
      });
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
          <p className="text-gray-300 mt-2">Enter your invitation code</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Invitation Code</CardTitle>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Enter your invitation code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-qualifind-blue hover:bg-qualifind-blue/90"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify"}
              </Button>
              
              <p className="text-sm text-center text-gray-600">
                <Link to="/login" className="text-qualifind-orange hover:underline">
                  Back to login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Invitation;
