import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useUsers, useUpdateUser } from "@/lib/hooks";
import { getUploadUrl } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Eye, Clock, FileText, ShieldCheck, GraduationCap, Car, Loader2, ImageOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/lib/types";

type DocType = "driver_license" | "student_id";
type DocStatus = "pending" | "approved" | "rejected" | "refused" | "none";

interface VerificationDoc {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  doc_type: DocType;
  doc_url: string;
  status: DocStatus;
  submitted_at: string;
  reviewed_at: string | null;
}

function extractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
}

// ✅ FIX: Bulletproof mapper that relies on multiple flags to correctly place the document
function buildDocsFromUsers(users: User[]): VerificationDoc[] {
  const docs: VerificationDoc[] = [];
  users.forEach(u => {
    // 1. Check for driver license
    if (u.verification_docs_url && !u.verification_docs_url.includes('student_ids')) {
      let currentStatus: DocStatus = "pending";
      if (u.is_verified_driver || u.driver_verification_status === "approved") currentStatus = "approved";
      else if (u.driver_verification_status === "rejected" || u.driver_verification_status === "refused") currentStatus = "rejected";

      docs.push({
        id: `drv-${u.id}`,
        user_id: u.id,
        user_name: `${u.first_name || 'User'} ${u.last_name || ''}`.trim(),
        user_email: u.email,
        doc_type: "driver_license",
        doc_url: u.verification_docs_url,
        status: currentStatus,
        submitted_at: u.created_at || new Date().toISOString(),
        reviewed_at: u.is_verified_driver ? u.updated_at : null,
      });
    }

    // 2. Check for student ID
    const studentUrl = u.student_id_url || (u.verification_docs_url?.includes('student_ids') ? u.verification_docs_url : null);
    if (studentUrl) {
      let currentStatus: DocStatus = "pending";
      if (u.is_student_verified || u.student_verification_status === "approved") currentStatus = "approved";
      else if (u.student_verification_status === "rejected" || u.student_verification_status === "refused") currentStatus = "rejected";

      docs.push({
        id: `stu-${u.id}`,
        user_id: u.id,
        user_name: `${u.first_name || 'User'} ${u.last_name || ''}`.trim(),
        user_email: u.email,
        doc_type: "student_id",
        doc_url: studentUrl,
        status: currentStatus,
        submitted_at: u.created_at || new Date().toISOString(),
        reviewed_at: u.is_student_verified ? u.updated_at : null,
      });
    }
  });

  // Sort docs by newest submitted first so they appear instantly at the top
  return docs.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive"; icon: React.ElementType }> = {
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  approved: { label: "Approved", variant: "default", icon: CheckCircle },
  rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
  refused: { label: "Refused", variant: "destructive", icon: XCircle },
  none: { label: "None", variant: "secondary", icon: Clock },
};

const docTypeConfig: Record<DocType, { label: string; icon: React.ElementType; folder: string }> = {
  driver_license: { label: "Driver License", icon: Car, folder: "driver_licenses" },
  student_id: { label: "Student ID", icon: GraduationCap, folder: "student_ids" },
};

