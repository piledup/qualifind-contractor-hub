
import React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, X, AlertCircle, Clock, ArrowRight, Building, Users, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { 
  getCurrentUser, 
  mockSubcontractors, 
  mockProjects, 
  mockProjectSubcontractors, 
  mockInvitations 
} from "@/data/mockData";

const Dashboard: React.FC = () => {
  const gcUser = getCurrentUser("general-contractor");
  
  // Get data for this GC
  const subcontractors = mockSubcontractors.filter(sub => sub.invitedBy === gcUser.id);
  const projects = mockProjects.filter(project => project.createdBy === gcUser.id);
  const invitations = mockInvitations.filter(inv => inv.generalContractorId === gcUser.id);
  
  // Calculate statistics
  const totalSubs = subcontractors.length;
  const qualifiedSubs = subcontractors.filter(sub => sub.qualificationStatus === "qualified").length;
  const pendingSubmissions = subcontractors.filter(sub => sub.submissionStatus === "unsubmitted").length;
  const expiringSoon = subcontractors.filter(sub => sub.submissionStatus === "expiring").length;
  const expired = subcontractors.filter(sub => sub.submissionStatus === "expired").length;
  
  // Calculate total contract value
  const totalContractValue = mockProjectSubcontractors
    .filter(ps => {
      const project = projects.find(p => p.id === ps.projectId);
      return !!project;
    })
    .reduce((sum, ps) => sum + (ps.contractAmount || 0), 0);
  
  return (
    <MainLayout roles={["general-contractor"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {gcUser.name}
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
                    <span className="font-medium">
                      {totalSubs - expired - expiringSoon - pendingSubmissions}
                    </span>
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
                  <div className="text-3xl font-bold">{projects.length}</div>
                  <div className="text-sm text-muted-foreground">Active Projects</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-3 rounded-md">
                    <div className="text-xl font-semibold">
                      {totalSubs}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total Subcontractors
                    </div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-md">
                    <div className="text-xl font-semibold">
                      ${(totalContractValue / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Contract Value
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {projects.slice(0, 2).map(project => (
                    <div key={project.id} className="flex items-center justify-between text-sm border-b pb-2">
                      <div className="font-medium">{project.name}</div>
                      <div className="text-muted-foreground">
                        {mockProjectSubcontractors.filter(ps => ps.projectId === project.id).length} subs
                      </div>
                    </div>
                  ))}
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
                  <div className="text-3xl font-bold">{invitations.filter(inv => inv.status === "pending").length}</div>
                  <div className="text-sm text-muted-foreground">Pending Invitations</div>
                </div>
                
                <div className="space-y-2">
                  {invitations.slice(0, 3).map(invitation => (
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
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">New submission from Electric Pros</span>
                  <span>Today</span>
                </li>
                <li className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Plumbing Experts qualification expiring</span>
                  <span>2d ago</span>
                </li>
                <li className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Added Roof Masters to Downtown project</span>
                  <span>3d ago</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Created Riverside Apartments project</span>
                  <span>1w ago</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
