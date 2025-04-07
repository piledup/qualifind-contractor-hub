
import React, { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Building, Plus, Calendar, Users, MoreHorizontal, Briefcase } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, handleSupabaseError } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import { Project } from "@/types";
import { format } from "date-fns";

// Custom hook for fetching projects
const useProjects = (userId?: string) => {
  return useQuery({
    queryKey: ['projects', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', userId);
        
      if (error) throw error;
      
      // Map from snake_case DB fields to camelCase for our Project type
      return (data || []).map(project => ({
        id: project.id,
        name: project.name,
        description: project.description || '',
        location: project.location || '',
        startDate: project.start_date ? new Date(project.start_date) : new Date(),
        endDate: project.end_date ? new Date(project.end_date) : undefined,
        budget: project.budget || undefined,
        createdBy: project.created_by,
        createdAt: new Date(project.created_at)
      })) as Project[];
    },
    enabled: !!userId
  });
};

// Custom hook for fetching project subcontractors
const useProjectSubcontractors = (projectId?: string) => {
  return useQuery({
    queryKey: ['project-subcontractors', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from('project_subcontractors')
        .select(`
          *,
          subcontractors:subcontractor_id(id, name, company_name, trade)
        `)
        .eq('project_id', projectId);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId
  });
};

const Projects: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch projects for this GC
  const { 
    data: projects = [], 
    isLoading: loadingProjects,
    error: projectsError
  } = useProjects(currentUser?.id);
  
  // Show error toast if there's an issue fetching projects
  React.useEffect(() => {
    if (projectsError) {
      toast({
        title: "Error loading projects",
        description: handleSupabaseError(projectsError),
        variant: "destructive"
      });
    }
  }, [projectsError]);
  
  // Filter projects by search query
  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(query) ||
      (project.description || '').toLowerCase().includes(query) ||
      (project.location || '').toLowerCase().includes(query)
    );
  });
  
  return (
    <MainLayout roles={["general-contractor"]}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h1 className="text-2xl font-bold">Projects</h1>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Input 
              placeholder="Search projects..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64"
            />
            <CreateProjectDialog />
          </div>
        </div>
        
        {loadingProjects ? (
          <div className="flex justify-center p-12">
            <p>Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12">
            <Building size={48} className="text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No projects found</h2>
            <p className="text-muted-foreground text-center mb-6">
              You haven't created any projects yet or your search returned no results.
            </p>
            <CreateProjectDialog />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  // Fetch subcontractors for this project
  const { data: projectSubs = [] } = useProjectSubcontractors(project.id);
  
  // Calculate total contract value
  const totalContractValue = projectSubs.reduce(
    (sum, ps) => sum + (ps.contract_amount || 0), 
    0
  );
  
  return (
    <Card className="card-hover">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{project.name}</CardTitle>
            <CardDescription className="mt-1">{project.location}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Edit Project</DropdownMenuItem>
              <DropdownMenuItem>Add Subcontractor</DropdownMenuItem>
              <DropdownMenuItem>Close Project</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar size={14} className="mr-2" />
            <span>
              Start: {project.startDate ? format(new Date(project.startDate), "MMM d, yyyy") : 'Not set'}
            </span>
          </div>
          
          <div className="flex items-center text-sm">
            <Users size={14} className="mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">
              {projectSubs.length} Subcontractors
            </span>
          </div>
          
          <div className="flex items-center text-sm">
            <Briefcase size={14} className="mr-2 text-muted-foreground" />
            <span className="text-muted-foreground">
              Total Contract Value: ${totalContractValue.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Tabs defaultValue="subcontractors" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="subcontractors">Subcontractors</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent value="subcontractors" className="mt-4">
            {projectSubs.length > 0 ? (
              <div className="max-h-40 overflow-y-auto">
                <Table>
                  <TableBody>
                    {projectSubs.map(ps => (
                      <TableRow key={ps.subcontractor_id}>
                        <TableCell className="py-2">
                          <div className="font-medium">{ps.subcontractors?.company_name}</div>
                          <div className="text-xs text-muted-foreground">{ps.subcontractors?.trade}</div>
                        </TableCell>
                        <TableCell className="text-right py-2">
                          ${ps.contract_amount?.toLocaleString() || '0'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No subcontractors assigned
              </p>
            )}
            <Button variant="outline" size="sm" className="w-full mt-4">
              <Plus size={14} className="mr-2" /> Add Subcontractor
            </Button>
          </TabsContent>
          <TabsContent value="details" className="mt-4">
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Budget:</span>
                <span className="font-medium text-right">
                  ${project.budget?.toLocaleString() || "N/A"}
                </span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Start Date:</span>
                <span className="text-right">
                  {project.startDate ? format(new Date(project.startDate), "MMM d, yyyy") : 'Not set'}
                </span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">End Date:</span>
                <span className="text-right">
                  {project.endDate ? format(new Date(project.endDate), "MMM d, yyyy") : "TBD"}
                </span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Created:</span>
                <span className="text-right">
                  {format(new Date(project.createdAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              View Full Details
            </Button>
          </TabsContent>
        </Tabs>
      </CardFooter>
    </Card>
  );
};

const CreateProjectDialog: React.FC = () => {
  const { currentUser } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [budget, setBudget] = useState("");
  const [open, setOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: {
      name: string;
      description: string;
      location: string;
      start_date: string;
      budget: string;
    }) => {
      if (!currentUser?.id) throw new Error("You must be logged in to create projects");
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          description: projectData.description,
          location: projectData.location,
          start_date: projectData.start_date,
          budget: projectData.budget ? parseFloat(projectData.budget) : null,
          created_by: currentUser.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Project created",
        description: "Your new project has been created successfully.",
      });
      
      // Reset form
      setName("");
      setDescription("");
      setLocation("");
      setStartDate("");
      setBudget("");
      setOpen(false);
      
      // Refetch projects
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any) => {
      console.error("Error creating project:", error);
      toast({
        title: "Failed to create project",
        description: handleSupabaseError(error),
        variant: "destructive"
      });
    }
  });

  const handleCreate = () => {
    if (!name) {
      toast({
        title: "Project name required",
        description: "Please enter a name for your project.",
        variant: "destructive"
      });
      return;
    }
    
    createProjectMutation.mutate({
      name,
      description,
      location,
      start_date: startDate,
      budget,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus size={16} className="mr-2" /> New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Enter the details for your new construction project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Project Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Location
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-right">
              Start Date
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="budget" className="text-right">
              Budget ($)
            </Label>
            <Input
              id="budget"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleCreate}
            disabled={createProjectMutation.isPending || !name}
          >
            {createProjectMutation.isPending ? "Creating..." : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Projects;
