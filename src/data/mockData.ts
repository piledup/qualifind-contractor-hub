import { User, Subcontractor, Project, ProjectSubcontractor, QualificationDocument, Invitation, UserRole } from "../types";

// Helper function to create a date with offset in days from today
const dateWithOffset = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

// Mock Users
export const mockUsers: User[] = [
  {
    id: "gc-1",
    email: "john@buildinc.com",
    name: "John Builder",
    role: "general-contractor",
    companyName: "Build Inc.",
    createdAt: new Date("2023-01-15"),
    emailVerified: true
  },
  {
    id: "gc-2",
    email: "jane@constructpro.com",
    name: "Jane Constructor",
    role: "general-contractor",
    companyName: "Construct Pro",
    createdAt: new Date("2023-02-10"),
    emailVerified: true
  },
  {
    id: "sub-1",
    email: "mike@electricpros.com",
    name: "Mike Electric",
    role: "subcontractor",
    companyName: "Electric Pros",
    createdAt: new Date("2023-03-05"),
    emailVerified: true
  },
  {
    id: "sub-2",
    email: "sarah@plumbingexperts.com",
    name: "Sarah Plumber",
    role: "subcontractor",
    companyName: "Plumbing Experts",
    createdAt: new Date("2023-03-15"),
    emailVerified: true
  },
  {
    id: "sub-3",
    email: "dave@roofmasters.com",
    name: "Dave Roofer",
    role: "subcontractor",
    companyName: "Roof Masters",
    createdAt: new Date("2023-04-20"),
    emailVerified: false
  }
];

// Mock Subcontractors
export const mockSubcontractors: Subcontractor[] = [
  {
    id: "sub-1",
    userId: "sub-1",
    name: "Mike Electric",
    email: "mike@electricpros.com",
    companyName: "Electric Pros",
    trade: "Electrical",
    qualificationStatus: "qualified",
    submissionStatus: "submitted",
    lastSubmissionDate: new Date("2023-09-15"),
    singleProjectLimit: 100000,
    aggregateLimit: 500000,
    hasPaid: true,
    invitedBy: "gc-1",
    invitedAt: new Date("2023-06-10")
  },
  {
    id: "sub-2",
    userId: "sub-2",
    name: "Sarah Plumber",
    email: "sarah@plumbingexperts.com",
    companyName: "Plumbing Experts",
    trade: "Plumbing",
    qualificationStatus: "qualified",
    submissionStatus: "expiring",
    lastSubmissionDate: new Date("2023-06-20"),
    singleProjectLimit: 75000,
    aggregateLimit: 300000,
    hasPaid: true,
    invitedBy: "gc-1",
    invitedAt: new Date("2023-05-15")
  },
  {
    id: "sub-3",
    userId: "sub-3",
    name: "Dave Roofer",
    email: "dave@roofmasters.com",
    companyName: "Roof Masters",
    trade: "Roofing",
    qualificationStatus: "unqualified",
    submissionStatus: "expired",
    lastSubmissionDate: new Date("2022-06-01"),
    hasPaid: true,
    invitedBy: "gc-1",
    invitedAt: new Date("2022-05-01")
  },
  {
    id: "sub-4",
    userId: "",
    name: "",
    email: "lisa@hvactech.com",
    companyName: "",
    trade: "HVAC",
    qualificationStatus: "pending",
    submissionStatus: "unsubmitted",
    hasPaid: false,
    invitedBy: "gc-1",
    invitedAt: new Date("2023-10-01")
  }
];

