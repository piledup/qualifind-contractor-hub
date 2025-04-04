
import React, { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, X, AlertCircle, Clock, ArrowRight, Building, Users, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// Types
interface ProjectSummary {
  id: string;
  name: string;
  subcontractorCount: number;
}

interface SubStats {
  totalSubs: number;
  qualifiedSubs: number;
  pendingSubmissions: number;
  expiringSoon: number;
  expired: number;
}

interface InvitationSummary {
  id: string;
  email: string;
  status: string;
}

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  
  // Fetch subcontractor statistics
  const { data: subStats, isLoading: loadingSubStats } = useQuery({
    queryKey: ['subcontractorStats', currentUser?.id],
    queryFn: async (): Promise<SubStats> => {
      if (!currentUser?.id) return { totalSubs: 0, qualifiedSubs: 0, pendingSubmissions: 0, expiringSoon: 0, expired: 0 };

      // Get all subcontractors for this GC
      const { data: subs, error } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('invited_by', currentUser.id);

      if (error) throw error;
      
      const totalSubs = subs?.length || 0;
      const qualifiedSubs = subs?.filter(sub => sub.qualification_status === 'qualified').length || 0;
      const pendingSubmissions = subs?.filter(sub => sub.submission_status === 'unsubmitted').length || 0;
      const expiringSoon = subs?.filter(sub => sub.submission_status === 'expiring').length || 0;
      const expired = subs?.filter(sub => sub.submission_status === 'expired').length || 0;
      
      return { totalSubs, qualifiedSubs, pendingSubmissions, expiringSoon, expired };
    },
    enabled: !!currentUser?.id
  });
  
  // Fetch project data
  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects', currentUser?.id],
    queryFn: async (): Promise<ProjectSummary[]> => {
      if (!currentUser?.id) return [];

      const { data, error } = await supabase
        .from('projects')
        .select('id, name, created_by')
        .eq('created_by', currentUser.id);

      if (error) throw error;
      
      // For each project, get subcontractor count
      const projectsWithCounts = await Promise.all(data.map(async (project) => {
        const { count, error: countError } = await supabase
          .from('project_subcontractors')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id);
          
        return {
          id: project.id,
          name: project.name,
          subcontractorCount: count || 0
        };
      }));
      
      return projectsWithCounts;
    },
    enabled: !!currentUser?.id
  });
  
  // Fetch pending invitations
  const { data: invitations, isLoading: loadingInvitations } = useQuery({
    queryKey: ['invitations', currentUser?.id],
    queryFn: async (): Promise<InvitationSummary[]> => {
      if (!currentUser?.id) return [];

      const { data, error } = await supabase
        .from('invitations')
        .select('id, email, status')
        .eq('general_contractor_id', currentUser.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      
      return data.map(inv => ({
        id: inv.id,
        email: inv.email,
        status: inv.status
      }));
    },
    enabled: !!currentUser?.id
  });
  
  // Calculate total contract value
  const { data: totalContractValue, isLoading: loadingContractValue } = useQuery({
    queryKey: ['contractValue', currentUser?.id],
    queryFn: async (): Promise<number> => {
      if (!currentUser?.id) return 0;

      if (!projects || projects.length === 0) return 0;
      
      const projectIds = projects.map(p => p.id);
      
      const { data, error } = await supabase
        .from('project_subcontractors')
        .select('contract_amount')
        .in('project_id', projectIds);

      if (error) throw error;
      
      return data.reduce((sum, ps) => sum + (ps.contract_amount || 0), 0);
    },
    enabled: !!currentUser?.id && !!projects
  });
  
  // Calculate stats for display
  const subCount = subStats?.totalSubs || 0;
  const totalSubs = subStats?.totalSubs || 0;
  const qualifiedSubs = subStats?.qualifiedSubs || 0;
  const pendingSubmissions = subStats?.pendingSubmissions || 0;
  const expiringSoon = subStats?.expiringSoon || 0;
  const expired = subStats?.expired || 0;
  const activeCurrent = totalSubs - expired - expiringSoon - pendingSubmissions;
  const projectCount = projects?.length || 0;
  const pendingInvitations = invitations?.length || 0;
  
  return (
    <MainLayout roles={["general-contractor"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {currentUser?.name}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Subcontractor Status</CardTitle>
              <CardDescription>
                Overview of your subcontractor qualifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Qualified</span>
                    <span className="font-medium">{qualifiedSubs}/{totalSubs}</span>
                  </div>
                  <Progress 
                    value={totalSubs ? (qualifiedSubs / totalSubs) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <AlertCircle size={14} className="text-red-500 mr-2" />
                      <span>Expired Qualifications</span>
                    </div>
                    <span className="font-medium">{expired}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Clock size={14} className="text-amber-500 mr-2" />
                      <span>Expiring Soon</span>
                    </div>
                    <span className="font-medium">{expiringSoon}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <X size={14} className="text-gray-500 mr-2" />
                      <span>Pending Submissions</span>
                    </div>
                    <span className="font-medium">{pendingSubmissions}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Check size={14} className="text-green-500 mr-2" />
                      <span>Active & Current</span>
                    </div>
                    <span className="font-medium">{activeCurrent}</span>
                  </div>
                </div>
                
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/subcontractors">
                    View All Subcontractors
                    <ArrowRight size={14} className="ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Projects</CardTitle>
              <CardDescription>
                Your active construction projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">{projectCount}</div>
                  <div className="text-sm text-muted-foreground">Active Projects</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-3 rounded-md">
                    <div className="text-xl font-semibold">
                      {subCount}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total Subcontractors
                    </div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-md">
                    <div className="text-xl font-semibold">
                      ${((totalContractValue || 0) / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Contract Value
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {projects?.slice(0, 2).map(project => (
                    <div key={project.id} className="flex items-center justify-between text-sm border-b pb-2">
                      <div className="font-medium">{project.name}</div>
                      <div className="text-muted-foreground">
                        {project.subcontractorCount} subs
                      </div>
                    </div>
                  ))}
                  
                  {projects?.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      No projects yet
                    </div>
                  )}
                </div>
                
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/projects">
                    View All Projects
                    <ArrowRight size={14} className="ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Invitations</CardTitle>
              <CardDescription>
                Qualification invitations sent to subcontractors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">{pendingInvitations}</div>
                  <div className="text-sm text-muted-foreground">Pending Invitations</div>
                </div>
                
                <div className="space-y-2">
                  {invitations?.map(invitation => (
                    <div key={invitation.id} className="flex items-center justify-between text-sm border-b pb-2">
                      <div className="font-medium truncate max-w-[150px]">
                        {invitation.email}
                      </div>
                      <div className="text-xs">
                        <span className="status-badge status-unsubmitted">
                          {invitation.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {invitations?.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-2">
                      No pending invitations
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link to="/invitations">
                      Manage Invitations
                      <ArrowRight size={14} className="ml-2" />
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="w-full">
                    <Link to="/subcontractors">
                      Invite Subcontractor
                      <ArrowRight size={14} className="ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1 md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center text-center">
                  <Link to="/projects">
                    <Building size={24} className="mb-2" />
                    <span>Create New Project</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center text-center">
                  <Link to="/subcontractors">
                    <Users size={24} className="mb-2" />
                    <span>Invite Subcontractor</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center text-center">
                  <Link to="/qualification-form">
                    <FileText size={24} className="mb-2" />
                    <span>Edit Qualification Form</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSubStats || loadingProjects || loadingInvitations ? (
                <div className="text-center py-4 text-muted-foreground">Loading activity...</div>
              ) : (
                <ul className="space-y-2 text-sm">
                  {invitations && invitations.length > 0 && (
                    <li className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Sent invitation to {invitations[0].email}</span>
                      <span>Today</span>
                    </li>
                  )}
                  {expired > 0 && (
                    <li className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">{expired} qualification(s) expired</span>
                      <span>Recently</span>
                    </li>
                  )}
                  {projects && projects.length > 0 && (
                    <li className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Created {projects[0].name} project</span>
                      <span>Recently</span>
                    </li>
                  )}
                  {totalSubs > 0 && (
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Manage {totalSubs} subcontractor(s)</span>
                      <span>Ongoing</span>
                    </li>
                  )}
                  {(invitations?.length === 0 && expired === 0 && projects?.length === 0 && totalSubs === 0) && (
                    <li className="text-center text-muted-foreground">
                      No recent activity
                    </li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
