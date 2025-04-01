
export type UserRole = 'general-contractor' | 'subcontractor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyName: string;
  companyLogo?: string;
  createdAt: Date;
  emailVerified: boolean;
  lastSignIn?: Date;
}

export type QualificationStatus = 'qualified' | 'unqualified' | 'pending';
export type SubmissionStatus = 'unsubmitted' | 'submitted' | 'expiring' | 'expired';

export interface Subcontractor {
  id: string;
  userId: string;
  name: string;
  email: string;
  companyName: string;
  companyLogo?: string;
  trade: string;
  qualificationStatus: QualificationStatus;
  submissionStatus: SubmissionStatus;
  lastSubmissionDate?: Date;
  singleProjectLimit?: number;
  aggregateLimit?: number;
  hasPaid: boolean;
  invitedBy: string; // GC's userId
  invitedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  startDate: Date;
  endDate?: Date;
  budget?: number;
  createdBy: string; // GC's userId
  createdAt: Date;
}

export interface ProjectSubcontractor {
  projectId: string;
  subcontractorId: string;
  contractAmount?: number;
  assignedAt: Date;
}

export interface QualificationDocument {
  id: string;
  subcontractorId: string;
  documentType: string;
  documentUrl: string;
  uploadedAt: Date;
  expiryDate?: Date;
}

export interface Invitation {
  id: string;
  email: string;
  generalContractorId: string;
  generalContractorName: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

export interface Permission {
  id: string;
  role: string;
  permission: string;
  createdAt: Date;
}