// Mock Projects
export const mockProjects: Project[] = [
  {
    id: "proj-1",
    name: "Downtown Office Tower",
    description: "15-story office building in downtown area",
    location: "123 Main St, Downtown",
    startDate: new Date("2023-10-15"),
    budget: 15000000,
    createdBy: "gc-1",
    createdAt: new Date("2023-08-01")
  },
  {
    id: "proj-2",
    name: "Riverside Apartments",
    description: "Luxury apartment complex with 50 units",
    location: "456 River Rd",
    startDate: new Date("2023-11-01"),
    budget: 8000000,
    createdBy: "gc-1",
    createdAt: new Date("2023-07-15")
  },
  {
    id: "proj-3",
    name: "Community Hospital Expansion",
    description: "New wing for the community hospital",
    location: "789 Health Ave",
    startDate: new Date("2024-01-10"),
    budget: 25000000,
    createdBy: "gc-1",
    createdAt: new Date("2023-09-01")
  }
];

// Mock Project-Subcontractor relationships
export const mockProjectSubcontractors: ProjectSubcontractor[] = [
  {
    projectId: "proj-1",
    subcontractorId: "sub-1",
    contractAmount: 750000,
    assignedAt: new Date("2023-08-15")
  },
  {
    projectId: "proj-1",
    subcontractorId: "sub-2",
    contractAmount: 500000,
    assignedAt: new Date("2023-08-20")
  },
  {
    projectId: "proj-2",
    subcontractorId: "sub-1",
    contractAmount: 400000,
    assignedAt: new Date("2023-09-01")
  },
  {
    projectId: "proj-3",
    subcontractorId: "sub-2",
    contractAmount: 600000,
    assignedAt: new Date("2023-09-15")
  }
];

// Mock Qualification Documents
export const mockQualificationDocuments: QualificationDocument[] = [
  {
    id: "doc-1",
    subcontractorId: "sub-1",
    documentType: "Insurance Certificate",
    documentUrl: "https://example.com/docs/insurance1.pdf",
    uploadedAt: new Date("2023-09-15"),
    expiryDate: new Date("2024-09-15")
  },
  {
    id: "doc-2",
    subcontractorId: "sub-1",
    documentType: "License",
    documentUrl: "https://example.com/docs/license1.pdf",
    uploadedAt: new Date("2023-09-15"),
  },
  {
    id: "doc-3",
    subcontractorId: "sub-2",
    documentType: "Insurance Certificate",
    documentUrl: "https://example.com/docs/insurance2.pdf",
    uploadedAt: new Date("2023-06-20"),
    expiryDate: new Date("2024-06-20")
  }
];

// Mock Invitations
export const mockInvitations: Invitation[] = [
  {
    id: "inv-1",
    email: "lisa@hvactech.com",
    generalContractorId: "gc-1",
    generalContractorName: "Build Inc.",
    token: "abc123",
    status: "pending",
    createdAt: new Date("2023-10-01"),
    expiresAt: dateWithOffset(7)
  },
  {
    id: "inv-2",
    email: "mark@masonry.com",
    generalContractorId: "gc-1",
    generalContractorName: "Build Inc.",
    token: "def456",
    status: "pending",
    createdAt: new Date("2023-10-05"),
    expiresAt: dateWithOffset(7)
  }
];

// Helper functions for data manipulation
export const getCurrentUser = (role: UserRole = "general-contractor") => {
  return role === "general-contractor" ? mockUsers[0] : mockUsers[2];
};

export const getSubcontractorsForGC = (gcId: string) => {
  return mockSubcontractors.filter(sub => sub.invitedBy === gcId);
};

export const getProjectsForGC = (gcId: string) => {
  return mockProjects.filter(project => project.createdBy === gcId);
};

export const getProjectsForSubcontractor = (subId: string) => {
  const projectIds = mockProjectSubcontractors
    .filter(ps => ps.subcontractorId === subId)
    .map(ps => ps.projectId);
  
  return mockProjects.filter(project => projectIds.includes(project.id));
};

export const getDocumentsForSubcontractor = (subId: string) => {
  return mockQualificationDocuments.filter(doc => doc.subcontractorId === subId);
};

export const getInvitationsForGC = (gcId: string) => {
  return mockInvitations.filter(inv => inv.generalContractorId === gcId);
};
