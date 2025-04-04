
import React, { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Filter, Plus, MoreHorizontal, CheckCircle, XCircle } from "lucide-react";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, handleSupabaseError } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import { SubmissionStatus, QualificationStatus } from "@/types";

// Custom hook for fetching subcontractors
const useSubcontractors = (currentUserId?: string) => {
  return useQuery({
    queryKey: ['subcontractors', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return [];
      
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('invited_by', currentUserId);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUserId
  });
};

// Custom hook for fetching unique trades
const useTrades = (subcontractors: any[]) => {
  return useQuery({
    queryKey: ['trades', subcontractors?.length],
    queryFn: async () => {
      if (!subcontractors || subcontractors.length === 0) return [];
      
      const uniqueTrades = [...new Set(subcontractors.map(sub => sub.trade))];
      return uniqueTrades.filter(Boolean);
    },
    enabled: !!subcontractors && subcontractors.length > 0
  });
};

// Custom hook for fetching projects
const useProjects = (currentUserId?: string) => {
  return useQuery({
    queryKey: ['projects', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return [];
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('created_by', currentUserId);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUserId
  });
};

const Subcontractors: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [tradeFilter, setTradeFilter] = useState<string | null>(null);
  const [submissionFilter, setSubmissionFilter] = useState<SubmissionStatus | null>(null);
  const [qualificationFilter, setQualificationFilter] = useState<QualificationStatus | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Fetch subcontractors using the custom hook
  const { 
    data: subcontractors = [], 
    isLoading: loadingSubcontractors,
    error: subcontractorsError
  } = useSubcontractors(currentUser?.id);
  
  // Fetch unique trades for filter using the custom hook
  const { data: trades = [] } = useTrades(subcontractors);
  
  // Fetch projects for filter using the custom hook
  const { data: projects = [] } = useProjects(currentUser?.id);
  
  // Show error toast if there's an issue fetching subcontractors
  React.useEffect(() => {
    if (subcontractorsError) {
      toast({
        title: "Error loading subcontractors",
        description: handleSupabaseError(subcontractorsError),
        variant: "destructive"
      });
    }
  }, [subcontractorsError]);
  
  // Filter subcontractors
  const filteredSubcontractors = subcontractors
    .filter(sub => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        (sub.name || '').toLowerCase().includes(query) ||
        (sub.company_name || '').toLowerCase().includes(query) ||
        sub.email.toLowerCase().includes(query) ||
        (sub.trade || '').toLowerCase().includes(query)
      );
    })
    .filter(sub => !tradeFilter || sub.trade === tradeFilter)
    .filter(sub => !submissionFilter || sub.submission_status === submissionFilter)
    .filter(sub => !qualificationFilter || sub.qualification_status === qualificationFilter);
  
  const getStatusBadgeClass = (status: SubmissionStatus) => {
    switch (status) {
      case "unsubmitted": return "status-badge status-unsubmitted";
      case "submitted": return "status-badge status-submitted";
      case "expiring": return "status-badge status-expiring";
      case "expired": return "status-badge status-expired";
      default: return "status-badge status-unsubmitted";
    }
  };
  
  const getQualificationBadge = (status: QualificationStatus) => {
    switch (status) {
      case "qualified": 
        return <span className="inline-flex items-center status-badge status-qualified">
          <CheckCircle size={12} className="mr-1" /> Qualified
        </span>;
      case "unqualified": 
        return <span className="inline-flex items-center status-badge status-expired">
          <XCircle size={12} className="mr-1" /> Unqualified
        </span>;
      case "pending": 
        return <span className="inline-flex items-center status-badge status-unsubmitted">
          Pending
        </span>;
      default: return <span className="status-badge status-unsubmitted">Pending</span>;
    }
  };

  return (
    <MainLayout roles={["general-contractor"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-bold">Subcontractors</h1>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Input 
              placeholder="Search subcontractors..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64"
            />
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-muted" : ""}
            >
              <Filter size={18} />
            </Button>
            <InviteSubcontractorDialog queryClient={queryClient} />
          </div>
        </div>
        
        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Filter by Trade</Label>
                <Select 
                  value={tradeFilter || ""} 
                  onValueChange={(val) => setTradeFilter(val || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Trades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Trades</SelectItem>
                    {trades.map(trade => (
                      <SelectItem key={trade} value={trade}>{trade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Submission Status</Label>
                <Select 
                  value={submissionFilter || ""} 
                  onValueChange={(val: any) => setSubmissionFilter(val || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="unsubmitted">Unsubmitted</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="expiring">Expiring Soon</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Qualification Status</Label>
                <Select 
                  value={qualificationFilter || ""} 
                  onValueChange={(val: any) => setQualificationFilter(val || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Qualifications" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Qualifications</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="unqualified">Unqualified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Project</Label>
                <Select 
                  value={projectFilter || ""} 
                  onValueChange={(val) => setProjectFilter(val || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Projects</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setTradeFilter(null);
                  setSubmissionFilter(null);
                  setQualificationFilter(null);
                  setProjectFilter(null);
                }}
                size="sm"
              >
                Clear Filters
              </Button>
            </div>
          </Card>
        )}
        
        <Card>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Trade</TableHead>
                  <TableHead>Submission Status</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>Limits</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingSubcontractors ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading subcontractors...
                    </TableCell>
                  </TableRow>
                ) : filteredSubcontractors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No subcontractors found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubcontractors.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div>{sub.company_name || sub.email}</div>
                          <div className="text-xs text-muted-foreground">{sub.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{sub.trade}</TableCell>
                      <TableCell>
                        <span className={getStatusBadgeClass(sub.submission_status as SubmissionStatus)}>
                          {sub.submission_status?.charAt(0).toUpperCase() + sub.submission_status?.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>{getQualificationBadge(sub.qualification_status as QualificationStatus)}</TableCell>
                      <TableCell>
                        {sub.qualification_status === "qualified" ? (
                          <div className="text-sm">
                            <div>Single: ${sub.single_project_limit?.toLocaleString()}</div>
                            <div>Aggregate: ${sub.aggregate_limit?.toLocaleString()}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <SubcontractorActions subcontractor={sub} />
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

const SubcontractorActions = ({ subcontractor }: { subcontractor: any }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>View Details</DropdownMenuItem>
        <DropdownMenuItem>Update Qualification</DropdownMenuItem>
        <DropdownMenuItem>Add to Project</DropdownMenuItem>
        <DropdownMenuItem>Send Reminder</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const InviteSubcontractorDialog = ({ queryClient }: { queryClient: any }) => {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState("");
  const [trade, setTrade] = useState("");
  const [open, setOpen] = useState(false);

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
        description: handleSupabaseError(error),
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
            disabled={createInvitationMutation.isPending || !email}
          >
            {createInvitationMutation.isPending ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Subcontractors;
