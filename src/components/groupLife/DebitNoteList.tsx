// @ts-nocheck
// components/groupLife/DebitNoteList.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchDebitNotes,
  loadDebitNote,
  approveDebitNote,
  refreshDebitNote,
  selectDebitNote,
  clearDebitNoteErrors,
} from '../../features/reducers/groupLifeReducers/groupLifeQuotationSlice';
import { Button } from '../UI/new-button';
import { toast } from 'sonner';
import { 
  FileText, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Layers,
  RefreshCw,
  Eye,
  Check,
  Loader2,
  Plus,
  ArrowLeft,
  FileSpreadsheet,
  FilePlus,
  Edit,
  Trash2,
  Receipt,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users as UsersIcon,
  Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../UI/table";
import { formatDate, formatCurrency } from "../../utils/ui-utilities";
import { Card, CardContent } from "../UI/card";
import { Checkbox } from "../UI/checkbox";
import { Badge } from "../UI/badge";

interface DebitNoteListProps {
  policyNo?: string;
  onSelectDebitNote?: (note: any) => void;
  onNewDebitNote?: () => void;
  showNewButton?: boolean;
  backPath?: string;
  /** When true, clicking "New Debit Note" navigates to the form instead of using callback */
  standalone?: boolean;
}

const DebitNoteList = ({ 
  policyNo, 
  onSelectDebitNote, 
  onNewDebitNote,
  showNewButton = true,
  backPath,
  standalone = false
}: DebitNoteListProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Use the selector from the slice
  const {
    debitNoteList,
    debitNoteListTotalCount,
    debitNoteListTotalPages,
    loading,
    error
  } = useSelector(selectDebitNote);

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 10,
    status: undefined as number | undefined,
    fromDate: '',
    toDate: '',
    pendingOnly: undefined as boolean | undefined,
    headNotesOnly: true,
    search: '',
  });
  
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // State for checkbox selection
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [isApprovingMultiple, setIsApprovingMultiple] = useState(false);
  
  // ✅ Stats state
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalGrossPremium: 0,
    totalNetPremium: 0,
  });

  // Use refs to prevent infinite loops
  const hasFetchedRef = useRef(false);
  const policyNoRef = useRef(policyNo);

  // Update ref when policyNo changes
  useEffect(() => {
    if (policyNo !== policyNoRef.current) {
      policyNoRef.current = policyNo;
      hasFetchedRef.current = false;
      // Reset filters when policy changes
      setFilters({
        page: 1,
        pageSize: 10,
        status: undefined,
        fromDate: '',
        toDate: '',
        pendingOnly: undefined,
        headNotesOnly: true,
        search: '',
      });
      setLocalError(null);
      setSelectedNotes(new Set());
      // Reset stats
      setStats({
        total: 0,
        draft: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        totalGrossPremium: 0,
        totalNetPremium: 0,
      });
    }
  }, [policyNo]);

  // Fetch debit notes list
  const fetchDebitNotesList = async () => {
    if (!policyNo) {
      return;
    }

    setLocalError(null);
    try {
      const result = await dispatch(fetchDebitNotes({
        policyNo: policyNo,
        page: filters.page,
        pageSize: filters.pageSize,
        approval: filters.status,
        billingFrom: filters.fromDate || undefined,
        billingTo: filters.toDate || undefined,
        pendingOnly: filters.pendingOnly,
        headNotesOnly: filters.headNotesOnly,
        search: filters.search || undefined,
      })).unwrap();
      
      // ✅ Update stats from the fetched data
      if (result?.items) {
        calculateStats(result.items);
      }
      
    } catch (error: any) {
      console.error('Failed to fetch debit notes:', error);
      setLocalError(error?.message || 'Failed to fetch debit notes');
      if (error?.message?.includes('CORS')) {
        console.warn('CORS error - API may not be accessible from localhost');
      }
      if (!error?.message?.includes('405')) {
        toast.error(error?.message || 'Failed to fetch debit notes');
      }
    }
  };

  // ✅ Calculate stats from the data
  const calculateStats = (items: any[]) => {
    let draft = 0, pending = 0, approved = 0, rejected = 0;
    let totalGrossPremium = 0, totalNetPremium = 0;

    items.forEach((note: any) => {
      const approvalStatus = note.approval !== undefined ? note.approval : 
                            (note.approvalStatus === 'Approved' ? 2 : 1);
      
      switch (approvalStatus) {
        case 0: draft++; break;
        case 1: pending++; break;
        case 2: approved++; break;
        case 3: rejected++; break;
        default: pending++;
      }

      totalGrossPremium += (note.grossPremium || note.premium?.grossPremium || 0);
      totalNetPremium += (note.premium?.netPremium || note.netPremium || note.netAmount || 0);
    });

    setStats({
      total: items.length,
      draft,
      pending,
      approved,
      rejected,
      totalGrossPremium,
      totalNetPremium,
    });
  };

  useEffect(() => {
    if (policyNo) {
      fetchDebitNotesList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policyNo, filters.page, filters.pageSize, filters.status, 
      filters.pendingOnly, filters.headNotesOnly, filters.search]);

  // Load a specific debit note for viewing
  const handleLoadDebitNote = async (dncnNo: string) => {
    if (!dncnNo) {
      toast.error('Debit note number is missing');
      return;
    }

    try {
      const result = await dispatch(loadDebitNote({ 
        dncnNo 
      })).unwrap();
      
      setSelectedNote(result);
      setExpandedNote(dncnNo);
      
      if (onSelectDebitNote) {
        onSelectDebitNote(result);
      }
      
      toast.success(`Debit note ${dncnNo} loaded successfully`);
    } catch (error: any) {
      console.error('Failed to load debit note:', error);
      toast.error(error?.message || 'Failed to load debit note');
    }
  };

  // Refresh a debit note
  const handleRefreshDebitNote = async (dncnNo: string) => {
    if (!dncnNo) return;
    
    setRefreshing(dncnNo);
    try {
      const result = await dispatch(refreshDebitNote({ 
        dncnNo 
      })).unwrap();
      
      toast.success(`Debit note ${dncnNo} refreshed successfully`);
      await fetchDebitNotesList();
    } catch (error: any) {
      console.error('Failed to refresh debit note:', error);
      toast.error(error?.message || 'Failed to refresh debit note');
    } finally {
      setRefreshing(null);
    }
  };

  // Approve a single debit note
  const handleApproveDebitNote = async (dncnNo: string) => {
    if (!dncnNo) return;
    
    setApproving(dncnNo);
    try {
      const result = await dispatch(approveDebitNote({
        dncnNo,
        approvalStatus: 2
      })).unwrap();
      
      toast.success(`✅ Debit note ${dncnNo} approved successfully! New number: ${result.debitNoteNo}`);
      await fetchDebitNotesList();
      setSelectedNotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(dncnNo);
        return newSet;
      });
    } catch (error: any) {
      console.error('Failed to approve debit note:', error);
      toast.error(error?.message || 'Failed to approve debit note');
    } finally {
      setApproving(null);
    }
  };

  // Approve multiple selected debit notes
  const handleApproveSelected = async () => {
    if (selectedNotes.size === 0) {
      toast.error('Please select at least one debit note to approve');
      return;
    }

    const notesToApprove = Array.from(selectedNotes).filter(dncnNo => {
      const note = debitNoteList.find((n: any) => (n.debitNoteNo || n.dncnNo) === dncnNo);
      return note && note.approval !== 2;
    });

    if (notesToApprove.length === 0) {
      toast.error('Selected notes are already approved');
      return;
    }

    setIsApprovingMultiple(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const dncnNo of notesToApprove) {
        try {
          const result = await dispatch(approveDebitNote({
            dncnNo,
            approvalStatus: 2
          })).unwrap();
          successCount++;
          setSelectedNotes(prev => {
            const newSet = new Set(prev);
            newSet.delete(dncnNo);
            return newSet;
          });
        } catch (error: any) {
          console.error(`Failed to approve ${dncnNo}:`, error);
          failCount++;
        }
      }

      if (successCount > 0 && failCount === 0) {
        toast.success(`✅ ${successCount} debit note(s) approved successfully!`);
      } else if (successCount > 0 && failCount > 0) {
        toast.warning(`⚠️ ${successCount} approved, ${failCount} failed`);
      } else {
        toast.error('❌ Failed to approve selected notes');
      }

      await fetchDebitNotesList();
    } catch (error: any) {
      console.error('Batch approval error:', error);
      toast.error(error?.message || 'Failed to approve selected notes');
    } finally {
      setIsApprovingMultiple(false);
    }
  };

  // Handle individual checkbox toggle
  const handleToggleSelect = (dncnNo: string) => {
    setSelectedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dncnNo)) {
        newSet.delete(dncnNo);
      } else {
        newSet.add(dncnNo);
      }
      return newSet;
    });
  };

  // Handle select all / deselect all
  const handleSelectAll = () => {
    if (selectedNotes.size === debitNoteList.length) {
      setSelectedNotes(new Set());
    } else {
      const allIds = debitNoteList.map((note: any) => note.debitNoteNo || note.dncnNo || note.id);
      setSelectedNotes(new Set(allIds));
    }
  };

  // Handle Do CoInsurance Note
  const handleDoCoinsuranceNote = () => {
    const selectedList = debitNoteList.filter((note: any) => {
      const dncnNo = note.debitNoteNo || note.dncnNo || note.id;
      return selectedNotes.has(dncnNo);
    });
    console.log("Do CoInsurance Note clicked for notes:", selectedList.length > 0 ? selectedList : debitNoteList);
    toast.info(selectedNotes.size > 0
      ? `Do CoInsurance Note triggered for ${selectedNotes.size} selected note(s). API will be connected shortly.`
      : `Do CoInsurance Note triggered for policy ${policyNo}. API will be connected shortly.`);
  };

  // Handle Print Policy Document
  const handlePrintPolicyDocument = () => {
    const selectedList = debitNoteList.filter((note: any) => {
      const dncnNo = note.debitNoteNo || note.dncnNo || note.id;
      return selectedNotes.has(dncnNo);
    });
    console.log("Print Policy Document clicked for notes:", selectedList.length > 0 ? selectedList : debitNoteList);
    toast.info(selectedNotes.size > 0
      ? `Print Policy Document triggered for ${selectedNotes.size} selected note(s). API will be connected shortly.`
      : `Print Policy Document triggered for policy ${policyNo}. API will be connected shortly.`);
  };

  // Handle download
  const handleDownloadDebitNote = async (dncnNo: string) => {
    if (!dncnNo) {
      toast.error('Debit note number is missing');
      return;
    }

    try {
      const note = await dispatch(loadDebitNote({ dncnNo })).unwrap();
      
      const content = generateDebitNoteContent(note);
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DebitNote_${dncnNo}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Debit note ${dncnNo} downloaded successfully`);
    } catch (error: any) {
      console.error('Download failed:', error);
      toast.error(error?.message || 'Failed to download debit note');
    }
  };

  // Generate text content for debit note
  const generateDebitNoteContent = (note: any): string => {
    const lines = [
      '='.repeat(60),
      '                   DEBIT NOTE',
      '='.repeat(60),
      `Debit Note No: ${note.debitNoteNo}`,
      `Policy No: ${note.policyNo}`,
      `Insured: ${note.insuredName}`,
      `Branch: ${note.branchId}`,
      `Billing Date: ${formatDate(note.billingDate)}`,
      `Start Date: ${formatDate(note.startDate)}`,
      `End Date: ${formatDate(note.endDate)}`,
      '-'.repeat(60),
      `Sum Insured: ${formatCurrency(note.sumInsured)}`,
      `Gross Premium: ${formatCurrency(note.grossPremium)}`,
      `Our Share: ${note.ourSharePercent}%`,
      '-'.repeat(60),
      'Premium Details:',
      `  Gross Premium: ${formatCurrency(note.premium?.grossPremium)}`,
      `  Commission Rate: ${note.premium?.commissionRate || 0}%`,
      `  Commission Amount: ${formatCurrency(note.premium?.commissionAmount)}`,
      `  WHT Rate: ${note.premium?.whtRate || 0}%`,
      `  WHT Amount: ${formatCurrency(note.premium?.whtAmount)}`,
      `  ORC Rate: ${note.premium?.orcRate || 0}%`,
      `  ORC Amount: ${formatCurrency(note.premium?.orcAmount)}`,
      `  Net Premium: ${formatCurrency(note.premium?.netPremium)}`,
      '-'.repeat(60),
      'Co-insurance Participants:',
      ...(note.coinsuranceLines || []).map((line: any) => 
        `  ${line.participantName} (${line.sharePercent}%) - ${formatCurrency(line.sharePremium)}`
      ),
      '-'.repeat(60),
      `Status: ${getStatusLabel(note.approval)}`,
      `Submitted By: ${note.submittedBy}`,
      `Submitted On: ${formatDate(note.submittedOn)}`,
      '='.repeat(60),
    ];
    return lines.join('\n');
  };

  const getStatusLabel = (status: number): string => {
    const statusMap: Record<number, string> = {
      0: 'Draft',
      1: 'Pending',
      2: 'Approved',
      3: 'Rejected',
    };
    return statusMap[status] || 'Unknown';
  };

  const getStatusColor = (approval: number): string => {
    switch (approval) {
      case 0: return "bg-gray-100 text-gray-800";
      case 1: return "bg-yellow-100 text-yellow-800";
      case 2: return "bg-green-100 text-green-800";
      case 3: return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (approval: number) => {
    switch (approval) {
      case 0: return <Clock className="w-4 h-4 text-gray-500" />;
      case 1: return <Clock className="w-4 h-4 text-yellow-500" />;
      case 2: return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 3: return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // Handle new debit note creation
  const handleNewDebitNote = () => {
    if (standalone) {
      if (policyNo) {
        navigate(`/underwriting/group-life-quotations/debit-note/${policyNo}`, {
          state: { 
            mode: 'add',
            sourcePage: 'debit-note-list'
          }
        });
      } else {
        toast.error('No policy selected to create a debit note');
      }
    } else if (onNewDebitNote) {
      onNewDebitNote();
    } else if (policyNo) {
      navigate(`/underwriting/group-life-quotations/debit-note/${policyNo}`, {
        state: { 
          mode: 'add',
          sourcePage: 'debit-note-list'
        }
      });
    } else {
      toast.error('No policy selected to create a debit note');
    }
  };
  
  // Handle back navigation
  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  const handleViewNote = (note: any) => {
    const dncnNo = note.debitNoteNo || note.dncnNo;
    const policyNumber = note.policyNo || policyNo;
    
    if (!dncnNo) {
      toast.error('Debit note number is missing');
      return;
    }

    if (onSelectDebitNote) {
      onSelectDebitNote(note);
    } else {
      navigate(`/underwriting/group-life-quotations/debit-note/${dncnNo}/view`, {
        state: { 
          debitNoteNo: dncnNo,
          policyNo: policyNumber
        }
      });
    }
  };

  const handleEditNote = (note: any) => {
    const dncnNo = note.debitNoteNo || note.dncnNo;
    const policyNumber = note.policyNo || policyNo;
    
    if (!dncnNo) {
      toast.error('Debit note number is missing');
      return;
    }

    if (note.approval !== 2) {
      navigate(`/underwriting/group-life-quotations/debit-note/${dncnNo}/edit`, {
        state: { 
          debitNoteNo: dncnNo,
          policyNo: policyNumber
        }
      });
    } else {
      toast.error('This debit note is approved and cannot be edited');
    }
  };

  const handleCreateCreditNote = (note: any) => {
    const dncnNo = note.debitNoteNo || note.dncnNo || note.id;
    const policyNumber = note.policyNo || policyNo;
    
    if (!dncnNo) {
      toast.error('Debit note number is missing');
      return;
    }
    
    if (!policyNumber) {
      toast.error('Policy number is missing');
      return;
    }

    navigate(`/underwriting/group-life-quotations/coinsurance-credit-note/${dncnNo}/new`, {
      state: { 
        refDebitNoteNo: dncnNo,
        type: "CN",
        debitNoteData: note,
        policyNo: policyNumber,
        mode: 'add'
      }
    });
  };

  // ✅ Server-side pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= debitNoteListTotalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setFilters(prev => ({ ...prev, pageSize: newSize, page: 1 }));
  };

  // If no policy number is provided, show a message
  if (!policyNo) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-xl shadow-sm">
                <Layers className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Debit Notes</h2>
                <p className="text-sm text-gray-500">No policy selected</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="p-4 bg-gray-50 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-700">No Policy Selected</p>
          <p className="text-sm text-gray-400 mt-1">Please select a policy to view its debit notes</p>
        </div>
      </div>
    );
  }

  // Check if loading
  if (loading?.list) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-xl shadow-sm">
                <Layers className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Debit Notes</h2>
                <p className="text-sm text-gray-500">Policy: {policyNo}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-sm text-gray-500">Loading debit notes...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if error
  if (localError || error?.list) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-red-50 to-red-100/50 border-b border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h2 className="text-lg font-semibold text-red-900">Error Loading Debit Notes</h2>
                <p className="text-sm text-red-700">{localError || error?.list}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  hasFetchedRef.current = false;
                  fetchDebitNotesList();
                }}
                variant="outline"
                size="sm"
                className="whitespace-nowrap bg-white"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Retry
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <p className="text-sm text-gray-500">
            You can try refreshing or create a new debit note.
          </p>
        </div>
      </div>
    );
  }

  // Count how many selected notes are not approved
  const getApprovableCount = () => {
    let count = 0;
    selectedNotes.forEach(dncnNo => {
      const note = debitNoteList.find((n: any) => (n.debitNoteNo || n.dncnNo) === dncnNo);
      if (note && note.approval !== 2) {
        count++;
      }
    });
    return count;
  };

  const approvableCount = getApprovableCount();

  // Main render with data using Card + Table
  return (
    <div className="space-y-4">
      {/* ✅ STATS CARDS - Like Coinsurance */}
      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Draft</p>
                <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="p-2.5 bg-green-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Net Premium</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(stats.totalNetPremium)}</p>
              </div>
              <div className="p-2.5 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ Main Table Card */}
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {/* Action toolbar - Always visible */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {selectedNotes.size > 0 ? (
                <>
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {selectedNotes.size} note{selectedNotes.size > 1 ? 's' : ''} selected
                  </span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">
                    Debit Notes Actions
                  </span>
                </>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleDoCoinsuranceNote}
                disabled={selectedNotes.size === 0}
                variant="outline"
                size="sm"
                className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Layers className="w-4 h-4 mr-1.5" />
                Do CoInsurance Note
              </Button>
              <Button
                onClick={handlePrintPolicyDocument}
                disabled={selectedNotes.size === 0}
                variant="outline"
                size="sm"
                className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Print Policy Document
              </Button>
              {approvableCount > 0 && (
                <Button
                  onClick={handleApproveSelected}
                  disabled={isApprovingMultiple}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium shadow-sm"
                  size="sm"
                >
                  {isApprovingMultiple ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Approve DebitNote
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedNotes.size === debitNoteList.length && debitNoteList.length > 0}
                      onCheckedChange={handleSelectAll}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700">DN No.</TableHead>
                  <TableHead className="font-semibold text-slate-700">Policy No.</TableHead>
                  <TableHead className="font-semibold text-slate-700">Insured</TableHead>
                  <TableHead className="font-semibold text-slate-700">Date</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Gross Premium</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-right">Net Amount</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debitNoteList && debitNoteList.length > 0 ? (
                  debitNoteList.map((note: any, index: number) => {
                    const dncnNo = note.debitNoteNo || note.dncnNo || note.id || index;
                    const policyNoDisplay = note.policyNo || note.policyNo || '-';
                    const insuredNameDisplay = note.insuredName || note.insuredName || note.insured || '-';
                    const billingDate = note.billingDate || note.billingDate || note.dncnDate;
                    const grossPremium = note.grossPremium || note.grossPremium || 0;
                    const netPremium = note.premium?.netPremium || note.netPremium || note.netAmount || 0;
                    const approvalStatus = note.approval !== undefined ? note.approval : (note.approvalStatus === 'Approved' ? 2 : 1);
                    const isSelected = selectedNotes.has(dncnNo);
                    const isApproved = approvalStatus === 2;
                    
                    return (
                      <TableRow 
                        key={dncnNo} 
                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/50' : ''}`}
                        onClick={() => handleViewNote(note)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleSelect(dncnNo)}
                            className="data-[state=checked]:bg-blue-600"
                          />
                        </TableCell>
                        <TableCell className="font-medium text-blue-600">
                          {dncnNo}
                        </TableCell>
                        <TableCell className="text-slate-600">{policyNoDisplay}</TableCell>
                        <TableCell className="text-slate-600 max-w-[150px] truncate" title={insuredNameDisplay}>
                          {insuredNameDisplay}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {billingDate ? formatDate(billingDate) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-900">
                          {formatCurrency(grossPremium)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-900">
                          {formatCurrency(netPremium)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {getStatusIcon(approvalStatus)}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(approvalStatus)}`}>
                              {getStatusLabel(approvalStatus)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div 
                            className="flex items-center justify-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleViewNote(note)}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-slate-500 hover:text-blue-600" />
                            </Button>
                           
                            {approvalStatus !== 2 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditNote(note)}
                                title="Edit Note"
                              >
                                <Edit className="w-4 h-4 text-slate-500 hover:text-blue-600" />
                              </Button>
                            )}
                           
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 gap-1.5"
                              onClick={() => handleCreateCreditNote(note)}
                              title="Create Credit Note">
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span className="text-xs font-medium">Credit Note</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  /* ✅ "No debit notes found" message - exactly like CreditNotesTab */
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 px-4">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-gray-50 rounded-full">
                          <FileText className="w-12 h-12 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-600">No Debit Notes Found</p>
                          <p className="text-sm text-gray-400 mt-1">
                            No debit notes have been created for this policy yet.
                          </p>
                          
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ✅ Server-side Pagination */}
          {debitNoteListTotalPages > 0 && debitNoteList && debitNoteList.length > 0 && (
            <div className="px-4 py-4 border-t border-gray-200 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 order-2 sm:order-1">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-medium text-gray-900">
                      {((filters.page - 1) * filters.pageSize) + 1}
                    </span> to{' '}
                    <span className="font-medium text-gray-900">
                      {Math.min(filters.page * filters.pageSize, debitNoteListTotalCount)}
                    </span> of{' '}
                    <span className="font-medium text-gray-900">{debitNoteListTotalCount}</span> items
                  </div>
                  
                  {/* Page size selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Rows:</span>
                    <select
                      value={filters.pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 order-1 sm:order-2">
                  <Button
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page <= 1}
                    variant="outline"
                    size="sm"
                    className="min-w-[90px]"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  
                  <span className="px-3 py-1 text-sm font-medium text-gray-700 min-w-[60px] text-center">
                    {filters.page} / {debitNoteListTotalPages}
                  </span>
                  
                  <Button
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page >= debitNoteListTotalPages}
                    variant="outline"
                    size="sm"
                    className="min-w-[90px]"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DebitNoteList;