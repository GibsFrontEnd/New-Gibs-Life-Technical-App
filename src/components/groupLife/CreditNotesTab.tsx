// src/components/groupLife/CreditNotesTab.tsx
// @ts-nocheck

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../UI/card";
import { Button } from "../UI/new-button";
import { useToast } from "../UI/use-toast";
import { Loader2, Plus, FileText, Eye, Edit, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../UI/table";
import { formatDate, formatCurrency } from "../../utils/ui-utilities";
import type { AppDispatch } from "../../features/store";

// Import from the updated slice
import {
  fetchCoinsuranceCreditNotes,
  loadCoinsuranceCreditNote,
  selectCoinsuranceCreditNote,
  clearCoinsuranceCreditNoteErrors,
} from "../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";

interface CreditNotesTabProps {
  policyNo: string;
  onViewNote?: (note: any) => void;
  onEditNote?: (note: any) => void;
}

interface CreditNote {
  id: string;
  creditNoteNo: string;
  refDebitNoteNo: string;
  amount: number;
  date: string;
  description: string;
  status: string;
  noteType: string;
  participantId: string;
  participantName: string;
  insuredName: string;
  approval: number;
  editable: boolean;
  billingDate: string;
  startDate: string;
  endDate: string;
  sharePercent: number;
  shareSumInsured: number;
  sharePremium: number;
  commission: number;
  netPremium: number;
  isReversal: boolean;
  submittedBy: string;
  submittedOn: string;
}

const CreditNotesTab: React.FC<CreditNotesTabProps> = ({ 
  policyNo, 
  onViewNote, 
  onEditNote 
}) => {
  const { toast } = useToast();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNote, setSelectedNote] = useState<CreditNote | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 50,
    search: '',
  });

  // Use the selector from the slice
  const {
    coinsuranceCreditNoteList,
    coinsuranceCreditNoteListTotalCount,
    currentCoinsuranceCreditNote,
    loading,
    error
  } = useSelector(selectCoinsuranceCreditNote);

  // Get status text from approval code
  const getStatusText = (approval: number): string => {
    switch (approval) {
      case 0: return "Draft";
      case 1: return "Pending";
      case 2: return "Approved";
      case 3: return "Rejected";
      default: return "Draft";
    }
  };

  // Get status color from approval code
  const getStatusColor = (approval: number): string => {
    switch (approval) {
      case 0: return "bg-gray-100 text-gray-800";
      case 1: return "bg-yellow-100 text-yellow-800";
      case 2: return "bg-green-100 text-green-800";
      case 3: return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get status icon from approval code
  const getStatusIcon = (approval: number) => {
    switch (approval) {
      case 0: return <Clock className="w-4 h-4 text-gray-500" />;
      case 1: return <Clock className="w-4 h-4 text-yellow-500" />;
      case 2: return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 3: return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get note type label
  const getNoteTypeLabel = (type: string): string => {
    return type === "CN" ? "Credit Note" : "Reversal";
  };

  // Fetch credit notes using Redux thunk
  const fetchCreditNotes = async () => {
    if (!policyNo) return;

    try {
      await dispatch(fetchCoinsuranceCreditNotes({
        policyNo: policyNo,
        page: filters.page,
        pageSize: filters.pageSize,
        search: filters.search || undefined,
      })).unwrap();
    } catch (error: any) {
      console.error("Error fetching credit notes:", error);
      toast({
        description: error?.message || "Failed to load credit notes. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle view note
  const handleViewNote = async (note: CreditNote) => {
    try {
      if (note.creditNoteNo) {
        const result = await dispatch(loadCoinsuranceCreditNote(note.creditNoteNo)).unwrap();
        setSelectedNote(result);
        if (onViewNote) {
          onViewNote(result);
        } else {
          navigate(`/underwriting/group-life-quotations/coinsurance-credit-note/${note.creditNoteNo}/view`, {
            state: { creditNoteNo: note.creditNoteNo, policyNo }
          });
        }
      }
    } catch (error: any) {
      toast({
        description: error?.message || "Failed to load credit note details.",
        variant: "destructive"
      });
    }
  };

  // Handle edit note
  const handleEditNote = (note: CreditNote) => {
    if (note.approval !== 2) {
      if (onEditNote) {
        onEditNote(note);
      } else {
        navigate(`/underwriting/group-life-quotations/coinsurance-credit-note/${note.creditNoteNo}/edit`, {
          state: { creditNoteNo: note.creditNoteNo, policyNo }
        });
      }
    } else {
      toast({
        description: "This credit note is approved and cannot be edited.",
        variant: "destructive"
      });
    }
  };

  // Handle create new note
  const handleCreateNew = () => {
    navigate(`/underwriting/group-life-quotations/coinsurance-credit-note/new`, {
      state: { policyNo }
    });
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCreditNotes();
    setRefreshing(false);
    toast({
      description: "Credit notes refreshed successfully.",
      variant: "default"
    });
  };

  // Clear errors on unmount
  useEffect(() => {
    return () => {
      dispatch(clearCoinsuranceCreditNoteErrors());
    };
  }, [dispatch]);

  // Initial fetch
  useEffect(() => {
    if (policyNo) {
      fetchCreditNotes();
    }
  }, [policyNo, filters.page, filters.pageSize]);

  // Auto-refresh when a new note is created/updated
  useEffect(() => {
    if (currentCoinsuranceCreditNote) {
      fetchCreditNotes();
    }
  }, [currentCoinsuranceCreditNote]);

  // Show loading state
  if (loading?.list) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading credit notes...</p>
      </div>
    );
  }

  // Handle error
  if (error?.list) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-900">Coinsurance Credit Notes</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-9"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Retry
            </Button>
            
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-red-600 font-medium">Error loading credit notes</p>
          <p className="text-sm text-red-500 mt-1">{error.list}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      

      {/* Summary Stats */}
      {coinsuranceCreditNoteList && coinsuranceCreditNoteList.length > 0 && (
        <div className="grid grid-cols-1 sm-grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-semibold">Total Notes</p>
            <p className="text-2xl font-bold text-slate-900">{coinsuranceCreditNoteList.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-semibold">Approved</p>
            <p className="text-2xl font-bold text-green-600">
              {coinsuranceCreditNoteList.filter((n: any) => n.approval === 2).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-semibold">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {coinsuranceCreditNoteList.filter((n: any) => n.approval === 1).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 uppercase font-semibold">Total Amount</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(coinsuranceCreditNoteList.reduce((sum: number, n: any) => sum + (n.netPremium || 0), 0))}
            </p>
          </div>
        </div>
      )}

      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {!coinsuranceCreditNoteList || coinsuranceCreditNoteList.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600 font-medium">No credit notes found</p>
              <p className="text-sm text-slate-400 mt-1">Click "New Credit Note" to create one for this policy.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Note No</TableHead>
                    <TableHead className="font-semibold text-slate-700">Type</TableHead>
                    <TableHead className="font-semibold text-slate-700">Ref Debit Note</TableHead>
                    <TableHead className="font-semibold text-slate-700">Date</TableHead>
                    <TableHead className="font-semibold text-slate-700">Participant</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Share %</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Amount</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coinsuranceCreditNoteList.map((note: any) => {
                    const creditNote: CreditNote = {
                      id: note.creditNoteNo,
                      creditNoteNo: note.creditNoteNo,
                      refDebitNoteNo: note.refDebitNoteNo || "",
                      amount: note.netPremium || 0,
                      date: note.billingDate || note.submittedOn,
                      description: "",
                      status: getStatusText(note.approval),
                      noteType: note.noteType || "CN",
                      participantId: note.participantId || "",
                      participantName: note.participantName || "",
                      insuredName: note.insuredName || "",
                      approval: note.approval || 0,
                      editable: note.approval !== 2,
                      billingDate: note.billingDate,
                      startDate: "",
                      endDate: "",
                      sharePercent: note.sharePercent || 0,
                      shareSumInsured: note.shareSumInsured || 0,
                      sharePremium: note.sharePremium || 0,
                      commission: note.commission || 0,
                      netPremium: note.netPremium || 0,
                      isReversal: note.isReversal || false,
                      submittedBy: note.submittedBy || "",
                      submittedOn: note.submittedOn || "",
                    };
                    
                    return (
                      <TableRow 
                        key={creditNote.id} 
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => handleViewNote(creditNote)}
                      >
                        <TableCell className="font-medium text-blue-600">
                          {creditNote.creditNoteNo}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            creditNote.noteType === "CN" 
                              ? "bg-blue-100 text-blue-700" 
                              : "bg-orange-100 text-orange-700"
                          }`}>
                            {getNoteTypeLabel(creditNote.noteType)}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {creditNote.refDebitNoteNo || "N/A"}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {formatDate(creditNote.date)}
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-[150px] truncate" title={creditNote.participantName || creditNote.insuredName}>
                          {creditNote.participantName || creditNote.insuredName || "N/A"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-900">
                          {creditNote.sharePercent}%
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-900">
                          {formatCurrency(creditNote.netPremium)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {getStatusIcon(creditNote.approval)}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(creditNote.approval)}`}>
                              {getStatusText(creditNote.approval)}
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
                              onClick={() => handleViewNote(creditNote)}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-slate-500 hover:text-blue-600" />
                            </Button>
                            {creditNote.approval !== 2 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditNote(creditNote)}
                                title="Edit Note"
                              >
                                <Edit className="w-4 h-4 text-slate-500 hover:text-blue-600" />
                              </Button>
                            )}
                            {creditNote.approval === 2 && (
                              <span className="text-xs text-green-600 font-medium px-1">
                                ✓ Approved
                              </span>
                            )}
                            {creditNote.approval === 3 && (
                              <span className="text-xs text-red-600 font-medium px-1">
                                ✗ Rejected
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      
    </div>
  );
};

export default CreditNotesTab;