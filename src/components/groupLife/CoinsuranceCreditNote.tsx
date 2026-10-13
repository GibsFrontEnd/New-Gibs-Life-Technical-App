// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { SERVER_URL } from "../../utils/constants";
import Select, { SingleValue } from "react-select";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useLocation, useOutletContext, useNavigate } from "react-router-dom";
import {
    ChevronDown,
    ChevronRight,
    Save,
    Loader2,
    Eye,
    Edit,
    Trash2,
    FileText,
    User,
    Calendar,
    Building,
    Briefcase,
    CreditCard,
    Info,
    Clock,
    Users,
    Plus,
    Calculator,
    RefreshCw,
    ArrowLeft,
    Check,
    FileSpreadsheet,
    UserCheck,
    Building2,
    Receipt
} from "lucide-react";
import type { RootState, AppDispatch } from "../../features/store";
import { toast } from "@/components/ui/use-toast";
import Input from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/new-button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppSelector } from "../../hooks/use-apps";

// Import from the slice
import {
    prefillCoinsuranceCreditNote,
    loadCoinsuranceCreditNote,
    amendCoinsuranceCreditNote,
    calculateCoinsuranceCreditNote,
    raiseCoinsuranceCreditNote,
    selectCoinsuranceCreditNote,
    clearCurrentCoinsuranceCreditNote,
    clearCoinsuranceCreditNoteErrors,
    loadDebitNote, 
} from "../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";
import { getAllBranches } from "../../features/reducers/companyReducers/branchSlice";
import { getAllAgents } from "../../features/reducers/csuReducers/agentSlice";
import { fetchMktStaffs, selectMarketingStaff } from "../../features/reducers/companyReducers/marketingStaffSlice";

// --- CONFIGURATION ---
export const MAX_PROPORTION_LIMIT = 100;

// Interfaces
interface CoinsuranceCreditNoteState {
    policyNo: string;
    refDebitNoteNo: string;
    type: string;
    billingDate: string;
    startDate: string;
    endDate: string;
    participantId: string;
    insuredName: string;
    narration: string;
    bizOption: string;
    sumInsured: number;
    grossPremium: number;
    businessPropPercent: number;
    commissionRate: number;
    commissionAmount: number;
    whtAmount: number;
    netPremium: number;
    recordParticipation: boolean;
    totalSumInsured: number;
    totalPremium: number;
    creditNoteNo?: string;
    noteType?: string;
    participantName?: string;
    leaderId?: string;
    leaderName?: string;
    mktStaffId?: string;
    mktStaffName?: string;
    insuredId?: string;
    branchId?: string;
    bizSource?: string;
    subRiskId?: string;
    subRisk?: string;
    exRate: number;
    exCurrency: string;
    sumInsuredFrgn: number;
    grossPremiumFrgn: number;
    approval: number;
    editable: boolean;
    lockReason: string;
    showOrcSection: boolean;
    showCurrencyPanel: boolean;
    submittedBy: string;
    submittedOn: string;
    totalSumInsuredCalc: number;
    totalPremiumCalc: number;
    shareSumInsured: number;
    sharePremium: number;
    ourPropPercent: number;
    ourSumInsured: number;
    ourPremium: number;
    orcRate: number;
    orcAmount: number;
    whtRate: number;
    whtDeductedFromNet: boolean;
    exchangeRate: number;
    currency: string;
}

const CoinsuranceCreditNote = () => {
    // ✅ Get both policyNo and dncnNo from URL params
    const { policyNo: urlPolicyNo, dncnNo: urlDncnNo } = useParams<{ policyNo: string; dncnNo: string }>();
    // Add at the top with other state
    const hasPrefilledRef = useRef(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    
    // ✅ Use dncnNo from URL or state
    const dncnNo = urlDncnNo || location.state?.refDebitNoteNo || '';
    const policyNo = urlPolicyNo || location.state?.policyNo || '';
    
    // Get data from Redux slice
    const {
        currentCoinsuranceCreditNote,
        calculatedCoinsuranceCreditNote,
        raisedCoinsuranceCreditNote,
        loading,
        error
    } = useSelector(selectCoinsuranceCreditNote);

    const { branches } = useSelector((state: RootState) => state.branches);
    const { agents } = useSelector((state: RootState) => state.parties);
    const { mktStaffs } = useAppSelector(selectMarketingStaff);

    // Local state for view mode
    const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit' | 'view'>(() => {
        // Check if we're editing an existing note or creating a new one
        if (location.state?.creditNoteNo) {
            return 'edit';
        }
        if (location.state?.refDebitNoteNo) {
            return 'add';
        }
        return 'add';
    });
    
    const [selectedNote, setSelectedNote] = useState<any>(null);
    const [localLoading, setLocalLoading] = useState(false);
    const [exchangeRateLoading, setExchangeRateLoading] = useState(false);

    const [debitNoteParticipants, setDebitNoteParticipants] = useState<any[]>([]);
