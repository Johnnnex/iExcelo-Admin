export enum AdminModule {
  ADMIN_MANAGEMENT = "admin_management",
  EXAM_REVISION = "exam_revision",
  STUDENTS = "students",
  SPONSORS = "sponsors",
  AFFILIATES = "affiliates",
  SUBSCRIPTIONS = "subscriptions",
  TESTIMONIALS = "testimonials",
  BULK_EMAILS = "bulk_emails",
  ANALYTICS = "analytics",
  MESSAGES = "messages",
}

export interface ModulePermission {
  canRead: boolean;
  canWrite: boolean;
}

export type ModulePermissionsMap = Partial<
  Record<AdminModule, ModulePermission>
>;

export interface IAdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface IAdminProfile {
  isSuper: boolean;
  modulePermissions: ModulePermissionsMap;
}

export interface IAdminListItem {
  id: string;
  userId: string;
  isSuper: boolean;
  isActive: boolean;
  roleId: string | null;
  roleName: string | null;
  modulePermissions: ModulePermissionsMap;
  user: { email: string; firstName: string; lastName: string } | null;
  createdAt: string;
}

export interface IAdminRole {
  id: string;
  name: string;
  description: string | null;
  modules: ModulePermissionsMap;
  createdAt: string;
}

export interface IPlatformStats {
  totalUsers: number;
  userBreakdown: Array<{ name: string; value: number; fill: string }>;
  totalExamsDelta?: number | null;
  totalUsersDelta?: number | null;
  examsDelta?: number | null;
}

export interface IRegistrationPoint {
  name: string;
  Students: number;
  Sponsors: number;
  Affiliates: number;
}

// ─── Exam Revision types ───────────────────────────────────────────────────

export interface IExamType {
  id: string;
  name: string;
  description: string | null;
  minSubjectsSelectable: number;
  maxSubjectsSelectable: number;
  freeTierQuestionLimit: number;
  supportedCategories: string[];
  isActive: boolean;
  etsCount?: number;
  createdAt: string;
}

export interface ISubject {
  id: string;
  name: string;
  description: string | null;
  totalQuestions: number;
  isActive: boolean;
  etsCount?: number;
  createdAt: string;
}

export interface IExamTypeSubject {
  id: string;
  examTypeId: string;
  subjectId: string;
  isCompulsory: boolean;
  examType?: { id: string; name: string };
  subject?: { id: string; name: string };
  createdAt: string;
}

export interface IExamTypeSubjectWithStats extends IExamTypeSubject {
  questionCount: number;
  passageCount: number;
}

export interface ITopic {
  id: string;
  subjectId: string;
  name: string;
  content: string | null;
  isActive: boolean;
  subject?: { id: string; name: string };
  createdAt: string;
}

export interface IPassage {
  id: string;
  examTypeSubjectId: string;
  title: string;
  content: string;
  isActive: boolean;
  examTypeSubject?: {
    id: string;
    examType?: { name: string };
    subject?: { name: string };
  };
  createdAt: string;
}

// ─── Students ─────────────────────────────────────────────────────────────────

export interface IAdminStudentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  suspendedUntil: string | null;
  lastLogin: string | null;
}

export interface IAdminStudentListItem {
  id: string;
  userId: string;
  totalQuestionsSolved: number;
  totalCorrect: number;
  overallAccuracy: number;
  hasEverSubscribed: boolean;
  isSponsored: boolean;
  createdAt: string;
  user: IAdminStudentUser;
}

// ─── Sponsors ─────────────────────────────────────────────────────────────────

export interface IAdminSponsorUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLogin: string | null;
}

export interface IAdminSponsorListItem {
  id: string;
  userId: string;
  sponsorType: string;
  companyName: string | null;
  totalStudentsSponsored: number;
  totalAmountDonated: number;
  createdAt: string;
  user: IAdminSponsorUser;
}

// ─── Affiliates ───────────────────────────────────────────────────────────────

export interface IAdminAffiliateUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
}

export interface IAdminAffiliateListItem {
  id: string;
  userId: string;
  affiliateCode: string;
  totalReferrals: number;
  totalEarnings: number;
  pendingBalance: number;
  totalPaidOut: number;
  createdAt: string;
  user: IAdminAffiliateUser;
}

