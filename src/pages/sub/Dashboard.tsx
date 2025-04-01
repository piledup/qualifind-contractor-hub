
import React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, ArrowRight, Building, Briefcase, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { 
  getCurrentUser, 
  mockSubcontractors, 
  mockProjects, 
  mockProjectSubcontractors,
  mockQualificationDocuments,
  getProjectsForSubcontractor
} from "@/data/mockData";

const SubDashboard: React.FC = () => {
  const subUser = getCurrentUser("subcontractor");
  
  // Get subcontractor data for this user
  const subcontractor = mockSubcontractors.find(sub => sub.userId === subUser.id);
  
  // If no subcontractor record yet, show payment required screen
  if (!subcontractor || !subcontractor.hasPaid) {
    return <PaymentRequired />;
  }
  
  // Get projects this subcontractor is assigned to
  const subProjects = getProjectsForSubcontractor(subcontractor.id);
  
  // Get documents uploaded by this subcontractor
  const documents = mockQualificationDocuments.filter(doc => doc.subcontractorId === subcontractor.id);
  
  // Calculate total contract value
  const totalContractValue = mockProjectSubcontractors
    .filter(ps => ps.subcontractorId === subcontractor.id)
    .reduce((sum, ps) => sum + (ps.contractAmount || 0), 0);
  
  // Is qualification status valid
  const isQualified = subcontractor.qualificationStatus === "qualified";
  const isExpiring = subcontractor.submissionStatus === "expiring";
  const isExpired = subcontractor.submissionStatus === "expired";
  
  return (
    <MainLayout roles={["subcontractor"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {subUser.name}
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Qualification Status</CardTitle>
              <CardDescription>
                Your current qualification status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center py-4">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                    isQualified ? 'bg-green-100' : 'bg-amber-100'
                  }`}>
                    {isQualified ? (
                      <CheckCircle size={48} className="text-green-600" />
                    ) : (
                      <Clock size={48} className="text-amber-600" />
                    )}
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="text-lg font-semibold">
                    {isQualified ? "Qualified" : "Pending Qualification"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isQualified 
                      ? "You are qualified and ready to work on projects" 
                      : "Your qualification is being reviewed"
                    }
                  </p>
                </div>
                
                {isQualified && (
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-muted-foreground">Single Project Limit</span>
                      <span className="font-medium">
                        ${subcontractor.singleProjectLimit?.toLocaleString() || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Aggregate Limit</span>
                      <span className="font-medium">
                        ${subcontractor.aggregateLimit?.toLocaleString() || "N/A"}
                      </span>
                    </div>
                  </div>
                )}
                
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/qualification">
                    {isQualified ? "View Qualification" : "Complete Qualification"}
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
                Your assigned construction projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">{subProjects.length}</div>
                  <div className="text-sm text-muted-foreground">Active Projects</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-3 rounded-md">
                    <div className="text-xl font-semibold">
                      {subProjects.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      General Contractors
                    </div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-md">
                    <div className="text-xl font-semibold">
                      ${(totalContractValue / 1000).toFixed(1)}K
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Contract Value
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {subProjects.slice(0, 2).map(project => (
                    <div key={project.id} className="flex items-center justify-between text-sm border-b pb-2">
                      <div className="font-medium">{project.name}</div>
                      <div className="text-muted-foreground">
                        ${mockProjectSubcontractors.find(ps => 
                          ps.projectId === project.id && ps.subcontractorId === subcontractor.id
                        )?.contractAmount?.toLocaleString() || "0"}
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
              <CardTitle className="text-lg">Documents</CardTitle>
              <CardDescription>
                Your qualification documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">{documents.length}</div>
                  <div className="text-sm text-muted-foreground">Submitted Documents</div>
                </div>
                
                <div className="space-y-2">
                  {documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No documents uploaded yet.
                    </p>
                  ) : (
                    documents.slice(0, 3).map(doc => (
                      <div key={doc.id} className="flex items-center justify-between text-sm border-b pb-2">
                        <div className="font-medium truncate max-w-[150px]">
                          {doc.documentType}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {doc.uploadedAt.toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/qualification">
                    Manage Documents
                    <ArrowRight size={14} className="ml-2" />
                  </Link>
                </Button>
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
                <li className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Added to Downtown Office Tower</span>
                  <span>1w ago</span>
                </li>
                <li className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Uploaded Insurance Certificate</span>
                  <span>2w ago</span>
                </li>
                <li className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Qualified by Build Inc.</span>
                  <span>2w ago</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Completed qualification</span>
                  <span>2w ago</span>
                </li>
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