const hasFetchedDebitNoteRef = useRef(false);
    
    const { isReadOnly } = useOutletContext<{ isReadOnly: boolean }>() || { isReadOnly: false };

    // Initialize form data with default values
    const [formData, setFormData] = useState<CoinsuranceCreditNoteState>({
        policyNo: policyNo || "",
        refDebitNoteNo: "",
        type: "CN",
        billingDate: new Date().toISOString().split('T')[0],
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        participantId: "",
        insuredName: "",
        narration: "",
        bizOption: "DIRECT",
        sumInsured: 0,
        grossPremium: 0,
        businessPropPercent: 0,
        commissionRate: 0,
        commissionAmount: 0,
        whtAmount: 0,
        netPremium: 0,
        recordParticipation: false,
        totalSumInsured: 0,
        totalPremium: 0,
        creditNoteNo: "",
        noteType: "",
        participantName: "",
        leaderId: "",
        leaderName: "",
        mktStaffId: "",
        mktStaffName: "",
        insuredId: "",
        branchId: "",
        bizSource: "DIRECT",
        subRiskId: "",
        subRisk: "",
        exRate: 1,
        exCurrency: "NGN",
        sumInsuredFrgn: 0,
        grossPremiumFrgn: 0,
        approval: 0,
        editable: true,
        lockReason: "",
        showOrcSection: true,
        showCurrencyPanel: true,
        submittedBy: "",
        submittedOn: "",
        totalSumInsuredCalc: 0,
        totalPremiumCalc: 0,
        shareSumInsured: 0,
        sharePremium: 0,
        ourPropPercent: 0,
        ourSumInsured: 0,
        ourPremium: 0,
        orcRate: 0,
        orcAmount: 0,
        whtRate: 0,
        whtDeductedFromNet: true,
        exchangeRate: 1,
        currency: "NGN",
    });

    // Sections expansion state
    const [expandedSections, setExpandedSections] = useState({
        reference: true,
        details: true,
        premium: true,
        participant: true,
        approval: false
    });

    // --- CURRENCY EXCHANGE RATE FETCHER ---
    const fetchExchangeRate = async (fromCurrency: string, toCurrency: string = "NGN") => {
        if (fromCurrency === toCurrency) {
            setFormData(prev => ({ ...prev, exchangeRate: 1, exRate: 1 }));
            return;
        }

        setExchangeRateLoading(true);
        try {
            const endpoints = [
                `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`,
                `https://api.exchangeratesapi.io/latest?base=${fromCurrency}`,
            ];

            let rate = null;
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.rates) {
                            rate = data.rates[toCurrency] || data.rates[toCurrency.toUpperCase()];
                            if (rate) break;
                        }
                    }
                } catch (e) {
                    console.warn(`Failed to fetch from ${endpoint}`, e);
                    continue;
                }
            }

            if (rate) {
                setFormData(prev => ({ ...prev, exchangeRate: rate, exRate: rate }));
                toast({
                    description: `Exchange rate updated: 1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`,
                    variant: "default"
                });
            } else {
                const fallbackRates: Record<string, number> = {
                    'USD': 1500,
                    'EUR': 1600,
                    'GBP': 1850,
                    'NGN': 1
                };
                const fallbackRate = fallbackRates[fromCurrency] || 1;
                setFormData(prev => ({ ...prev, exchangeRate: fallbackRate, exRate: fallbackRate }));
                toast({
                    description: `Using approximate rate: 1 ${fromCurrency} = ${fallbackRate} ${toCurrency}`,
                    variant: "default"
                });
            }
        } catch (error) {
            console.error("Exchange rate fetch error:", error);
            toast({
                description: "Failed to fetch exchange rate. Using default rate.",
                variant: "destructive"
            });
        } finally {
            setExchangeRateLoading(false);
        }
    };

    // --- FETCH REFERENCE DATA ---
    useEffect(() => {
        const UNDERWRITING_API = SERVER_URL;
        dispatch(getAllBranches({ baseUrl: UNDERWRITING_API }));
        dispatch(getAllAgents({ pageNumber: 1, pageSize: 100, baseUrl: UNDERWRITING_API }));
        dispatch(fetchMktStaffs({ baseUrl: UNDERWRITING_API }));
    }, [dispatch]);

    // --- LOAD FROM SLICE WHEN DATA CHANGES ---
    useEffect(() => {
        if (currentCoinsuranceCreditNote) {
            const data = currentCoinsuranceCreditNote;
            
            setFormData(prev => ({
                ...prev,
                policyNo: data.policyNo || prev.policyNo,
                refDebitNoteNo: data.refDebitNoteNo || prev.refDebitNoteNo,
                type: data.noteType || data.type || "CN",
                creditNoteNo: data.creditNoteNo || "",
                noteType: data.noteType || "CN",
                billingDate: data.billingDate ? new Date(data.billingDate).toISOString().split('T')[0] : prev.billingDate,
                startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : prev.startDate,
                endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : prev.endDate,
                            participantId: prev.participantId || data.participantId || "",
            participantName: prev.participantName || data.participantName || "",
                insuredName: data.insuredName || "",
                insuredId: data.insuredId || "",
                branchId: data.branchId || "",
                bizSource: data.bizSource || "DIRECT",
                bizOption: data.bizOption || "DIRECT",
                subRiskId: data.subRiskId || "",
                subRisk: data.subRisk || "",
                sumInsured: data.premium?.totalSumInsured || 0,
                grossPremium: data.premium?.totalPremium || 0,
                businessPropPercent: data.premium?.businessPropPercent || 0,
                totalSumInsured: data.premium?.totalSumInsured || 0,
                totalPremium: data.premium?.totalPremium || 0,
                shareSumInsured: data.premium?.shareSumInsured || 0,
                sharePremium: data.premium?.sharePremium || 0,
                ourPropPercent: data.premium?.ourPropPercent || 0,
                ourSumInsured: data.premium?.ourSumInsured || 0,
                ourPremium: data.premium?.ourPremium || 0,
                commissionRate: data.premium?.commissionRate || 0,
                commissionAmount: data.premium?.commissionAmount || 0,
                whtRate: data.premium?.whtRate || 0,
                whtAmount: data.premium?.whtAmount || 0,
                netPremium: data.premium?.netPremium || 0,
                orcRate: data.premium?.orcRate || 0,
                orcAmount: data.premium?.orcAmount || 0,
                whtDeductedFromNet: data.premium?.whtDeductedFromNet !== undefined ? data.premium.whtDeductedFromNet : true,
                exRate: data.exRate || 1,
                exCurrency: data.exCurrency || "NGN",
                currency: data.exCurrency || "NGN",
                exchangeRate: data.exRate || 1,
                sumInsuredFrgn: data.sumInsuredFrgn || 0,
                grossPremiumFrgn: data.grossPremiumFrgn || 0,
                approval: data.approval || 0,
                editable: data.editable !== undefined ? data.editable : true,
                lockReason: data.lockReason || "",
                showOrcSection: data.showOrcSection !== undefined ? data.showOrcSection : true,
                showCurrencyPanel: data.showCurrencyPanel !== undefined ? data.showCurrencyPanel : true,
                submittedBy: data.submittedBy || "",
                submittedOn: data.submittedOn || "",
                narration: data.narration || `Being coinsurance credit note for policy ${policyNo}`,
                leaderId: data.leaderId || "",
                leaderName: data.leaderName || "",
                mktStaffId: data.mktStaffId || "",
                mktStaffName: data.mktStaffName || "",
            }));
        }
    }, [currentCoinsuranceCreditNote, policyNo]);

    // --- AUTO-FILL ON ADD MODE ---
    useEffect(() => {
        if (viewMode === 'add' && policyNo && !hasPrefilledRef.current) {
            const loadAutoFill = async () => {
                setLocalLoading(true);
                try {
                    const refDebitNoteNo = location.state?.refDebitNoteNo || dncnNo || "";
                    const creditNoteType = location.state?.type || "CN";

                    if (!refDebitNoteNo) {
                        toast({
                            description: "Reference Debit Note Number is required.",
                            variant: "warning"
                        });
                        setLocalLoading(false);
                        return;
                    }

                    hasPrefilledRef.current = true;

                   const result = await dispatch(prefillCoinsuranceCreditNote({
    policyNo: policyNo,
    refDebitNoteNo: refDebitNoteNo,
    type: creditNoteType
})).unwrap();

                    if (result) {
                        toast({ 
                            description: "Form auto-filled from debit note.", 
                            variant: "default" 
                        });
                    }
                } catch (error: any) {
                    console.error("Auto-fill error", error);
                    toast({
                        description: error?.message || "Failed to auto-fill form.",
                        variant: "destructive"
                    });
                    hasPrefilledRef.current = false;
                } finally {
                    setLocalLoading(false);
                }
            };
            loadAutoFill();
        }
    }, [viewMode, policyNo, dncnNo, dispatch, location]);
    

    // --- VIEW NOTE ---
    const handleViewNote = async (dncnNo: string) => {
        setLocalLoading(true);
        try {
            await dispatch(loadCoinsuranceCreditNote(dncnNo)).unwrap();
            setViewMode('view');
        } catch (error: any) {
            console.error("Failed to fetch coinsurance credit note details", error);
            toast({
                description: error?.message || "Failed to load coinsurance credit note details.",
                variant: "destructive"
            });
        } finally {
            setLocalLoading(false);
        }
    };

    // ✅ ADD — fetch the real coinsurance participants from the debit note