export interface IAffiliatePayout {
  id: string;
  affiliateId: string;
  amount: number;
  status: "pending" | "processing" | "completed" | "failed";
  paymentMethod: string | null;
  paymentDetails: Record<string, string> | null;
  processedAt: string | null;
  failureReason: string | null;
  createdAt: string;
  affiliate?: {
    id: string;
    affiliateCode: string;
    user: { firstName: string; lastName: string; email: string };
  };
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export interface IRegionCurrency {
  id: string;
  regionCode: string;
  regionName: string;
  currency: string;
  paymentProvider: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAdminSubscription {
  id: string;
  studentId: string;
  examTypeId: string;
  planId: string;
  sponsorId: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  amountPaid: number;
  currency: string;
  paymentProvider: string;
  autoRenew: boolean;
  cancelledAt: string | null;
  createdAt: string;
  student?: {
    user: { firstName: string; lastName: string; email: string };
  };
  sponsor?: {
    companyName: string | null;
    user: { firstName: string; lastName: string; email: string };
  } | null;
  examType?: { id: string; name: string };
  plan?: { id: string; name: string; durationDays: number };
}

export interface IPlanPrice {
  id: string;
  planId: string;
  currency: string;
  amount: number;
  isActive: boolean;
  stripePriceId: string | null;
  paystackPlanCode: string | null;
}

export interface IAdminSubscriptionPlan {
  id: string;
  examTypeId: string;
  name: string;
  description: string | null;
  durationDays: number;
  isActive: boolean;
  sortOrder: number;
  stripeProductId: string | null;
  examType?: { id: string; name: string };
  prices?: IPlanPrice[];
  createdAt: string;
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

export interface IAdminTestimonial {
  id: string;
  userId: string | null;
  name: string;
  role: string | null;
  content: string;
  rating: number;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
}

// ─── Bulk Emails ──────────────────────────────────────────────────────────────

export type CampaignTargetAudience =
  | "all"
  | "students"
  | "sponsors"
  | "affiliates";
export type CampaignStatus = "draft" | "queued" | "sent" | "failed";

export interface IAdminCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  targetAudience: CampaignTargetAudience;
  status: CampaignStatus;
  recipientCount: number;
  sentAt: string | null;
  createdAt: string;
  createdBy?: { user?: { firstName: string; lastName: string } };
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export type FlagStatus = "pending" | "reviewed" | "dismissed";

export interface IAdminMessageFlag {
  id: string;
  messageId: string;
  chatroomId: string;
  reportedByUserId: string;
  reason: string | null;
  status: FlagStatus;
  adminNotes: string | null;
  reviewedByAdminId: string | null;
  reviewedAt: string | null;
  createdAt: string;
  message?: {
    id: string;
    content: string;
    sender?: { id: string; firstName: string; lastName: string; email: string };
  };
  chatroom?: { id: string; type: string };
  reportedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export type QuestionOptionType = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export interface IQuestion {
  id: string;
  examTypeSubjectId: string;
  questionText: string;
  type: string;
  category: string;
  difficulty: string;
  marks: number;
  options: QuestionOptionType[] | null;
  correctAnswer: unknown;
  explanation: string | null;
  topicId: string | null;
  passageId: string | null;
  isActive: boolean;
  timesAttempted: number;
  timesCorrect: number;
  examTypeSubject?: {
    id: string;
    examType?: { id: string; name: string };
    subject?: { id: string; name: string };
  };
  topic?: { id: string; name: string } | null;
  createdAt: string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface IAdminKpis {
  totalCompletions: number;
  avgScore: number;
  totalRevenue: number;
  totalQuestions: number;
}

export interface IExamCompletionPoint {
  name: string;
  Completions: number;
}

export interface ISubjectPerformancePoint {
  name: string;
  Accuracy: number;
  Attempts: number;
}

export interface IQuestionDistPoint {
  name: string;
  value: number;
  fill: string;
}

export interface IRevenuePoint {
  name: string;
  Revenue: number;
  Subscriptions: number;
}

export interface IExamTypePoint {
  name: string;
  Completions: number;
  AvgScore: number;
  fill: string;
}