export default function VerificationsPage() {
  const { data: usersData, isLoading, refetch, isRefetching } = useUsers();
  const updateUser = useUpdateUser();
  const [selectedDoc, setSelectedDoc] = useState<VerificationDoc | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const users = extractArray(usersData) as User[];
  const docs = buildDocsFromUsers(users);

  const pendingCount = docs.filter(d => d.status === "pending").length;
  const approvedCount = docs.filter(d => d.status === "approved").length;
  const rejectedCount = docs.filter(d => d.status === "rejected" || d.status === "refused").length;

  const openReview = (doc: VerificationDoc) => { setSelectedDoc(doc); setReviewOpen(true); };

  const handleApprove = () => {
    if (!selectedDoc) return;
    const field = selectedDoc.doc_type === "driver_license"
      ? { driver_verification_status: "approved", is_verified_driver: true }
      : { student_verification_status: "approved", is_student_verified: true };
    updateUser.mutate(
      { id: selectedDoc.user_id, data: field },
      { onSuccess: () => { toast.success(`${selectedDoc.user_name}'s document approved`); setReviewOpen(false); refetch(); } }
    );
  };

  const handleReject = () => {
    if (!selectedDoc) return;
    const field = selectedDoc.doc_type === "driver_license"
      ? { driver_verification_status: "rejected", is_verified_driver: false }
      : { student_verification_status: "rejected", is_student_verified: false };
    updateUser.mutate(
      { id: selectedDoc.user_id, data: field },
      { onSuccess: () => { toast.success(`${selectedDoc.user_name}'s document rejected`); setReviewOpen(false); refetch(); } }
    );
  };

  const getFilteredDocs = (status: string) => {
    let filtered = docs;
    if (status === "rejected") filtered = filtered.filter(d => d.status === "rejected" || d.status === "refused");
    else if (status !== "all") filtered = filtered.filter(d => d.status === status);
    if (filterType !== "all") filtered = filtered.filter(d => d.doc_type === filterType);
    return filtered;
  };

  const getDocImageUrl = (doc: VerificationDoc) => {
    const folder = docTypeConfig[doc.doc_type].folder;
    return getUploadUrl(doc.doc_url, folder);
  };

  if (isLoading && !isRefetching) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const DocCard = ({ doc }: { doc: VerificationDoc }) => {
    const statusCfg = statusConfig[doc.status] || statusConfig.none;
    const typeCfg = docTypeConfig[doc.doc_type];
    const StatusIcon = statusCfg.icon;
    const TypeIcon = typeCfg.icon;
    const imageUrl = getDocImageUrl(doc);
    const hasError = imageErrors[doc.id];

    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative h-48 bg-muted flex items-center justify-center border-b overflow-hidden">
          {imageUrl && !hasError ? (
            <img 
              src={imageUrl} 
              alt={`${typeCfg.label} - ${doc.user_name}`} 
              className="h-full w-full object-cover" 
              onError={() => setImageErrors(prev => ({ ...prev, [doc.id]: true }))} 
            />
          ) : (
            <div className="text-center space-y-2">
              {hasError ? <ImageOff className="h-12 w-12 text-muted-foreground mx-auto" /> : <FileText className="h-12 w-12 text-muted-foreground mx-auto" />}
              <p className="text-xs text-muted-foreground font-mono px-2 truncate max-w-full">
                {hasError ? "Image Missing/Broken" : doc.doc_url}
              </p>
            </div>
          )}
          <div className="absolute top-2 right-2"><Badge variant={statusCfg.variant} className="text-xs gap-1"><StatusIcon className="h-3 w-3" />{statusCfg.label}</Badge></div>
          <div className="absolute top-2 left-2"><Badge variant="secondary" className="text-xs gap-1"><TypeIcon className="h-3 w-3" />{typeCfg.label}</Badge></div>
        </div>
        <CardContent className="p-4 space-y-3">
          <div><p className="text-sm font-semibold">{doc.user_name}</p><p className="text-xs text-muted-foreground">{doc.user_email}</p></div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Submitted {new Date(doc.submitted_at).toLocaleDateString()}</span>
            {doc.reviewed_at && <span>Reviewed {new Date(doc.reviewed_at).toLocaleDateString()}</span>}
          </div>
          <Button size="sm" variant={doc.status === "pending" ? "default" : "outline"} className="w-full" onClick={() => openReview(doc)}>
            <Eye className="h-3.5 w-3.5 mr-1.5" />{doc.status === "pending" ? "Review" : "View Details"}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <PageHeader title="Verifications" description={`${pendingCount} pending · ${approvedCount} approved · ${rejectedCount} rejected`} />
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Document Types</SelectItem>
              <SelectItem value="driver_license">Driver License</SelectItem>
              <SelectItem value="student_id">Student ID</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* ✅ FIX: Added a manual refresh button so new uploads appear instantly */}
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
          {isRefetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5"><Clock className="h-3.5 w-3.5" /> Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="approved" className="gap-1.5"><CheckCircle className="h-3.5 w-3.5" /> Approved ({approvedCount})</TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1.5"><XCircle className="h-3.5 w-3.5" /> Rejected ({rejectedCount})</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        {["pending", "approved", "rejected", "all"].map(tab => (
          <TabsContent key={tab} value={tab}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {getFilteredDocs(tab).map(doc => <DocCard key={doc.id} doc={doc} />)}
              {getFilteredDocs(tab).length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground"><ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-40" /><p>No documents in this category</p></div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          {selectedDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Review {docTypeConfig[selectedDoc.doc_type].label}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="h-64 bg-muted rounded-lg flex items-center justify-center border overflow-hidden p-2">
                  {getDocImageUrl(selectedDoc) && !imageErrors[selectedDoc.id] ? (
                    <img 
                      src={getDocImageUrl(selectedDoc)!} 
                      alt="Document" 
                      className="h-full w-full object-contain" 
                      onError={() => setImageErrors(prev => ({ ...prev, [selectedDoc.id]: true }))} 
                    />
                  ) : (
                    <div className="text-center">
                      <ImageOff className="h-14 w-14 text-muted-foreground mx-auto" />
                      <p className="text-sm font-semibold mt-4 text-foreground">Failed to Load Image</p>
                      <p className="text-xs text-muted-foreground font-mono mt-2 px-6">{getDocImageUrl(selectedDoc) || selectedDoc.doc_url}</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-muted-foreground text-xs">User</p><p className="font-medium">{selectedDoc.user_name}</p></div>
                  <div><p className="text-muted-foreground text-xs">Email</p><p className="font-medium">{selectedDoc.user_email}</p></div>
                  <div><p className="text-muted-foreground text-xs">Document Type</p><p className="font-medium">{docTypeConfig[selectedDoc.doc_type].label}</p></div>
                  <div><p className="text-muted-foreground text-xs">Status</p><Badge variant={(statusConfig[selectedDoc.status] || statusConfig.none).variant}>{(statusConfig[selectedDoc.status] || statusConfig.none).label}</Badge></div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button className="flex-1" onClick={handleApprove} disabled={selectedDoc.status === 'approved'}><CheckCircle className="h-4 w-4 mr-1.5" /> Approve</Button>
                  <Button variant="destructive" className="flex-1" onClick={handleReject} disabled={selectedDoc.status === 'refused' || selectedDoc.status === 'rejected'}><XCircle className="h-4 w-4 mr-1.5" /> Reject</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}