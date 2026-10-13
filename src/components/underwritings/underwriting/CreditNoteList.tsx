// @ts-nocheck
// components/CreditNoteList.tsx
import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Layers
} from 'lucide-react';
import { Button } from '../../UI/new-button';
import { toast } from 'sonner';

interface CreditNoteListProps {
  policyNo?: string;
}

const CreditNoteList = ({ policyNo }: CreditNoteListProps) => {
  const [isLoading] = useState(false);
  const [creditNotes] = useState<any[]>([]);
  const [pagination] = useState({
    page: 1,
    pageSize: 50,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });

  const handleDownloadCreditNote = async (cnNo: string) => {
    if (!cnNo) {
      toast.error('Credit note number is missing');
      return;
    }

    // Placeholder for download functionality
    toast.info('Download functionality will be available soon');
    console.log('Download credit note:', cnNo);
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

  // Pagination handlers (placeholder)
  const handlePreviousPage = () => {
    toast.info('Pagination will be available when data is loaded');
  };

  const handleNextPage = () => {
    toast.info('Pagination will be available when data is loaded');
  };

  // If no policy number is provided, show a message
  if (!policyNo) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="p-4 bg-gray-50 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-700">No Policy Selected</p>
          <p className="text-sm text-gray-400 mt-1">Please select a policy to view its credit notes</p>
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
              <h2 className="text-lg font-semibold text-gray-900">Credit Notes</h2>
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
            <p className="text-sm text-gray-500">Loading credit notes...</p>
          </div>
        </div>
      ) : creditNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="p-4 bg-gray-50 rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-700">No credit notes found</p>
          <p className="text-sm text-gray-400 mt-1">
            No credit notes available for policy {policyNo}
          </p>
          <p className="text-xs text-gray-300 mt-2">
            Credit notes will appear here once the endpoint is available
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">CN No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">DN No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Reason</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {creditNotes.map((note: any, index: number) => (
                  <tr key={note.cnNo || note.id || index} className="hover:bg-blue-50/30 transition-colors duration-150">
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-medium text-gray-900">{note.cnNo || note.creditNoteNo || '-'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{note.dncnNo || note.debitNoteNo || '-'}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{note.cnDate ? formatDate(note.cnDate) : '-'}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600 max-w-[200px] truncate">{note.reason || note.description || '-'}</td>
                    <td className="px-4 py-3.5 text-sm font-medium text-right text-gray-900">
                      {formatCurrency(note.amount || note.totalAmount || 0)}
                    </td>
                    <td className="px-4 py-3.5">{getStatusBadge(note.status)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          onClick={() => handleDownloadCreditNote(note.cnNo || note.creditNoteNo)}
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
                  Showing <span className="font-medium text-gray-900">0</span> to{' '}
                  <span className="font-medium text-gray-900">0</span> of{' '}
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

export default CreditNoteList;