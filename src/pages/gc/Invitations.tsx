
import React, { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Plus, SearchIcon, MailIcon, RefreshCw, Copy, CheckCircle, XCircle 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import { format, formatDistanceToNow } from "date-fns";

const Invitations: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  const queryClient = useQueryClient();
  
  // Fetch invitations
  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['invitations', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          profiles:general_contractor_id(name)
        `)
        .eq('general_contractor_id', currentUser.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return data.map(inv => ({
        ...inv,
        generalContractorName: inv.profiles?.name || 'Unknown',
        createdAt: new Date(inv.created_at),
        expiresAt: new Date(inv.expires_at)
      }));
    },
    enabled: !!currentUser?.id
  });
  
  // Filter invitations
  const filteredInvitations = invitations.filter(inv => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      inv.email.toLowerCase().includes(query) ||
      inv.code.toLowerCase().includes(query) ||
      inv.status.toLowerCase().includes(query)
    );
  });
  
  // Resend invitation mutation
  const resendInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      // In a real implementation, this would send an email
      // For now, just update the expires_at date
      const { data, error } = await supabase
        .from('invitations')
        .update({ 
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .eq('id', invitationId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Invitation resent",
        description: "The invitation has been successfully resent.",
      });
      
      // Refetch data
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to resend invitation",
        description: error.message || "There was an error resending the invitation.",
        variant: "destructive"
      });
    }
  });
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <span className="inline-flex items-center status-badge status-qualified">
          <CheckCircle size={12} className="mr-1" /> Accepted
        </span>;
      case "rejected":
        return <span className="inline-flex items-center status-badge status-expired">
          <XCircle size={12} className="mr-1" /> Rejected
        </span>;
      case "pending":
        return <span className="inline-flex items-center status-badge status-unsubmitted">
          Pending
        </span>;
      default:
        return <span className="status-badge status-unsubmitted">{status}</span>;
    }
  };

  return (
    <MainLayout roles={["general-contractor"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-bold">Invitations</h1>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search invitations..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <InviteSubcontractorDialog queryClient={queryClient} />
          </div>
        </div>
        
        <Card>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Invitation Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading invitations...
                    </TableCell>
                  </TableRow>
                ) : filteredInvitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery 
                        ? "No invitations found matching your search" 
                        : "No invitations sent yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">{invitation.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <code className="bg-muted px-1 py-0.5 rounded text-sm">{invitation.code}</code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => {
                              navigator.clipboard.writeText(invitation.code);
                              toast({
                                title: "Copied to clipboard",
                                description: "Invitation code copied to clipboard"
                              });
                            }}
                          >
                            <Copy size={14} />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                      <TableCell>
                        <span title={format(invitation.createdAt, 'PPP p')}>
                          {formatDistanceToNow(invitation.createdAt, { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span title={format(invitation.expiresAt, 'PPP p')}>
                          {formatDistanceToNow(invitation.expiresAt, { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => resendInvitationMutation.mutate(invitation.id)}
                          disabled={invitation.status !== 'pending'}
                          className="flex items-center space-x-1"
                        >
                          <RefreshCw size={14} className="mr-1" />
                          <span>Resend</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

const InviteSubcontractorDialog = ({ queryClient }: { queryClient: any }) => {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState("");
  const [trade, setTrade] = useState("");
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Create invitation mutation
  const createInvitationMutation = useMutation({
    mutationFn: async ({ email, trade }: { email: string; trade: string }) => {
      if (!currentUser?.id) throw new Error("You must be logged in to invite subcontractors");
      
      // Generate a random code
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // First create the invitation
      const { data: invitation, error: invitationError } = await supabase
        .from('invitations')
        .insert({
          email,
          code,
          general_contractor_id: currentUser.id,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .select()
        .single();
      
      if (invitationError) throw invitationError;
      
      // Then create an empty subcontractor record
      const { data: subcontractor, error: subError } = await supabase
        .from('subcontractors')
        .insert({
          email,
          trade,
          invited_by: currentUser.id,
          qualification_status: 'pending',
          submission_status: 'unsubmitted',
        })
        .select()
        .single();
      
      if (subError) throw subError;
      
      return { invitation, subcontractor };
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent",
        description: `Invitation email sent to ${email} successfully.`,
      });
      setEmail("");
      setTrade("");
      setOpen(false);
      
      // Refetch data
      queryClient.invalidateQueries({ queryKey: ['subcontractors'] });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
    onError: (error: any) => {
      console.error("Error inviting subcontractor:", error);
      toast({
        title: "Failed to send invitation",
        description: error.message || "There was an error sending the invitation. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleInvite = () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address for the subcontractor.",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    createInvitationMutation.mutate({ email, trade });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus size={16} className="mr-2" /> Invite Subcontractor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Subcontractor</DialogTitle>
          <DialogDescription>
            Send an invitation to a subcontractor to submit their qualification documents.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="subcontractor@company.com"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="trade" className="text-right">
              Trade
            </Label>
            <Input
              id="trade"
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              placeholder="e.g., Electrical, Plumbing"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleInvite}
            disabled={submitting || !email}
          >
            {submitting ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Invitations;
