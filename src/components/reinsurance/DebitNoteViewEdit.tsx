// pages/Reinsurance/Maintenance/DebitNoteViewEdit.tsx
import React, { useState } from 'react';
import { SERVER_URL} from "../../utils/constants"

export interface DebitNote {
  dncnid: string | null;
  dncnNo: string;
  policyNo: string;
  insuredName: string;
  billingDate: string;
  bizSource: string;
  grossPremium: number;
  netAmount: number;
  approval: number;
  approvalStatus: string | null;
  submittedOn: string;
  submittedBy: string;
}

interface Props {
  note: DebitNote;
  onClose: () => void;
  onSaved: () => void;
}

const fmt = (n: number) =>
  n?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';

export const getApprovalLabel = (approval: number): string => {
  switch (approval) {
    case 0: return 'Draft';
    case 1: return 'Pending';
    case 2: return 'Approved';
    case 3: return 'Rejected';
    default: return 'Unknown';
  }
};

export const getApprovalStyle = (approval: number): string => {
  switch (approval) {
    case 0: return 'bg-gray-100 text-gray-700';
    case 1: return 'bg-yellow-100 text-yellow-800';
    case 2: return 'bg-green-100 text-green-800';
    case 3: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-700';
  }
};

const DebitNoteViewEdit: React.FC<Props> = ({ note, onClose, onSaved }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [form, setForm] = useState({
    insuredName: note.insuredName?.trim() || '',
    policyNo: note.policyNo || '',
    billingDate: note.billingDate ? note.billingDate.split('T')[0] : '',
    bizSource: note.bizSource === 'NULL' ? '' : (note.bizSource || ''),
    grossPremium: note.grossPremium?.toString() || '0',
    netAmount: note.netAmount?.toString() || '0',
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaveError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(
        `${SERVER_URL}/reinsurance-treaties/debit-notes-treaties/${note.dncnNo}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            insuredName: form.insuredName,
            policyNo: form.policyNo,
            billingDate: form.billingDate,
            bizSource: form.bizSource,
            grossPremium: parseFloat(form.grossPremium),
            netAmount: parseFloat(form.netAmount),
          }),
        }
      );
      if (response.ok) {
        setIsEditing(false);
        onSaved();
      } else {
        const err = await response.json().catch(() => null);
        setSaveError(err?.message || `Save failed (${response.status})`);
      }
    } catch {
      setSaveError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setForm({
      insuredName: note.insuredName?.trim() || '',
      policyNo: note.policyNo || '',
      billingDate: note.billingDate ? note.billingDate.split('T')[0] : '',
      bizSource: note.bizSource === 'NULL' ? '' : (note.bizSource || ''),
      grossPremium: note.grossPremium?.toString() || '0',
      netAmount: note.netAmount?.toString() || '0',
    });
    setSaveError(null);
    setIsEditing(false);
  };

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent';
  const readonlyClass =
    'w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700';

  return (
   <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEditing ? 'Edit Debit Note' : 'View Debit Note'}
            </h2>
            <p className="text-sm text-blue-600 font-medium">{note.dncnNo}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getApprovalStyle(note.approval)}`}>
              {getApprovalLabel(note.approval)}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Read-only identifiers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Debit Note #</label>
              <div className={readonlyClass}>{note.dncnNo}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Submitted On</label>
              <div className={readonlyClass}>{note.submittedOn ? new Date(note.submittedOn).toLocaleString() : '—'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Submitted By</label>
              <div className={readonlyClass}>{note.submittedBy || '—'}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</label>
              <div className={readonlyClass}>{getApprovalLabel(note.approval)}</div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Editable fields */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Insured Name</label>
            {isEditing
              ? <input type="text" value={form.insuredName} onChange={e => handleChange('insuredName', e.target.value)} className={inputClass} />
              : <div className={readonlyClass}>{form.insuredName || '—'}</div>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Policy #</label>
              {isEditing
                ? <input type="text" value={form.policyNo} onChange={e => handleChange('policyNo', e.target.value)} className={inputClass} />
                : <div className={readonlyClass}>{form.policyNo || '—'}</div>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Biz Source</label>
              {isEditing
                ? <input type="text" value={form.bizSource} onChange={e => handleChange('bizSource', e.target.value)} className={inputClass} />
                : <div className={readonlyClass}>{form.bizSource || '—'}</div>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Billing Date</label>
            {isEditing
              ? <input type="date" value={form.billingDate} onChange={e => handleChange('billingDate', e.target.value)} className={inputClass} />
              : <div className={readonlyClass}>{form.billingDate ? new Date(form.billingDate).toLocaleDateString() : '—'}</div>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Gross Premium</label>
              {isEditing
                ? <input type="number" value={form.grossPremium} onChange={e => handleChange('grossPremium', e.target.value)} className={inputClass} step="0.01" />
                : <div className={readonlyClass}>{fmt(parseFloat(form.grossPremium))}</div>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Net Amount</label>
              {isEditing
                ? <input type="number" value={form.netAmount} onChange={e => handleChange('netAmount', e.target.value)} className={inputClass} step="0.01" />
                : <div className={readonlyClass}>{fmt(parseFloat(form.netAmount))}</div>}
            </div>
          </div>

          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {saveError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">
            Close
          </button>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button onClick={handleDiscard} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2 disabled:opacity-60"
                >
                  {isSaving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebitNoteViewEdit;