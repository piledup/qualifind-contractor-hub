import React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, ArrowRight, Building, Briefcase, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const SubDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  
  // Fetch subcontractor data for this user
  const { data: subcontractor, isLoading: loadingSubcontractor } = useQuery({
    queryKey: ['subcontractor', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;
      
      const { data, error } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();
        
      if (error) throw error;
      return data;
    },
    enabled: !!currentUser?.id
  });
  
  // If no subcontractor record yet, show payment required screen
  if (loadingSubcontractor) {
    return (
      <MainLayout roles={["subcontractor"]}>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="text-lg mb-2">Loading your dashboard...</div>
            <div className="text-sm text-muted-foreground">Please wait while we fetch your information</div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (!subcontractor || !subcontractor.has_paid) {
    return <PaymentRequired />;
  }
  
  // Get projects this subcontractor is assigned to
  const { data: subProjects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['subProjects', subcontractor.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_subcontractors')
        .select(`
          project_id,
          contract_amount,
          projects(id, name, description)
        `)
        .eq('subcontractor_id', subcontractor.id);
        
      if (error) throw error;
      
      // Properly map the nested data structure to flatten it
      return data.map(item => ({
        id: item.project_id,
        name: item.projects?.name || 'Unnamed Project',
        description: item.projects?.description || '',
        contractAmount: item.contract_amount
      }));
    },
    enabled: !!subcontractor?.id
  });
  
  // Get documents uploaded by this subcontractor
  const { data: documents = [], isLoading: loadingDocuments } = useQuery({
    queryKey: ['documents', subcontractor.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qualification_documents')
        .select('*')
        .eq('subcontractor_id', subcontractor.id)
        .order('uploaded_at', { ascending: false });
        
      if (error) throw error;
      return data;
    },
    enabled: !!subcontractor?.id
  });
  
  // Calculate total contract value
  const totalContractValue = subProjects.reduce((sum, p) => sum + (p.contractAmount || 0), 0);
  
  // Is qualification status valid
  const isQualified = subcontractor.qualification_status === "qualified";
  const isExpiring = subcontractor.submission_status === "expiring";
  const isExpired = subcontractor.submission_status === "expired";
  
  return (
    <MainLayout roles={["subcontractor"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {currentUser?.name}
          </p>
        </div>
        
        {(isExpiring || isExpired) && (
          <Card className={`border-l-4 ${isExpired ? "border-l-red-500" : "border-l-amber-500"}`}>
            <CardContent className="py-4">
              <div className="flex items-start">
                {isExpired ? (
                  <AlertCircle className="text-red-500 mt-0.5 mr-4" />
                ) : (
                  <Clock className="text-amber-500 mt-0.5 mr-4" />
                )}
                <div>
                  <h3 className="font-medium">
                    {isExpired 
                      ? "Your qualification submission has expired" 
                      : "Your qualification will expire soon"
                    }
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isExpired
                      ? "Please submit updated qualification documents as soon as possible."
                      : "Please update your qualification documents within the next 30 days."
                    }
                  </p>
                  <Button asChild size="sm" className="mt-2">
                    <Link to="/qualification">Update Qualification</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1 md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center text-center">
                  <Link to="/qualification">
                    <FileText size={24} className="mb-2" />
                    <span>Update Qualification</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center text-center">
                  <Link to="/projects">
                    <Building size={24} className="mb-2" />
                    <span>View Projects</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-auto py-4 flex flex-col items-center justify-center text-center">
                  <Link to="/general-contractors">
                    <Briefcase size={24} className="mb-2" />
                    <span>General Contractors</span>
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
                {documents.length > 0 && (
                  <li className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Uploaded {documents[0].document_type}</span>
                    <span>{new Date(documents[0].uploaded_at).toLocaleDateString()}</span>
                  </li>
                )}
                
                {subProjects.length > 0 && (
                  <li className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Added to {subProjects[0].name}</span>
                    <span>Recently</span>
                  </li>
                )}
                
                {isQualified && (
                  <li className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Qualified by {currentUser?.name}</span>
                    <span>Recently</span>
                  </li>
                )}
                
                <li className="flex justify-between">
                  <span className="text-muted-foreground">{documents.length > 0 ? "Updated" : "Created"} profile</span>
                  <span>Recently</span>
                </li>
                
                {documents.length === 0 && subProjects.length === 0 && !isQualified && (
                  <li className="text-center text-muted-foreground">
                    No recent activity
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

const PaymentRequired: React.FC = () => {
  return (
    <MainLayout roles={["subcontractor"]}>
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Payment Required</CardTitle>
            <CardDescription>
              To complete your qualification and work with general contractors, a payment is required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-md">
              <h3 className="font-semibold text-lg">Qualification Fee</h3>
              <p className="text-sm text-muted-foreground mb-2">
                This one-time fee allows you to qualify with any general contractor that has invited you.
              </p>
              <div className="text-2xl font-bold">$99.00</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <CheckCircle size={16} className="text-green-600 mr-2" />
                <span className="text-sm">Access to qualification platform</span>
              </div>
              <div className="flex items-center">
                <CheckCircle size={16} className="text-green-600 mr-2" />
                <span className="text-sm">Document management system</span>
              </div>
              <div className="flex items-center">
                <CheckCircle size={16} className="text-green-600 mr-2" />
                <span className="text-sm">Unlimited document uploads</span>
              </div>
              <div className="flex items-center">
                <CheckCircle size={16} className="text-green-600 mr-2" />
                <span className="text-sm">Project tracking</span>
              </div>
            </div>
            
            <Button className="w-full">
              Pay & Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default SubDashboard;
