// src/components/groupLife/CreditNotesTab.tsx
// @ts-nocheck

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../UI/card";
import { Button } from "../UI/new-button";
import { useToast } from "../UI/use-toast";
import { SERVER_URL } from "../../utils/constants";
import { Loader2, Plus, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../UI/table";
import { formatDate, formatCurrency } from "../../utils/ui-utilities";

interface CreditNotesTabProps {
  policyNo: string;
}

interface CreditNote {
  id: string;
  noteNo: string;
  amount: number;
  date: string;
  description: string;
  status: string;
}

const CreditNotesTab: React.FC<CreditNotesTabProps> = ({ policyNo }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);

  const fetchCreditNotes = async () => {
    if (!policyNo) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      
      const response = await fetch(
        `${SERVER_URL}/grouplife/policies/${encodeURIComponent(policyNo)}/credit-notes`,
        {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setCreditNotes(data.items || data || []);
    } catch (error) {
      console.error("Error fetching credit notes:", error);
      setCreditNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (policyNo) {
      fetchCreditNotes();
    }
  }, [policyNo]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading credit notes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Credit Notes</h3>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Credit Note
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {creditNotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No credit notes found for this policy.</p>
              <p className="text-sm mt-2">Click "New Credit Note" to create one.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Note No</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditNotes.map((note) => (
                  <TableRow key={note.id}>
                    <TableCell className="font-medium">{note.noteNo}</TableCell>
                    <TableCell>{formatDate(note.date)}</TableCell>
                    <TableCell>{note.description}</TableCell>
                    <TableCell className="text-right">{formatCurrency(note.amount)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        note.status === "APPROVED" ? "bg-green-100 text-green-800" :
                        note.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {note.status || "Draft"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreditNotesTab;