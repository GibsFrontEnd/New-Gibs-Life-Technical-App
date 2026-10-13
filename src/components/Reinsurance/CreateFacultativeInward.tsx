// src/components/reinsurance/CreateFacultativeInward.tsx
//@ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../features/store';
import { createFacInPolicy } from '../../features/reducers/reinsuranceReducers/reinsuranceSlice';
import { CreateFacultativeInwardDto } from '../../types/reinsurance';

// Toast Component
const Toast = ({ 
  type, 
  message, 
  onClose,
  policyNo 
}: { 
  type: 'success' | 'error'; 
  message: string; 
  onClose: () => void;
  policyNo?: string;
}) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className={`rounded-lg shadow-lg p-4 min-w-[320px] ${
        type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {type === 'success' ? (
              <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message}
            </p>
            {policyNo && type === 'success' && (
              <p className="text-xs text-green-600 mt-1 font-mono">
                Policy ID: {policyNo}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-500 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const today = () => new Date().toISOString().split('T')[0];

const initialForm: CreateFacultativeInwardDto = {
  entryDate: today(),
  startDate: today(),
  expiryDate: '',
  branchId: '',
  branchName: '',
  bizSource: '',
  subRiskId: '',
  subRiskName: '',
  partyId: '',
  marketingStaffId: '',
  insuredId: '',
  insSurname: '',
  insFirstname: '',
  insOthernames: '',
  insAddress: '',
  insMobilePhone: '',
  insEmail: '',
  insOccupation: '',
  coPolicyNo: '',
  leaderId: '',
  leaderName: '',
  currency: 'NGN',
  exchangeRate: 1,
  businessProportion: 100,
  businessType: '',
  classType: '',
  companyAbrev: '',
};

const CreateFacultativeInward: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.reinsurance);
  
  const [form, setForm] = useState<CreateFacultativeInwardDto>(initialForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CreateFacultativeInwardDto, string>>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string; policyNo?: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string, policyNo?: string) => {
    setToast({ type, message, policyNo });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
    if (fieldErrors[name as keyof CreateFacultativeInwardDto]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof CreateFacultativeInwardDto, string>> = {};
    if (!form.entryDate) errors.entryDate = 'Required';
    if (!form.startDate) errors.startDate = 'Required';
    if (!form.expiryDate) errors.expiryDate = 'Required';
    if (form.expiryDate && form.startDate && form.expiryDate <= form.startDate)
      errors.expiryDate = 'Must be after start date';
    if (!form.branchId) errors.branchId = 'Required';
    if (!form.subRiskId) errors.subRiskId = 'Required';
    if (!form.insuredId) errors.insuredId = 'Required';
    if (!form.currency) errors.currency = 'Required';
    if (!form.businessType) errors.businessType = 'Required';
    if (!form.classType) errors.classType = 'Required';
    if (form.exchangeRate <= 0) errors.exchangeRate = 'Must be greater than 0';
    if (form.businessProportion < 0 || form.businessProportion > 100)
      errors.businessProportion = 'Must be 0–100';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateFacultativeInwardDto = {
      ...form,
      entryDate: new Date(form.entryDate).toISOString(),
      startDate: new Date(form.startDate).toISOString(),
      expiryDate: new Date(form.expiryDate).toISOString(),
    };

    try {
      const result = await dispatch(createFacInPolicy(payload));
      
      if (createFacInPolicy.fulfilled.match(result)) {
        const policyNo = result.payload?.policyNo || 'Policy';
        showToast('success', 'Policy created successfully!', policyNo);
        setForm(initialForm);
        setTimeout(() => {
          navigate('/reinsurance/facultative-inwards');
        }, 2000);
      } else {
        const errorMessage = result.payload?.message || result.error?.message || 'Failed to create policy';
        showToast('error', errorMessage);
      }
    } catch (err) {
      showToast('error', err.message || 'An unexpected error occurred');
    }
  };

  const inputCls = (field: keyof CreateFacultativeInwardDto) =>
    `w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
      fieldErrors[field]
        ? 'border-red-300 focus:ring-red-200 bg-red-50'
        : 'border-gray-300 focus:ring-primary/20 focus:border-primary'
    }`;

  const Field = ({
    label,
    name,
    required,
    children,
  }: {
    label: string;
    name: keyof CreateFacultativeInwardDto;
    required?: boolean;
    children: React.ReactNode;
  }) => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {fieldErrors[name] && (
        <p className="text-xs text-red-500 mt-1">{fieldErrors[name]}</p>
      )}
    </div>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-1">{title}</h3>
      <div className="border-b border-gray-200 mb-5" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-8 md:pb-8">
      {toast && (
        <Toast 
          type={toast.type} 
          message={toast.message} 
          policyNo={toast.policyNo}
          onClose={() => setToast(null)} 
        />
      )}

      <div className="mb-6">
        <button
          onClick={() => navigate('/reinsurance/facultative-inwards')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2 transition-colors"
        >
          ← Back to Facultative Inwards
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Create Facultative Inward Policy</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details to register a new facultative inward policy.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-5">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-1">Policy Dates</h3>
            <div className="border-b border-gray-200 mb-5" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Field label="Entry Date" name="entryDate" required>
                <input type="date" name="entryDate" value={form.entryDate} onChange={handleChange} className={inputCls('entryDate')} />
              </Field>
              <Field label="Start Date" name="startDate" required>
                <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className={inputCls('startDate')} />
              </Field>
              <Field label="Expiry Date" name="expiryDate" required>
                <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} min={form.startDate} className={inputCls('expiryDate')} />
              </Field>
            </div>
          </div>

          <Section title="Branch & Business">
            <Field label="Branch ID" name="branchId" required>
              <input type="text" name="branchId" value={form.branchId} onChange={handleChange} placeholder="e.g. 200" className={inputCls('branchId')} />
            </Field>
            <Field label="Branch Name" name="branchName">
              <input type="text" name="branchName" value={form.branchName} onChange={handleChange} placeholder="e.g. ABUJA" className={inputCls('branchName')} />
            </Field>
            <Field label="Business Source" name="bizSource">
              <input type="text" name="bizSource" value={form.bizSource} onChange={handleChange} placeholder="e.g. DIRECT" className={inputCls('bizSource')} />
            </Field>
            <Field label="Company Abbreviation" name="companyAbrev">
              <input type="text" name="companyAbrev" value={form.companyAbrev} onChange={handleChange} placeholder="e.g. ABC Re" className={inputCls('companyAbrev')} />
            </Field>
            <Field label="Business Type" name="businessType" required>
              <select name="businessType" value={form.businessType} onChange={handleChange} className={inputCls('businessType')}>
                <option value="">Select business type</option>
                <option value="NEW">New Business</option>
                <option value="RENEWAL">Renewal</option>
                <option value="ENDORSEMENT">Endorsement</option>
              </select>
            </Field>
            <Field label="Class Type" name="classType" required>
              <select name="classType" value={form.classType} onChange={handleChange} className={inputCls('classType')}>
                <option value="">Select class type</option>
                <option value="FACULTATIVE">Facultative</option>
                <option value="TREATY">Treaty</option>
                <option value="PROPORTIONAL">Proportional</option>
                <option value="NON_PROPORTIONAL">Non-Proportional</option>
              </select>
            </Field>
          </Section>

          <Section title="Risk Details">
            <Field label="Sub-Risk ID" name="subRiskId" required>
              <input type="text" name="subRiskId" value={form.subRiskId} onChange={handleChange} placeholder="e.g. 2001" className={inputCls('subRiskId')} />
            </Field>
            <Field label="Sub-Risk Name" name="subRiskName">
              <input type="text" name="subRiskName" value={form.subRiskName} onChange={handleChange} placeholder="e.g. FIRE & SPECIAL PERILS" className={inputCls('subRiskName')} />
            </Field>
            <Field label="Co-Policy Number" name="coPolicyNo">
              <input type="text" name="coPolicyNo" value={form.coPolicyNo} onChange={handleChange} placeholder="e.g. POL/2024/001" className={inputCls('coPolicyNo')} />
            </Field>
            <Field label="Business Proportion (%)" name="businessProportion">
              <input type="number" name="businessProportion" value={form.businessProportion} onChange={handleChange} min={0} max={100} step={0.01} className={inputCls('businessProportion')} />
            </Field>
          </Section>

          <Section title="Insured Details">
            <Field label="Insured ID" name="insuredId" required>
              <input type="text" name="insuredId" value={form.insuredId} onChange={handleChange} placeholder="e.g. INS2604805794589" className={inputCls('insuredId')} />
            </Field>
            <Field label="Surname" name="insSurname">
              <input type="text" name="insSurname" value={form.insSurname} onChange={handleChange} placeholder="Surname" className={inputCls('insSurname')} />
            </Field>
            <Field label="First Name" name="insFirstname">
              <input type="text" name="insFirstname" value={form.insFirstname} onChange={handleChange} placeholder="First name" className={inputCls('insFirstname')} />
            </Field>
            <Field label="Other Names" name="insOthernames">
              <input type="text" name="insOthernames" value={form.insOthernames} onChange={handleChange} placeholder="Other names" className={inputCls('insOthernames')} />
            </Field>
            <Field label="Address" name="insAddress">
              <input type="text" name="insAddress" value={form.insAddress} onChange={handleChange} placeholder="Address" className={inputCls('insAddress')} />
            </Field>
            <Field label="Mobile Phone" name="insMobilePhone">
              <input type="tel" name="insMobilePhone" value={form.insMobilePhone} onChange={handleChange} placeholder="Mobile number" className={inputCls('insMobilePhone')} />
            </Field>
            <Field label="Email" name="insEmail">
              <input type="email" name="insEmail" value={form.insEmail} onChange={handleChange} placeholder="Email address" className={inputCls('insEmail')} />
            </Field>
            <Field label="Occupation" name="insOccupation">
              <input type="text" name="insOccupation" value={form.insOccupation} onChange={handleChange} placeholder="Occupation" className={inputCls('insOccupation')} />
            </Field>
          </Section>

          <Section title="Parties">
            <Field label="Party ID" name="partyId">
              <input type="text" name="partyId" value={form.partyId} onChange={handleChange} placeholder="Broker / intermediary ID" className={inputCls('partyId')} />
            </Field>
            <Field label="Leader ID" name="leaderId">
              <input type="text" name="leaderId" value={form.leaderId} onChange={handleChange} placeholder="Lead reinsurer ID" className={inputCls('leaderId')} />
            </Field>
            <Field label="Leader Name" name="leaderName">
              <input type="text" name="leaderName" value={form.leaderName} onChange={handleChange} placeholder="Lead reinsurer name" className={inputCls('leaderName')} />
            </Field>
            <Field label="Marketing Staff ID" name="marketingStaffId">
              <input type="text" name="marketingStaffId" value={form.marketingStaffId} onChange={handleChange} placeholder="Staff ID" className={inputCls('marketingStaffId')} />
            </Field>
          </Section>

          <Section title="Currency & Exchange">
            <Field label="Currency" name="currency" required>
              <select name="currency" value={form.currency} onChange={handleChange} className={inputCls('currency')}>
                <option value="">Select currency</option>
                <option value="NGN">NGN – Nigerian Naira</option>
                <option value="USD">USD – US Dollar</option>
                <option value="GBP">GBP – British Pound</option>
                <option value="EUR">EUR – Euro</option>
                <option value="GHS">GHS – Ghanaian Cedi</option>
              </select>
            </Field>
            <Field label="Exchange Rate" name="exchangeRate" required>
              <input type="number" name="exchangeRate" value={form.exchangeRate} onChange={handleChange} min={0.0001} step={0.0001} className={inputCls('exchangeRate')} />
            </Field>
          </Section>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pb-8 md:pb-8">
          <button
            type="button"
            onClick={() => navigate('/reinsurance/facultative-inwards')}
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
                Creating...
              </>
            ) : (
              'Create Policy'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateFacultativeInward;