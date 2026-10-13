// src/components/Reinsurance/FacultativeInwardDetail.tsx
//@ts-nocheck
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../features/store';
import {
  fetchFacInPolicyById,
  updateFacInPolicy,
} from '../../features/reducers/reinsuranceReducers/reinsuranceSlice';
import { UpdateFacultativeInwardDto } from '../../types/reinsurance';


// ── Helpers ──────────────────────────────────────────────────────
const toDateInput = (iso: string | null | undefined) => {
  if (!iso) return '';
  return iso.split('T')[0];
};

const fmt = (val: string | number | null | undefined, fallback = '—') =>
  val !== null && val !== undefined && val !== '' ? String(val) : fallback;

const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

// ── View-only detail row ─────────────────────────────────────────
const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="py-3 grid grid-cols-2 gap-4 border-b border-gray-100 last:border-0">
    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</dt>
    <dd className="text-sm text-gray-800 font-medium">{value}</dd>
  </div>
);

const DetailSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-1">{title}</h3>
    <div className="border-b border-gray-200 mb-3" />
    <dl>{children}</dl>
  </div>
);

// ── Edit field helpers ───────────────────────────────────────────
const inputCls = (hasError: boolean) =>
  `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
    hasError
      ? 'border-red-300 focus:ring-red-200 bg-red-50'
      : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
  }`;

