// @ts-nocheck
// components/DebitNoteList.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../features/store';
// import { 
//   getDebitNotesByPolicy,
//   getDebitNoteDocument,
//   clearError,
//   setPage,
//   setPageSize,
//   resetFilters,
// } from '../../../features/reducers/reinsuranceReducers/debitNoteSlice';
import { Button } from '../../UI/new-button';
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
  Layers
} from 'lucide-react';

interface DebitNoteListProps {
  policyNo?: string;
}

const DebitNoteList = ({ policyNo }: DebitNoteListProps) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });

  // Use refs to prevent infinite loops
  const hasFetchedRef = useRef(false);
  const policyNoRef = useRef(policyNo);

  // Update ref when policyNo changes
  useEffect(() => {
    if (policyNo !== policyNoRef.current) {
      policyNoRef.current = policyNo;
      hasFetchedRef.current = false;
      // Reset state when policy changes
      setCreditNotes([]);
      setPagination({
        page: 1,
        pageSize: 50,
        totalItems: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      });
    }
  }, [policyNo]);

  // Fetch debit notes - ONLY when policyNo changes and we haven't fetched yet
  useEffect(() => {
    // Only fetch if we have a policy number and haven't fetched yet
    if (policyNo && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchDebitNotes();
    }
  }, [policyNo]);

  const fetchDebitNotes = async (page = 1, pageSize = 50) => {
    if (!policyNo) {
      console.log('No policyNo provided to DebitNoteList');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Fetching debit notes for policy:', policyNo);
      
      // Use the correct thunk with proper payload
      const result = await dispatch(getDebitNotesByPolicy({ 
        policyNo, 
        page, 
        pageSize 
      })).unwrap();
      
      console.log('Debit notes result:', result);
      
      // Handle different response formats
      let notes = [];
      let total = 0;
      
      if (Array.isArray(result)) {
        notes = result;
        total = result.length;
      } else if (result?.data && Array.isArray(result.data)) {
        notes = result.data;
        total = result.count || result.data.length;
      } else if (result?.items && Array.isArray(result.items)) {
        notes = result.items;
        total = result.totalCount || result.items.length;
      } else {
        notes = [];
        total = 0;
      }

      setCreditNotes(notes);
      setPagination({
        page: page,
        pageSize: pageSize,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize) || 1,
        hasNext: page < Math.ceil(total / pageSize),
        hasPrevious: page > 1,
      });
    } catch (error: any) {
      console.error('Failed to fetch debit notes:', error);
      // Don't show toast for every error, just log it
      if (error?.message?.includes('CORS')) {
        console.warn('CORS error - API may not be accessible from localhost');
      } else {
        toast.error(error?.message || 'Failed to fetch debit notes');
      }
      setCreditNotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadDebitNote = async (dncnNo: string) => {
    if (!dncnNo) {
      toast.error('Debit note number is missing');
      return;
    }

    try {
      const blob = await dispatch(getDebitNoteDocument(dncnNo)).unwrap();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DebitNote_${dncnNo}.pdf`;
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: any; bg: string; text: string; border: string; label: string }> = {
      PENDING: {
        icon: Clock,
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        label: 'Pending'
      },
      APPROVED: {
        icon: CheckCircle,
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        label: 'Approved'
      },
      REJECTED: {
        icon: XCircle,
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        label: 'Rejected'
      },
      DRAFT: {
        icon: FileText,
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        label: 'Draft'
      }
    };

    const config = statusConfig[status?.toUpperCase()] || statusConfig.DRAFT;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    const currentPage = pagination.page;
    const newPage = currentPage - 1;
    if (newPage >= 1) {
      // Reset the fetch flag to allow re-fetch
      hasFetchedRef.current = false;
      fetchDebitNotes(newPage, pagination.pageSize);
    }
  };

  const handleNextPage = () => {
    const currentPage = pagination.page;
    const newPage = currentPage + 1;
    if (newPage <= pagination.totalPages) {
      // Reset the fetch flag to allow re-fetch
      hasFetchedRef.current = false;
      fetchDebitNotes(newPage, pagination.pageSize);
    }
  };

  // Calculate displayed range
  const startItem = ((pagination.page - 1) * pagination.pageSize) + 1;
  const endItem = Math.min(pagination.page * pagination.pageSize, pagination.totalItems);

  // If no policy number is provided, show a message
  if (!policyNo) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
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

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-xl shadow-sm">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Debit Notes</h2>
              <p className="text-sm text-gray-500">
                Policy: {policyNo}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Total: <span className="font-semibold text-gray-900">{pagination.totalItems}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-sm text-gray-500">Loading debit notes...</p>
          </div>
        </div>
      ) : creditNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="p-4 bg-gray-50 rounded-full mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-700">No debit notes found</p>
          <p className="text-sm text-gray-400 mt-1">
            No debit notes available for policy {policyNo}
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">DN No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Policy No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Insured</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Gross Premium</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Net Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {creditNotes.map((note: any, index: number) => (
                  <tr key={note.dncnNo || note.id || index} className="hover:bg-blue-50/30 transition-colors duration-150">
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-medium text-gray-900">{note.dncnNo || '-'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{note.policyNo || '-'}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600 max-w-[150px] truncate">{note.insuredName || note.insured || '-'}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{note.billingDate ? formatDate(note.billingDate) : note.dncnDate ? formatDate(note.dncnDate) : '-'}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-right text-gray-900">
                      {formatCurrency(note.grossPremium || note.premiumAmount || 0)}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-right text-gray-900">
                      {formatCurrency(note.netAmount || note.totalAmount || 0)}
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(note.approvalStatus || note.status)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          onClick={() => handleDownloadDebitNote(note.dncnNo)}
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap text-xs px-2.5 py-1.5"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          Download
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600 order-2 sm:order-1">
                  Showing <span className="font-medium text-gray-900">{startItem}</span> to{' '}
                  <span className="font-medium text-gray-900">{endItem}</span> of{' '}
                  <span className="font-medium text-gray-900">{pagination.totalItems}</span> items
                  <span className="ml-2 text-xs text-gray-400">
                    (Page {pagination.page} of {pagination.totalPages})
                  </span>
                </div>

                <div className="flex items-center gap-3 order-1 sm:order-2">
                  <Button
                    onClick={handlePreviousPage}
                    disabled={!pagination.hasPrevious || pagination.page <= 1}
                    variant="outline"
                    size="sm"
                    className="min-w-[90px]"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  
                  <span className="px-3 py-1 text-sm font-medium text-gray-700 min-w-[60px] text-center">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  
                  <Button
                    onClick={handleNextPage}
                    disabled={!pagination.hasNext || pagination.page >= pagination.totalPages}
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
        </>
      )}
    </div>
  );
};

export default DebitNoteList;