useEffect(() => {
    const refDebitNoteNo = location.state?.refDebitNoteNo || dncnNo;

    if (refDebitNoteNo && !hasFetchedDebitNoteRef.current) {
        hasFetchedDebitNoteRef.current = true;

        const fetchParticipants = async () => {
            try {
                const result = await dispatch(loadDebitNote({ dncnNo: refDebitNoteNo })).unwrap();

                const options = (result?.coinsuranceLines || []).map((line: any) => ({
                    value: line.participantId,
                    label: line.participantName,
                    raw: line,
                }));

                setDebitNoteParticipants(options);

                if (options.length === 0) {
                    toast({
                        description: "This debit note has no underwriting companies saved on it.",
                        variant: "warning"
                    });
                }
            } catch (error: any) {
                console.error("Failed to load debit note participants:", error);
                toast({
                    description: error?.message || "Could not load underwriting companies from the debit note.",
                    variant: "destructive"
                });
            }
        };

        fetchParticipants();
    }
}, [dncnNo, location.state, dispatch]);


    // --- RECALCULATE ---
    const handleRecalculate = async () => {
        if (!formData.policyNo || !formData.participantId) {
            toast({ 
                description: "Policy No and Participant ID are required for recalculation.", 
                variant: "destructive" 
            });
            return;
        }

        setLocalLoading(true);
        try {
            const payload = {
                totalSumInsured: formData.totalSumInsured || formData.sumInsured || 0,
                totalPremium: formData.totalPremium || formData.grossPremium || 0,
                businessPropPercent: formData.businessPropPercent || 0,
                ourPropPercent: formData.ourPropPercent || 0,
                commissionRate: formData.commissionRate || 0,
                whtRate: formData.whtRate || 0,
                orcRate: formData.orcRate || 0,
                deductWhtFromNet: formData.whtDeductedFromNet !== undefined ? formData.whtDeductedFromNet : true
            };

            const result = await dispatch(calculateCoinsuranceCreditNote(payload)).unwrap();

            if (result) {
                setFormData(prev => ({
                    ...prev,
                    totalSumInsuredCalc: result.totalSumInsured || 0,
                    totalPremiumCalc: result.totalPremium || 0,
                    businessPropPercent: result.businessPropPercent || prev.businessPropPercent || 0,
                    shareSumInsured: result.shareSumInsured || 0,
                    sharePremium: result.sharePremium || 0,
                    ourPropPercent: result.ourPropPercent || prev.ourPropPercent || 0,
                    ourSumInsured: result.ourSumInsured || 0,
                    ourPremium: result.ourPremium || 0,
                    commissionRate: result.commissionRate || prev.commissionRate || 0,
                    commissionAmount: result.commissionAmount || 0,
                    whtRate: result.whtRate || prev.whtRate || 0,
                    whtAmount: result.whtAmount || 0,
                    netPremium: result.netPremium || 0,
                    orcRate: result.orcRate || prev.orcRate || 0,
                    orcAmount: result.orcAmount || 0,
                    whtDeductedFromNet: result.whtDeductedFromNet !== undefined ? result.whtDeductedFromNet : true
                }));
                toast({
                    description: `✅ Coinsurance Credit Note recalculated successfully! Net: ${formatCurrency(result.netPremium || prev.netPremium)}`,
                    variant: "default"
                });
            }
        } catch (error: any) {
            console.error("Recalculate error:", error);
            toast({
                description: error?.message || "Failed to recalculate. Please check your inputs.",
                variant: "destructive"
            });
        } finally {
            setLocalLoading(false);
        }
    };

    // --- SAVE / RAISE CREDIT NOTE ---
    const handleSave = async () => {
        if (!policyNo) {
            toast({ description: "Policy Number is missing.", variant: "destructive" });
            return;
        }

        if (!formData.refDebitNoteNo) {
            toast({ description: "Reference Debit Note Number is required.", variant: "destructive" });
            return;
        }
        if (!formData.insuredName) {
            toast({ description: "Insured Name is required.", variant: "destructive" });
            return;
        }

        setLocalLoading(true);
        try {
            const formatDate = (date: string) => {
                if (!date) return new Date().toISOString();
                if (date.includes('T')) return date;
                return new Date(date).toISOString();
            };

            const payload = {
                policyNo: formData.policyNo,
                refDebitNoteNo: formData.refDebitNoteNo,
                type: formData.type || "CN",
                billingDate: formatDate(formData.billingDate),
                startDate: formatDate(formData.startDate),
                endDate: formatDate(formData.endDate),
                participantId: formData.participantId,
                insuredName: formData.insuredName || "",
                narration: formData.narration || `Being coinsurance credit note for policy ${policyNo}`,
                bizOption: formData.bizOption || "DIRECT",
                sumInsured: Number(formData.sumInsured) || 0,
                grossPremium: Number(formData.grossPremium) || 0,
                businessPropPercent: Number(formData.businessPropPercent) || 0,
                commissionRate: Number(formData.commissionRate) || 0,
                commissionAmount: Number(formData.commissionAmount) || 0,
                whtAmount: Number(formData.whtAmount) || 0,
                netPremium: Number(formData.netPremium) || 0,
                recordParticipation: formData.recordParticipation !== undefined ? formData.recordParticipation : false,
                totalSumInsured: Number(formData.totalSumInsured) || 0,
                totalPremium: Number(formData.totalPremium) || 0,
            };

            const result = await dispatch(raiseCoinsuranceCreditNote(payload)).unwrap();

            toast({
                description: `✅ Coinsurance Credit Note ${result.creditNoteNo} raised successfully!`,
                variant: "default",
                duration: 4000,
            });

            setFormData(prev => ({
                ...prev,
                policyNo: prev.policyNo,
                refDebitNoteNo: prev.refDebitNoteNo,
                type: prev.type,
                billingDate: prev.billingDate,
                startDate: prev.startDate,
                endDate: prev.endDate,
                bizOption: prev.bizOption,
                participantId: "",
                participantName: "",
                insuredName: "",
                narration: "",
                sumInsured: 0,
                grossPremium: 0,
                businessPropPercent: 0,
                commissionRate: 0,
                commissionAmount: 0,
                whtAmount: 0,
                netPremium: 0,
                totalSumInsured: 0,
                totalPremium: 0,
                shareSumInsured: 0,
                sharePremium: 0,
                ourPropPercent: 0,
                ourSumInsured: 0,
                ourPremium: 0,
                orcRate: 0,
                orcAmount: 0,
                whtRate: 0,
                creditNoteNo: result.creditNoteNo || "",
            }));

            dispatch(clearCurrentCoinsuranceCreditNote());

            navigate(
                `/underwriting/group-life-quotations/${encodeURIComponent(policyNo)}?tab=credit-note`
              );
            
        } catch (error: any) {
            console.error("Save error:", error);
            toast({
                description: error?.message || "Failed to raise Coinsurance Credit Note. Please check your inputs and try again.",
                variant: "destructive"
            });
        } finally {
            setLocalLoading(false);
        }
    };

    // --- AMEND ---
    const handleAmend = async () => {
        if (!formData.creditNoteNo) {
            toast({ description: "Credit Note Number is missing.", variant: "destructive" });
            return;
        }

        setLocalLoading(true);
        try {
            const payload = {
                billingDate: new Date(formData.billingDate).toISOString(),
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
                participantId: formData.participantId,
                insuredName: formData.insuredName || "",
                narration: formData.narration || "",
                sumInsured: formData.sumInsured || 0,
                grossPremium: formData.grossPremium || 0,
                businessPropPercent: formData.businessPropPercent || 0,
                commissionRate: formData.commissionRate || 0,
                commissionAmount: formData.commissionAmount || 0,
                whtAmount: formData.whtAmount || 0,
                netPremium: formData.netPremium || 0,
            };

            await dispatch(amendCoinsuranceCreditNote({
                dncnNo: formData.creditNoteNo,
                data: payload
            })).unwrap();

            toast({
                description: `✅ Coinsurance Credit Note ${formData.creditNoteNo} updated successfully!`,
                variant: "default"
            });
            
            await dispatch(loadCoinsuranceCreditNote(formData.creditNoteNo)).unwrap();
            setViewMode('view');
            
        } catch (error: any) {
            console.error("Amend error", error);
            toast({
                description: error?.message || "Failed to amend Coinsurance Credit Note.",
                variant: "destructive"
            });
        } finally {
            setLocalLoading(false);
        }
    };

    // --- CANCEL ---
    const handleCancel = () => {
        dispatch(clearCurrentCoinsuranceCreditNote());
        dispatch(clearCoinsuranceCreditNoteErrors());
        navigate(-1);
    };

    // --- HANDLERS ---
    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleValueChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCurrencyChange = async (selectedCurrency: string) => {
        const currentCurrency = formData.currency;
        setFormData(prev => ({ ...prev, currency: selectedCurrency, exCurrency: selectedCurrency }));
        if (selectedCurrency !== currentCurrency) {
            await fetchExchangeRate(selectedCurrency, "NGN");
        } else {
            setFormData(prev => ({ ...prev, exchangeRate: 1, exRate: 1 }));
        }
    };

    const handleNoteTypeChange = (type: string) => {
        setFormData(prev => ({ ...prev, type }));
        toast({
            description: type === 'CN' ? 'Credit Note mode selected' : 'Reversal mode selected',
            variant: "default"
        });
    };

    // --- OPTIONS ---
    const branchOptions = branches.map((b: any) => ({ value: b.branchID, label: b.description || b.branchName }));
    const agentOptions = agents.map((a: any) => ({ 
        value: a.agentID || a.id || '',
        label: a.agent || a.name || 'Unnamed Agent'
    }));
    
    const mktStaffOptions = mktStaffs.map((m: any) => ({ value: m.mktStaffID, label: m.staffName || `${m.surname} ${m.firstname}` }));

    const noteTypeOptions = [
        { value: "CN", label: "Credit Note" },
        { value: "REVERSAL", label: "Reversal" }
    ];

    const currencyOptions = [
        { value: "NGN", label: "🇳🇬 NGN" },
        { value: "USD", label: "🇺🇸 USD" },
        { value: "GBP", label: "🇬🇧 GBP" },
        { value: "EUR", label: "🇪🇺 EUR" }
    ];

    const bizOptionOptions = [
        { value: "DIRECT", label: "DIRECT" },
        { value: "BROKER", label: "BROKER" },
        { value: "AGENT", label: "AGENT" }
    ];

    const formatCurrency = (amount: any) => {
        return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(amount) || 0);
    };

    // ✅ ALL FIELDS ARE EDITABLE - Remove isEditable restriction
    const isEditable = viewMode !== 'view' && !isReadOnly && formData.approval !== 2;

    // --- RENDER FUNCTIONS ---
    const renderSectionHeader = (section: keyof typeof expandedSections, title: string, icon: React.ReactNode, rightElement?: React.ReactNode) => (
        <div
            className="p-5 bg-gradient-to-r from-white to-slate-50 border-b border-slate-200 cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors rounded-t-xl"
            onClick={() => toggleSection(section)}
        >
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                {expandedSections[section] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                {icon}
                {title}
            </h3>
            {rightElement && (
                <div onClick={(e) => e.stopPropagation()}>
                    {rightElement}
                </div>
            )}
        </div>
    );

    // ✅ FIXED: renderSelectField - ALL fields are editable
    const renderSelectField = (label: string, options: any[], value: any, onChange: (val: string) => void, placeholder: string, isDisabled?: boolean) => (
        <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</Label>
            <Select
                options={options}
                value={options.find(o => o.value === value) || null}
                onChange={(opt: any) => onChange(opt?.value || "")}
                classNamePrefix="react-select"
                placeholder={placeholder}
                isSearchable={true}
                isDisabled={isDisabled || false}
                className="text-sm"
            />
        </div>
    );

    // ✅ FIXED: renderInputField - ALL fields are editable
    const renderInputField = (label: string, name: string, value: any, onChange: any, type: string = "text", disabled?: boolean, className?: string) => (
        <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</Label>
            <Input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled || false}
                className={`h-11 ${className || ''}`}
            />
        </div>
    );

    // --- VIEW MODE ---
    if (viewMode === 'view' && currentCoinsuranceCreditNote) {
        const note = currentCoinsuranceCreditNote;
        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans text-slate-900 min-h-screen bg-slate-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10 pb-6 border-b border-slate-200">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                        Coinsurance Credit Note: {note.creditNoteNo}
                    </h1>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => navigate(-1)} className="mr-2">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        {!isReadOnly && note.editable && note.approval !== 2 && (
                            <Button variant="outline" onClick={() => setViewMode('edit')} className="mr-2">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                            </Button>
                        )}
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 md:p-8 border-l-4 border-l-blue-600 hover:shadow-lg transition-all">
                    <h3 className="text-lg font-semibold text-slate-900 mb-6 pb-4 border-b border-slate-200 flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-600" /> Coinsurance Credit Note Details
                    </h3>
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">
                        {JSON.stringify(note, null, 2)}
                    </pre>
                </div>
            </div>
        );
    }

    // --- EDIT/ADD MODE ---
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans text-slate-900 min-h-screen bg-slate-50">
            {loading.new || loading.load && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading data...
                </div>
            )}

            {error.new && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    ❌ Error: {error.new}
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10 pb-6 border-b border-slate-200">
                <div>
                    <Button
                        variant="ghost"
                        onClick={handleCancel}
                        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Button>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                        {viewMode === 'add' ? 'New Coinsurance Credit Note' : 'Edit Coinsurance Credit Note'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Policy: {policyNo}
                        {formData.creditNoteNo && ` | CN: ${formData.creditNoteNo}`}
                        {!isEditable && formData.approval === 2 && ` | 🔒 Approved - Read Only`}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={handleCancel} className="mr-2">Cancel</Button>
                    {viewMode === 'edit' && isEditable ? (
                        <Button onClick={handleAmend} disabled={localLoading}>
                            {localLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Update Note
                        </Button>
                    ) : viewMode === 'add' ? (
                        <Button onClick={handleSave} disabled={localLoading || !formData.refDebitNoteNo}>
                            {localLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Raise Note
                        </Button>
                    ) : null}
                </div>
            </div>

            <div className="space-y-6 relative">
                {(localLoading || loading.new || loading.load || loading.raise || loading.amend || loading.calculate) && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="text-sm font-medium text-slate-600">Processing...</p>
                        </div>
                    </div>
                )}

                {/* 1. Reference Information - ALL FIELDS EDITABLE */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    {renderSectionHeader('reference', 'Reference Information', <FileText className="w-5 h-5 text-blue-600" />)}
                    {expandedSections.reference && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 md:p-8">
                            {renderInputField('Credit Note No', 'creditNoteNo', formData.creditNoteNo || 'New', handleInputChange, 'text', false, '')}
                            {renderInputField('Ref Debit Note No *', 'refDebitNoteNo', formData.refDebitNoteNo, handleInputChange, 'text', false)}
                            {renderSelectField('Note Type', noteTypeOptions, formData.type, (val) => handleNoteTypeChange(val), 'Select Type', false)}
                            {renderInputField('Billing Date', 'billingDate', formData.billingDate, handleInputChange, 'date')}
                            {renderInputField('Start Date', 'startDate', formData.startDate, handleInputChange, 'date')}
                            {renderInputField('End Date', 'endDate', formData.endDate, handleInputChange, 'date')}
                            {renderSelectField('Business Option', bizOptionOptions, formData.bizOption, (val) => handleValueChange('bizOption', val), 'Select Option', false)}
                            {renderSelectField('Branch', branchOptions, formData.branchId, (val) => handleValueChange('branchId', val), 'Select Branch', false)}
                        </div>
                    )}
                </div>

                {/* 2. Participant & Insured Details - ALL FIELDS EDITABLE */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    {renderSectionHeader('participant', 'Participant & Insured Details', <Users className="w-5 h-5 text-blue-600" />)}
                    {expandedSections.participant && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 md:p-8">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Participant Company *
                                </Label>
                                <Select
    options={debitNoteParticipants}
    value={debitNoteParticipants.find(o => o.value === formData.participantId) || null}
    onChange={(selectedOption: any) => {
        if (selectedOption && selectedOption.value) {
            setFormData(prev => ({
                ...prev,
                participantId: selectedOption.value,
                participantName: selectedOption.label
            }));
        } else {
            setFormData(prev => ({ ...prev, participantId: "", participantName: "" }));
        }
    }}
    classNamePrefix="react-select"
    placeholder="Select Participant Company"
    isSearchable={true}
    isDisabled={false}
    className="text-sm"
    menuPortalTarget={document.body}
    styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
/>
                            </div>
                            {renderInputField('Participant Name', 'participantName', formData.participantName || '', handleInputChange, 'text', false, '')}
                            {renderInputField('Insured Name *', 'insuredName', formData.insuredName, handleInputChange, 'text')}
                            {renderInputField('Insured ID', 'insuredId', formData.insuredId || '', handleInputChange, 'text', false, '')}
                            {renderInputField('Leader ID', 'leaderId', formData.leaderId || '', handleInputChange, 'text', false, '')}
                            {renderInputField('Leader Name', 'leaderName', formData.leaderName || '', handleInputChange, 'text', false, '')}
                            {renderSelectField('Marketing Staff', mktStaffOptions, formData.mktStaffId, (val) => {
                                const selected = mktStaffs.find((s: any) => s.mktStaffID === val);
                                setFormData(prev => ({
                                    ...prev,
                                    mktStaffId: val || "",
                                    mktStaffName: selected?.staffName || `${selected?.surname} ${selected?.firstname}` || ""
                                }));
                            }, 'Select Staff', false)}
                            {renderInputField('Sub Risk', 'subRisk', formData.subRisk || '', handleInputChange, 'text', false, '')}
                            <div className="lg:col-span-4">
                                {renderInputField('Narration', 'narration', formData.narration, handleInputChange, 'text')}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Premium & Calculations - Some fields editable, some read-only */}
<div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
    {renderSectionHeader(
        'premium',
        'Premium & Calculations',
        <span className="w-5 h-5 text-blue-600 font-bold flex items-center justify-center">₦</span>,
        expandedSections.premium && (
            <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                    e.stopPropagation();
                    handleRecalculate();
                }}
                disabled={localLoading || !formData.policyNo || !formData.participantId}
            >
                <RefreshCw className={`w-3 h-3 mr-2 ${localLoading ? 'animate-spin' : ''}`} />
                Recalculate
            </Button>
        )
    )}
    {expandedSections.premium && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 md:p-8">
            <div className="lg:col-span-4 mt-2 mb-2">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Figures</h4>
            </div>
            
            {/* ✅ READ-ONLY - Disabled (calculated from debit note) */}
            {renderInputField('Total Sum Insured', 'totalSumInsured', String(formData.totalSumInsured), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}
            {/* ✅ READ-ONLY - Disabled (calculated from debit note) */}
            {renderInputField('Total Premium', 'totalPremium', String(formData.totalPremium), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}
            
            {/* ✅ EDITABLE - Rate field (user can change) */}
            {renderInputField('Business Prop %', 'businessPropPercent', String(formData.businessPropPercent), handleInputChange, 'number')}
            {/* ✅ EDITABLE - Rate field (user can change) */}
            {renderInputField('Our Prop %', 'ourPropPercent', String(formData.ourPropPercent), handleInputChange, 'number')}

            <div className="lg:col-span-4 mt-4 mb-2">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Share Figures</h4>
            </div>
            
            {/* ✅ READ-ONLY - Disabled (calculated) */}
            {renderInputField('Share Sum Insured', 'shareSumInsured', String(formData.shareSumInsured), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}
            {/* ✅ READ-ONLY - Disabled (calculated) */}
            {renderInputField('Share Premium', 'sharePremium', String(formData.sharePremium), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}
            {/* ✅ READ-ONLY - Disabled (calculated) */}
            {renderInputField('Our Sum Insured', 'ourSumInsured', String(formData.ourSumInsured), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}
            {/* ✅ READ-ONLY - Disabled (calculated) */}
            {renderInputField('Our Premium', 'ourPremium', String(formData.ourPremium), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}

            <div className="lg:col-span-4 mt-4 mb-2">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Commission & Levies</h4>
            </div>
            
            {/* ✅ EDITABLE - Rate field (user can change) */}
            {renderInputField('Commission Rate %', 'commissionRate', String(formData.commissionRate), handleInputChange, 'number')}
            {/* ✅ READ-ONLY - Disabled (calculated) */}
            {renderInputField('Commission Amount', 'commissionAmount', String(formData.commissionAmount), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}
            
            {/* ✅ EDITABLE - Rate field (user can change) */}
            {renderInputField('WHT Rate %', 'whtRate', String(formData.whtRate), handleInputChange, 'number')}
            {/* ✅ READ-ONLY - Disabled (calculated) */}
            {renderInputField('WHT Amount', 'whtAmount', String(formData.whtAmount), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}
            
            {/* ✅ EDITABLE - Rate field (user can change) */}
            {renderInputField('ORC Rate %', 'orcRate', String(formData.orcRate), handleInputChange, 'number')}
            {/* ✅ READ-ONLY - Disabled (calculated) */}
            {renderInputField('ORC Amount', 'orcAmount', String(formData.orcAmount), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}
            
            {/* ✅ READ-ONLY - Disabled (calculated) */}
            {renderInputField('Net Premium', 'netPremium', String(formData.netPremium), handleInputChange, 'number', true, 'bg-slate-100 text-blue-700 font-bold h-11')}
            
           

            <div className="lg:col-span-4 mt-4 flex justify-center">
                <Button
                    onClick={(e) => {
                        e.preventDefault();
                        handleRecalculate();
                    }}
                    disabled={localLoading || !formData.policyNo || !formData.participantId}
                    type="button"
                >
                    {localLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calculator className="w-4 h-4 mr-2" />}
                    Calculate All
                </Button>
            </div>
        </div>
    )}
</div>

                {/* 4. Foreign Currency Section - ALL FIELDS EDITABLE */}
                {formData.showCurrencyPanel && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                        {renderSectionHeader('details', 'Currency', <CreditCard className="w-5 h-5 text-blue-600" />)}
                        {expandedSections.details && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 md:p-8">
                                {renderInputField('Sum Insured ', 'sumInsuredFrgn', String(formData.sumInsuredFrgn), handleInputChange, 'number')}
                                {renderInputField('Gross Premium 3', 'grossPremiumFrgn', String(formData.grossPremiumFrgn), handleInputChange, 'number')}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Currency</Label>
                                    <div className="flex gap-2">
                                        <Select
                                            options={currencyOptions}
                                            value={currencyOptions.find(c => c.value === formData.exCurrency) || null}
                                            onChange={(opt) => {
                                                if (opt?.value) {
                                                    handleCurrencyChange(opt.value);
                                                }
                                            }}
                                            classNamePrefix="react-select"
                                            placeholder="Select Currency"
                                            isSearchable={false}
                                            isDisabled={false}
                                            className="flex-1 text-sm"
                                        />
                                        {exchangeRateLoading && (
                                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Exchange Rate</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            name="exRate"
                                            value={String(formData.exRate)}
                                            disabled={false}
                                            className="h-11 flex-1"
                                            onChange={handleInputChange}
                                        />
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => fetchExchangeRate(formData.exCurrency || "NGN", "NGN")}
                                            disabled={exchangeRateLoading}
                                            className="h-11 px-3"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${exchangeRateLoading ? 'animate-spin' : ''}`} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                

                {/* Footer Actions */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    {viewMode === 'edit' && isEditable ? (
                        <Button onClick={handleAmend} disabled={localLoading}>
                            {localLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Update Note
                        </Button>
                    ) : viewMode === 'add' ? (
                        <Button onClick={handleSave} disabled={localLoading || !formData.refDebitNoteNo}>
                            {localLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Raise Note
                        </Button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default CoinsuranceCreditNote;