const EditField = ({
  label,
  name,
  required,
  error,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const EditSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-1">{title}</h3>
    <div className="border-b border-gray-200 mb-5" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
  </div>
);

// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
const FacultativeInwardDetail: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { policyNo, inwardId } = useParams<{ policyNo?: string; inwardId?: string }>();
  const id = inwardId ?? policyNo ?? '';

  const isEditRoute = !!inwardId;
  const [mode, setMode] = useState<'view' | 'edit'>(isEditRoute ? 'edit' : 'view');

  const { selectedPolicy, loading, error } = useSelector((state: RootState) => state.reinsurance);

  const [form, setForm] = useState<UpdateFacultativeInwardDto>({});
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof UpdateFacultativeInwardDto, string>>>({});
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── Fetch policy ───────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    dispatch(fetchFacInPolicyById({ policyNo: id }))
      .unwrap()
      .catch((err) =>
        setFetchError(typeof err === 'string' ? err : 'Failed to load policy.')
      );
  }, [id, dispatch]);

  // ── Populate form when policy loads ───────────────────────────
  useEffect(() => {
    if (!selectedPolicy) return;
    setForm({
      entryDate:          toDateInput(selectedPolicy.transDate),
      startDate:          toDateInput(selectedPolicy.startDate),
      expiryDate:         toDateInput(selectedPolicy.endDate),
      branchId:           selectedPolicy.branchID ?? '',
      branchName:         selectedPolicy.branch ?? '',
      bizSource:          selectedPolicy.bizSource ?? '',
      subRiskId:          selectedPolicy.subRiskID ?? '',
      subRiskName:        selectedPolicy.subRisk ?? '',
      partyId:            selectedPolicy.partyID ?? '',
      marketingStaffId:   selectedPolicy.mktStaffID ?? '',
      insuredId:          selectedPolicy.insuredID ?? '',
      insSurname:         selectedPolicy.insSurname ?? '',
      insFirstname:       selectedPolicy.insFirstname ?? '',
      insOthernames:      selectedPolicy.insOthernames ?? '',
      insAddress:         selectedPolicy.insAddress ?? '',
      insMobilePhone:     selectedPolicy.insMobilePhone ?? '',
      insEmail:           selectedPolicy.insEmail ?? '',
      insOccupation:      selectedPolicy.insOccupation ?? '',
      coPolicyNo:         selectedPolicy.coPolicyNo ?? '',
      leaderId:           selectedPolicy.leadID ?? '',
      leaderName:         selectedPolicy.leader ?? '',
      currency:           selectedPolicy.exCurrency ?? 'NGN',
      exchangeRate:       selectedPolicy.exRate ?? 1,
      businessProportion: selectedPolicy.proportionRate ?? 0,
      businessType:       selectedPolicy.sourceType ?? '',
      classType:          '',
      companyAbrev:       selectedPolicy.companyID ?? '',
      // Audit fields (read-only, but included for completeness)
      submittedBy:        selectedPolicy.submittedBy ?? '',
      submittedOn:        selectedPolicy.submittedOn ?? '',
      modifiedBy:         selectedPolicy.modifiedBy ?? '',
      modifiedOn:         selectedPolicy.modifiedOn ?? '',
    });
  }, [selectedPolicy]);

  // ── Edit handlers ──────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    if (fieldErrors[name as keyof UpdateFacultativeInwardDto])
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof UpdateFacultativeInwardDto, string>> = {};
    if (!form.startDate)  errors.startDate  = 'Required';
    if (!form.expiryDate) errors.expiryDate = 'Required';
    if (form.expiryDate && form.startDate && form.expiryDate <= form.startDate)
      errors.expiryDate = 'Must be after start date';
    if (!form.branchId)  errors.branchId  = 'Required';
    if (!form.subRiskId) errors.subRiskId = 'Required';
    if (!form.insuredId) errors.insuredId = 'Required';
    if (!form.currency)  errors.currency  = 'Required';
    if ((form.exchangeRate ?? 0) <= 0) errors.exchangeRate = 'Must be greater than 0';
    if ((form.businessProportion ?? 0) < 0 || (form.businessProportion ?? 0) > 100)
      errors.businessProportion = 'Must be 0–100';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !id) return;

    const payload: UpdateFacultativeInwardDto = {
      ...form,
      entryDate:  form.entryDate  ? new Date(form.entryDate).toISOString()  : undefined,
      startDate:  form.startDate  ? new Date(form.startDate).toISOString()  : undefined,
      expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined,
    };

    const result = await dispatch(updateFacInPolicy({ policyNo: id, data: payload }));
    if (updateFacInPolicy.fulfilled.match(result)) {
      navigate('/reinsurance/facultative-inwards');
    }
  };

  // ── States ─────────────────────────────────────────────────────
  if (loading && !selectedPolicy) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-4xl mx-auto mt-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          <strong>Error:</strong> {fetchError}
        </div>
      </div>
    );
  }

  if (!selectedPolicy) return null;

  // ── Shared header ──────────────────────────────────────────────
  const Header = () => (
    <div className="mb-6">
      <button
        onClick={() => navigate('/reinsurance/facultative-inwards')}
        className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2 transition-colors"
      >
        ← Back to Facultative Inwards
      </button>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {mode === 'view' ? 'Policy Details' : 'Edit Policy'}
          </h1>
          <div className="mt-1">
            <p className="text-gray-500 text-sm">
              Policy No: <span className="font-semibold text-gray-700">
                {selectedPolicy.policyNo || selectedPolicy.proposalNo}
              </span>
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2">
          {mode === 'view' ? (
            <button
              onClick={() => setMode('edit')}
              className="px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
            >
              ✏️ Edit Policy
            </button>
          ) : (
            <button
              onClick={() => setMode('view')}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════
  // VIEW MODE
  // ════════════════════════════════════════════════════════════
  if (mode === 'view') {
    return (
      <div className="max-w-4xl mx-auto">
        <Header />

        <div className="space-y-5">
          {/* Dates */}
          <DetailSection title="Policy Dates">
            <DetailRow label="Entry / Trans Date" value={fmtDate(selectedPolicy.transDate)} />
            <DetailRow label="Start Date"          value={fmtDate(selectedPolicy.startDate)} />
            <DetailRow label="End Date"            value={fmtDate(selectedPolicy.endDate)} />
          </DetailSection>

          {/* Branch & Business */}
          <DetailSection title="Branch & Business">
            <DetailRow label="Branch ID"           value={fmt(selectedPolicy.branchID)} />
            <DetailRow label="Branch Name"         value={fmt(selectedPolicy.branch)} />
            <DetailRow label="Business Source"     value={fmt(selectedPolicy.bizSource)} />
            <DetailRow label="Company ID"          value={fmt(selectedPolicy.companyID)} />
            <DetailRow label="Risk ID"             value={fmt(selectedPolicy.riskID)} />
            <DetailRow label="Source Type"         value={fmt(selectedPolicy.sourceType)} />
          </DetailSection>

          {/* Risk Details */}
          <DetailSection title="Risk Details">
            <DetailRow label="Sub-Risk ID"         value={fmt(selectedPolicy.subRiskID)} />
            <DetailRow label="Sub-Risk Name"       value={fmt(selectedPolicy.subRisk)} />
            <DetailRow label="Co-Policy Number"    value={fmt(selectedPolicy.coPolicyNo)} />
            <DetailRow label="Proportion Rate"     value={fmt(selectedPolicy.proportionRate)} />
            <DetailRow label="Premium Rate"        value={fmt(selectedPolicy.premiumRate)} />
            <DetailRow label="Commission Rate"     value={fmt(selectedPolicy.commissionRate)} />
            <DetailRow label="Sum Insured"         value={fmt(selectedPolicy.sumInsured)} />
            <DetailRow label="Gross Premium"       value={fmt(selectedPolicy.grossPremium)} />
          </DetailSection>

          {/* Insured */}
          <DetailSection title="Insured Details">
            <DetailRow label="Insured ID"          value={fmt(selectedPolicy.insuredID)} />
            <DetailRow label="Full Name"           value={`${fmt(selectedPolicy.insSurname)} ${fmt(selectedPolicy.insFirstname)} ${fmt(selectedPolicy.insOthernames, '')}`} />
            <DetailRow label="Address"             value={fmt(selectedPolicy.insAddress)} />
            <DetailRow label="Mobile"              value={fmt(selectedPolicy.insMobilePhone)} />
            <DetailRow label="Email"               value={fmt(selectedPolicy.insEmail)} />
            <DetailRow label="Occupation"          value={fmt(selectedPolicy.insOccupation)} />
          </DetailSection>

          {/* Parties */}
          <DetailSection title="Parties">
            <DetailRow label="Party ID"            value={fmt(selectedPolicy.partyID)} />
            <DetailRow label="Party Name"          value={fmt(selectedPolicy.party)} />
            <DetailRow label="Leader ID"           value={fmt(selectedPolicy.leaderID)} />
            <DetailRow label="Leader Name"         value={fmt(selectedPolicy.leader)} />
            <DetailRow label="Marketing Staff ID"  value={fmt(selectedPolicy.mktStaffID)} />
            <DetailRow label="Marketing Staff"     value={fmt(selectedPolicy.mktStaff)} />
          </DetailSection>

          {/* Currency */}
          <DetailSection title="Currency & Exchange">
            <DetailRow label="Currency"            value={fmt(selectedPolicy.exCurrency)} />
            <DetailRow label="Exchange Rate"       value={fmt(selectedPolicy.exRate)} />
          </DetailSection>

          {/* Audit */}
          <DetailSection title="Audit Info">
            <DetailRow label="Submitted By"        value={fmt(selectedPolicy.submittedBy)} />
            <DetailRow label="Submitted On"        value={fmtDate(selectedPolicy.submittedOn)} />
            <DetailRow label="Modified By"         value={fmt(selectedPolicy.modifiedBy)} />
            <DetailRow label="Modified On"         value={fmtDate(selectedPolicy.modifiedOn)} />
            <DetailRow label="Is Proposal"         value={selectedPolicy.isProposal === 1 ? 'Yes' : 'No'} />
            <DetailRow label="Active"              value={selectedPolicy.active === 1 ? 'Yes' : 'No'} />
          </DetailSection>
        </div>

        <div className="pb-8" />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // EDIT MODE
  // ════════════════════════════════════════════════════════════
  return (
    <div className="max-w-4xl mx-auto">
      <Header />

      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-5">

          {/* Dates */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-1">Policy Dates</h3>
            <div className="border-b border-gray-200 mb-5" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <EditField label="Entry Date" name="entryDate" error={fieldErrors.entryDate}>
                <input type="date" name="entryDate" value={form.entryDate ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.entryDate)} />
              </EditField>
              <EditField label="Start Date" name="startDate" required error={fieldErrors.startDate}>
                <input type="date" name="startDate" value={form.startDate ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.startDate)} />
              </EditField>
              <EditField label="Expiry Date" name="expiryDate" required error={fieldErrors.expiryDate}>
                <input type="date" name="expiryDate" value={form.expiryDate ?? ''} onChange={handleChange} min={form.startDate} className={inputCls(!!fieldErrors.expiryDate)} />
              </EditField>
            </div>
          </div>

          {/* Branch & Business */}
          <EditSection title="Branch & Business">
            <EditField label="Branch ID" name="branchId" required error={fieldErrors.branchId}>
              <input type="text" name="branchId" value={form.branchId ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.branchId)} />
            </EditField>
            <EditField label="Branch Name" name="branchName" error={fieldErrors.branchName}>
              <input type="text" name="branchName" value={form.branchName ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.branchName)} />
            </EditField>
            <EditField label="Business Source" name="bizSource" error={fieldErrors.bizSource}>
              <input type="text" name="bizSource" value={form.bizSource ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.bizSource)} />
            </EditField>
            <EditField label="Company Abbreviation" name="companyAbrev" error={fieldErrors.companyAbrev}>
              <input type="text" name="companyAbrev" value={form.companyAbrev ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.companyAbrev)} />
            </EditField>
            <EditField label="Business Type" name="businessType" error={fieldErrors.businessType}>
              <select name="businessType" value={form.businessType ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.businessType)}>
                <option value="">Select business type</option>
                <option value="NEW">New Business</option>
                <option value="RENEWAL">Renewal</option>
                <option value="ENDORSEMENT">Endorsement</option>
              </select>
            </EditField>
            <EditField label="Class Type" name="classType" error={fieldErrors.classType}>
              <select name="classType" value={form.classType ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.classType)}>
                <option value="">Select class type</option>
                <option value="FACULTATIVE">Facultative</option>
                <option value="TREATY">Treaty</option>
                <option value="PROPORTIONAL">Proportional</option>
                <option value="NON_PROPORTIONAL">Non-Proportional</option>
              </select>
            </EditField>
          </EditSection>

          {/* Risk Details */}
          <EditSection title="Risk Details">
            <EditField label="Sub-Risk ID" name="subRiskId" required error={fieldErrors.subRiskId}>
              <input type="text" name="subRiskId" value={form.subRiskId ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.subRiskId)} />
            </EditField>
            <EditField label="Sub-Risk Name" name="subRiskName" error={fieldErrors.subRiskName}>
              <input type="text" name="subRiskName" value={form.subRiskName ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.subRiskName)} />
            </EditField>
            <EditField label="Co-Policy Number" name="coPolicyNo" error={fieldErrors.coPolicyNo}>
              <input type="text" name="coPolicyNo" value={form.coPolicyNo ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.coPolicyNo)} />
            </EditField>
            <EditField label="Business Proportion (%)" name="businessProportion" error={fieldErrors.businessProportion}>
              <input type="number" name="businessProportion" value={form.businessProportion ?? 0} onChange={handleChange} min={0} max={100} step={0.01} className={inputCls(!!fieldErrors.businessProportion)} />
            </EditField>
          </EditSection>

          {/* INSURED DETAILS - NEW SECTION */}
          <EditSection title="Insured Details">
            <EditField label="Insured ID" name="insuredId" required error={fieldErrors.insuredId}>
              <input type="text" name="insuredId" value={form.insuredId ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.insuredId)} />
            </EditField>
            <EditField label="Surname" name="insSurname" error={fieldErrors.insSurname}>
              <input type="text" name="insSurname" value={form.insSurname ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.insSurname)} />
            </EditField>
            <EditField label="First Name" name="insFirstname" error={fieldErrors.insFirstname}>
              <input type="text" name="insFirstname" value={form.insFirstname ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.insFirstname)} />
            </EditField>
            <EditField label="Other Names" name="insOthernames" error={fieldErrors.insOthernames}>
              <input type="text" name="insOthernames" value={form.insOthernames ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.insOthernames)} />
            </EditField>
            <EditField label="Address" name="insAddress" error={fieldErrors.insAddress}>
              <input type="text" name="insAddress" value={form.insAddress ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.insAddress)} />
            </EditField>
            <EditField label="Mobile Phone" name="insMobilePhone" error={fieldErrors.insMobilePhone}>
              <input type="text" name="insMobilePhone" value={form.insMobilePhone ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.insMobilePhone)} />
            </EditField>
            <EditField label="Email" name="insEmail" error={fieldErrors.insEmail}>
              <input type="email" name="insEmail" value={form.insEmail ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.insEmail)} />
            </EditField>
            <EditField label="Occupation" name="insOccupation" error={fieldErrors.insOccupation}>
              <input type="text" name="insOccupation" value={form.insOccupation ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.insOccupation)} />
            </EditField>
          </EditSection>

          {/* Parties */}
          <EditSection title="Parties">
            <EditField label="Party ID" name="partyId" error={fieldErrors.partyId}>
              <input type="text" name="partyId" value={form.partyId ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.partyId)} />
            </EditField>
            <EditField label="Leader ID" name="leaderId" error={fieldErrors.leaderId}>
              <input type="text" name="leaderId" value={form.leaderId ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.leaderId)} />
            </EditField>
            <EditField label="Leader Name" name="leaderName" error={fieldErrors.leaderName}>
              <input type="text" name="leaderName" value={form.leaderName ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.leaderName)} />
            </EditField>
            <EditField label="Marketing Staff ID" name="marketingStaffId" error={fieldErrors.marketingStaffId}>
              <input type="text" name="marketingStaffId" value={form.marketingStaffId ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.marketingStaffId)} />
            </EditField>
          </EditSection>

          {/* Currency */}
          <EditSection title="Currency & Exchange">
            <EditField label="Currency" name="currency" required error={fieldErrors.currency}>
              <select name="currency" value={form.currency ?? ''} onChange={handleChange} className={inputCls(!!fieldErrors.currency)}>
                <option value="">Select currency</option>
                <option value="NGN">NGN – Nigerian Naira</option>
                <option value="USD">USD – US Dollar</option>
                <option value="GBP">GBP – British Pound</option>
                <option value="EUR">EUR – Euro</option>
                <option value="GHS">GHS – Ghanaian Cedi</option>
              </select>
            </EditField>
            <EditField label="Exchange Rate" name="exchangeRate" required error={fieldErrors.exchangeRate}>
              <input type="number" name="exchangeRate" value={form.exchangeRate ?? 1} onChange={handleChange} min={0.0001} step={0.0001} className={inputCls(!!fieldErrors.exchangeRate)} />
            </EditField>
          </EditSection>

          {/* AUDIT INFO - READ-ONLY SECTION */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-1">Audit Information</h3>
            <div className="border-b border-gray-200 mb-5" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Submitted By</label>
                <input
                  type="text"
                  value={form.submittedBy ?? ''}
                  disabled
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Submitted On</label>
                <input
                  type="text"
                  value={form.submittedOn ? new Date(form.submittedOn).toLocaleString() : ''}
                  disabled
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Modified By</label>
                <input
                  type="text"
                  value={form.modifiedBy ?? ''}
                  disabled
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Modified On</label>
                <input
                  type="text"
                  value={form.modifiedOn ? new Date(form.modifiedOn).toLocaleString() : ''}
                  disabled
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Is Proposal</label>
                <input
                  type="text"
                  value={selectedPolicy.isProposal === 1 ? 'Yes' : 'No'}
                  disabled
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Active</label>
                <input
                  type="text"
                  value={selectedPolicy.active === 1 ? 'Yes' : 'No'}
                  disabled
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => setMode('view')}
            disabled={loading}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FacultativeInwardDetail;