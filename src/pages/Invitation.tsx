
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

interface InvitationData {
  valid: boolean;
  email: string;
  general_contractor_id: string;
  general_contractor_name: string;
}

const Invitation = () => {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (inviteCode.trim().length < 6) {
        toast({
          title: "Invalid invitation code",
          description: "Please enter a valid invitation code.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Call the verify_invitation_code function with proper typing
      const { data, error } = await supabase
        .rpc('verify_invitation_code', { code_param: inviteCode.trim() });

      if (error) {
        throw error;
      }

      // Check if data exists and is an array with at least one valid entry
      if (data && Array.isArray(data) && data.length > 0 && data[0].valid) {
        const invitationData = data[0] as InvitationData;
        
        toast({
          title: "Invitation code accepted",
          description: `You have been invited by ${invitationData.general_contractor_name}.`,
        });
        
        // Store invitation data in localStorage for use during registration
        localStorage.setItem('invitationData', JSON.stringify({
          email: invitationData.email,
          generalContractorId: invitationData.general_contractor_id,
          generalContractorName: invitationData.general_contractor_name,
          code: inviteCode.trim()
        }));
        
        // Redirect to registration with pre-filled email
        navigate(`/register?email=${encodeURIComponent(invitationData.email)}&invited=true`);
      } else {
        toast({
          title: "Invalid invitation code",
          description: "This invitation code is invalid, expired, or has already been used.",
          variant: "destructive"
        });
      }
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
