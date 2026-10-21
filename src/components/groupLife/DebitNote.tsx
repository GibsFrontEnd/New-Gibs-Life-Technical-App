// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import { SERVER_URL } from "../../utils/constants";
import Select, { SingleValue } from "react-select";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useLocation, useOutletContext, useNavigate } from "react-router-dom";
import { schemeUrl } from "../../utils/groupLifeNav";
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
    BriefcaseIcon,
    Users,
    Plus,
    Calculator,
    RefreshCw,
    ArrowLeft,
    Check
} from "lucide-react";
import type { RootState, AppDispatch } from "../../features/store";
import { toast } from "@/components/ui/use-toast";
import Input from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/new-button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppSelector } from "../../hooks/use-apps";

// Import from the updated slice
import {
    fetchDebitNotes,
    prefillDebitNote,
    loadDebitNote,
    refreshDebitNote,
    calculateDebitNotePremium,
    distributeDebitNoteRisk,
    raiseDebitNote,
    updateDebitNote,
    approveDebitNote,
    selectDebitNote,
} from "../../features/reducers/groupLifeReducers/groupLifeQuotationSlice";
import { getAllBranches } from "../../features/reducers/companyReducers/branchSlice";
import { getAllAgents } from "../../features/reducers/csuReducers/agentSlice";
import { fetchMktStaffs, selectMarketingStaff } from "../../features/reducers/companyReducers/marketingStaffSlice";

// Import the DebitNoteList component
import DebitNoteList from "./DebitNoteList";

// --- CONFIGURATION ---
export const MAX_PROPORTION_LIMIT = 100;

// Interfaces
interface CoinsuranceDistribution {
    partyID: string;
    partyName: string;
    propRate: number;
    propValue: number;
    propPremium: number;
    commRate: number;
    commValue: number;
    orcRate: number;
    orcValue: number;
    vatRate: number;
    vatValue: number;
    netPremium: number;
    isLead: boolean;
}

interface DebitNoteState {
    // API Payload fields
    policyNo: string;
    detailId: number;
    riskClass: string;
    branchId: string;
    bizSource: string;
    bizOption: string;
    billingDate: string;
    startDate: string;
    endDate: string;
    insuredName: string;
    narration: string;
    transGuid: string;
    paymentType: string;
    creditRefNo: string;
    totalRiskSumInsured: number;
    totalRiskPremium: number;
    sumInsured: number;
    grossPremium: number;
    ourSharePercent: number;
    commissionRate: number;
    commissionAmount: number;
    whtRate: number;
    whtAmount: number;
    netPremium: number;
    exRate: number;
    exCurrency: string;
    sumInsuredFrgn: number;
    grossPremiumFrgn: number;
    coinsuranceLines: CoinsuranceDistribution[];
    postCommissionCreditNote: boolean;
    postCoinsuranceCreditNotes: boolean;
    postCoinsuranceOrcDebitNotes: boolean;
    postLeadOrcCreditNotes: boolean;
    // UI fields
    dncnNo?: string;
    detailID?: string;
    branchID?: string;
    partyID?: string;
    partyName?: string;
    mktStaffID?: string;
    mktStaffName?: string;
    mktUnitID?: string;
    insuredID?: string;
    useOptionalInsured?: boolean;
    vatRate?: number;
    vatAmount?: number;
    businessProportion?: number;
    exchangeRate?: number;
    currency?: string;
    foreignSumInsured?: number;
    foreignPremium?: number;
    bankID?: string;
    sourceType?: string;
    coinsuranceDistribution: CoinsuranceDistribution[];
    marketingDistribution?: any[];
    creditStartDate?: string;
    approval?: number;
}

const DebitNote = () => {
    const { dncnNo: urlDncnNo } = useParams<{ dncnNo: string }>();
    const { policyNo: urlPolicyNo } = useParams<{ policyNo: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const {
        currentDebitNote,
        debitNoteList,
        debitNoteListTotalCount,
        debitNoteListTotalPages,
        calculatedPremium,
        distributedRisk,
        raisedDebitNote,
        approvedDebitNote,
        loading,
        error
    } = useSelector(selectDebitNote);

    const { branches } = useSelector((state: RootState) => state.branches);
    const { agents } = useSelector((state: RootState) => state.parties);
    const { mktStaffs } = useAppSelector(selectMarketingStaff);
    // For ".../debit-note/{policyNo}" the :dncnNo segment IS the policy number. The list's "New" button
    // passes no policyNo in state, which left policyNo empty: the form was not prefilled and, after
    // saving, the user was sent to the schemes list instead of the scheme's Debit Note tab.
    const policyNoFromPath =
        urlDncnNo && !location.pathname.includes('/view') && !location.pathname.includes('/edit')
            ? urlDncnNo
            : '';
    const policyNo = urlPolicyNo || location.state?.policyNo || policyNoFromPath || '';

    // The layout scrolls inside its own container, so a page opened from the middle of a long list would keep
    // that scroll position. Start every note form at the top.
    useEffect(() => {
        window.scrollTo(0, 0);
        document.querySelectorAll('main, [class*="overflow-y-auto"], [class*="overflow-auto"]').forEach((el) => {
            (el as HTMLElement).scrollTop = 0;
        });
    }, []);

    // ✅ FIXED: Check for mode from URL path or state
    const isNewMode = location.state?.mode === 'add' || location.pathname.includes('/new');
    const isViewMode = location.state?.mode === 'view' || location.pathname.includes('/view');
    const isEditMode = location.state?.mode === 'edit' || location.pathname.includes('/edit');

    const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit' | 'view'>(() => {
        // ✅ Check URL path first
        if (location.pathname.includes('/view')) {
            return 'view';
        }
        if (location.pathname.includes('/edit')) {
            return 'edit';
        }
        if (isNewMode || location.state?.detailID) {
            return 'add';
        }
        return 'list';
    });

    const [activeListView, setActiveListView] = useState<'old' | 'new'>('new');
    const [selectedNote, setSelectedNote] = useState<any>(null);
    const [localLoading, setLocalLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [exchangeRateLoading, setExchangeRateLoading] = useState(false);
    const [filters, setFilters] = useState({
        page: 1,
        pageSize: 50,
        status: undefined as number | undefined,
        fromDate: '',
        toDate: ''
    });
    const [saveSuccess, setSaveSuccess] = useState(false);
    const hasPrefilledDebitNoteRef = useRef(false);

    const { isReadOnly } = useOutletContext<{ isReadOnly: boolean }>() || { isReadOnly: false };

    const [formData, setFormData] = useState<DebitNoteState>({
        policyNo: policyNo || "",
        detailId: 0,
        riskClass: "GroupLife",
        branchId: "",
        bizSource: "DIRECT",
        bizOption: "DIRECT",
        billingDate: new Date().toISOString(),
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        insuredName: "",
        narration: "",
        transGuid: `DN-${Date.now()}`,
        paymentType: "DIRECT CASH",
        creditRefNo: "N/A",
        totalRiskSumInsured: 0,
        totalRiskPremium: 0,
        sumInsured: 0,
        grossPremium: 0,
        ourSharePercent: 100,
        commissionRate: 0,
        commissionAmount: 0,
        whtRate: 0,
        whtAmount: 0,
        netPremium: 0,
        exRate: 1,
        exCurrency: "NGN",
        sumInsuredFrgn: 0,
        grossPremiumFrgn: 0,
        coinsuranceLines: [],
        postCommissionCreditNote: false,
        postCoinsuranceCreditNotes: false,
        postCoinsuranceOrcDebitNotes: false,
        postLeadOrcCreditNotes: false,
        detailID: "",
        branchID: "",
        partyID: "",
        partyName: "",
        mktStaffID: "",
        mktStaffName: "",
        mktUnitID: "",
        insuredID: "",
        useOptionalInsured: false,
        vatRate: 0,
        vatAmount: 0,
        businessProportion: 100,
        exchangeRate: 1,
        currency: "NGN",
        foreignSumInsured: 0,
        foreignPremium: 0,
        bankID: "N/A",
        sourceType: "DIRECT",
        coinsuranceDistribution: [],
        marketingDistribution: [],
        creditStartDate: new Date().toISOString(),
        approval: 0,
    });

    const [expandedSections, setExpandedSections] = useState({
        reference: true,
        details: true,
        premium: true,
        coinsurance: false,
        marketing: false,
        postFlags: false
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

    // --- FETCH DEBIT NOTES LIST ---
    useEffect(() => {
        if (viewMode === 'list' && policyNo) {
            fetchDebitNoteList();
        }
    }, [viewMode, policyNo, filters.page, filters.pageSize, filters.status]);

    const fetchDebitNoteList = async () => {
        setListLoading(true);
        try {
            await dispatch(fetchDebitNotes({
                policyNo: policyNo || '',
                page: filters.page,
                pageSize: filters.pageSize,
                status: filters.status,
                fromDate: filters.fromDate || undefined,
                toDate: filters.toDate || undefined,
            })).unwrap();
        } catch (error: any) {
            console.error('Failed to fetch debit notes:', error);
            toast({
                description: error?.message || 'Failed to fetch debit notes',
                variant: "destructive"
            });
        } finally {
            setListLoading(false);
        }
    };

    // --- AUTO-FILL ON ADD MODE ---
  // --- AUTO-FILL ON ADD MODE ---
useEffect(() => {
    if (viewMode === 'add' && policyNo && !hasPrefilledDebitNoteRef.current) {
        const loadAutoFill = async () => {
            setLocalLoading(true);
            try {
                // Get detailId from multiple possible sources
                let detailId = location.state?.detailId ||
                    location.state?.detailID ||
                    location.state?.detailID?.toString() ||
                    '';

                console.log('🔍 Auto-fill triggered with:', {
                    policyNo,
                    detailId,
                    locationState: location.state,
                    viewMode
                });

                if (!detailId && urlDncnNo) {
                    setLocalLoading(false);
                    return;
                }

                if (!detailId) {
                    toast({
                        description: "No detail ID provided. Cannot auto-fill form.",
                        variant: "warning"
                    });
                    setLocalLoading(false);
                    return;
                }

                const result = await dispatch(prefillDebitNote({
                    policyNo: policyNo,
                    detailId: Number(detailId),
                    riskClass: "GroupLife"
                })).unwrap();

                console.log('✅ Prefill API response:', result);

                if (result) {
                    // ✅ Extract premium data from nested object
                    const premiumData = result.premium || {};
                    
                    setFormData(prev => ({
                        ...prev,
                        // ✅ Policy & Detail
                        policyNo: result.policyNo || prev.policyNo,
                        detailId: result.detailId || prev.detailId,
                        detailID: result.detailId?.toString() || detailId.toString(),
                        
                        // ✅ Branch & Source
                        branchId: result.branchId || prev.branchId,
                        branchID: result.branchId || '',
                        bizSource: result.bizSource || prev.bizSource,
                        bizOption: result.bizOption || prev.bizOption,
                        sourceType: result.bizOption || prev.sourceType,
                        // DN, or CN for a Reversal / Return / Cancellation / Reduction section
                        noteType: result.noteType || prev.noteType,

                        // ✅ Parties
                        insuredName: result.insuredName || location.state?.insuredName || prev.insuredName,
                        insuredID: result.insuredId || '',
                        partyID: result.partyId || '',
                        partyName: result.partyName || '',
                        mktStaffID: result.mktStaffId || '',
                        mktStaffName: result.mktStaffName || '',
                        
                        // ✅ Dates
                        startDate: result.startDate ? new Date(result.startDate).toISOString() : prev.startDate,
                        endDate: result.endDate ? new Date(result.endDate).toISOString() : prev.endDate,
                        billingDate: result.billingDate ? new Date(result.billingDate).toISOString() : prev.billingDate,
                        
                        // ✅ Premium - Main fields
                        sumInsured: result.sumInsured || 0,
                        grossPremium: result.grossPremium || 0,
                        totalRiskSumInsured: result.totalRiskSumInsured || result.sumInsured || 0,
                        totalRiskPremium: result.totalRiskPremium || result.grossPremium || 0,
                        ourSharePercent: result.ourSharePercent || prev.ourSharePercent || 100,
                        businessProportion: result.ourSharePercent || prev.businessProportion || 100,
                        
                        // ✅ Premium - Details (from nested premium object)
                        commissionRate: premiumData.commissionRate || prev.commissionRate || 0,
                        commissionAmount: premiumData.commissionAmount || prev.commissionAmount || 0,
                        whtRate: premiumData.whtRate || prev.whtRate || 0,
                        whtAmount: premiumData.whtAmount || prev.whtAmount || 0,
                        netPremium: premiumData.netPremium || result.grossPremium || prev.netPremium || 0,
                        
                        // ✅ Currency
                        exRate: result.exRate || prev.exRate || 1,
                        exCurrency: result.exCurrency || prev.exCurrency || "NGN",
                        currency: result.exCurrency || prev.currency || "NGN",
                        exchangeRate: result.exRate || prev.exchangeRate || 1,
                        sumInsuredFrgn: result.sumInsuredFrgn || prev.sumInsuredFrgn || 0,
                        grossPremiumFrgn: result.grossPremiumFrgn || prev.grossPremiumFrgn || 0,
                        
                        // ✅ Payment & Other
                        paymentType: result.paymentType || prev.paymentType || "DIRECT CASH",
                        creditRefNo: result.creditRefNo || prev.creditRefNo || "N/A",
                        narration: result.narration || prev.narration || "",
                        transGuid: result.transGuid || `DN-${Date.now()}`,
                        
                        // ✅ Coinsurance - ALWAYS EMPTY for new debit notes
                        coinsuranceDistribution: [],
                        coinsuranceLines: [],
                        
                        // ✅ Approval
                        approval: result.approval || 0,
                    }));

                    hasPrefilledDebitNoteRef.current = true;

                    toast({
                        description: `✅ Form auto-filled for policy ${policyNo}.`,
                        variant: "default"
                    });
                }
            } catch (error: any) {
                console.error("Auto-fill error:", error);
                toast({
                    description: error?.message || "Failed to auto-fill form. Please fill in manually.",
                    variant: "destructive"
                });
                hasPrefilledDebitNoteRef.current = false;
            } finally {
                setLocalLoading(false);
            }
        };
        loadAutoFill();
    }
}, [viewMode, policyNo, location.state, urlDncnNo, dispatch]);
    // --- LOAD EXISTING DEBIT NOTE FOR VIEW/EDIT ---
    const dncnNoFromState = location.state?.debitNoteNo as string | undefined;

    useEffect(() => {
        if ((viewMode === 'view' || viewMode === 'edit') && dncnNoFromState) {
            const loadNote = async () => {
                setListLoading(true);
                try {
                    const result = await dispatch(loadDebitNote({ dncnNo: dncnNoFromState })).unwrap();
                    setSelectedNote(result);

                    // ✅ Extract premium data
                    const premiumData = result.premium || {};

                    setFormData(prev => ({
                        ...prev,
                        policyNo: result.policyNo || prev.policyNo,
                        detailId: result.detailId || prev.detailId,
                        branchId: result.branchId || prev.branchId,
                        bizSource: result.bizSource || prev.bizSource,
                        bizOption: result.bizOption || prev.bizOption,
                        billingDate: result.billingDate ? new Date(result.billingDate).toISOString() : prev.billingDate,
                        startDate: result.startDate ? new Date(result.startDate).toISOString() : prev.startDate,
                        endDate: result.endDate ? new Date(result.endDate).toISOString() : prev.endDate,
                        insuredName: result.insuredName || prev.insuredName,
                        narration: result.narration || prev.narration,
                        paymentType: result.paymentType || prev.paymentType,
                        creditRefNo: result.creditRefNo || prev.creditRefNo,
                        totalRiskSumInsured: result.totalRiskSumInsured || prev.totalRiskSumInsured,
                        totalRiskPremium: result.totalRiskPremium || prev.totalRiskPremium,
                        sumInsured: result.sumInsured || prev.sumInsured,
                        grossPremium: result.grossPremium || prev.grossPremium,
                        ourSharePercent: result.ourSharePercent || prev.ourSharePercent,
                        commissionRate: premiumData.commissionRate || prev.commissionRate || 0,
                        commissionAmount: premiumData.commissionAmount || prev.commissionAmount || 0,
                        whtRate: premiumData.whtRate || prev.whtRate || 0,
                        whtAmount: premiumData.whtAmount || prev.whtAmount || 0,
                        netPremium: premiumData.netPremium || prev.netPremium || 0,
                        exRate: result.exRate || prev.exRate || 1,
                        exCurrency: result.exCurrency || prev.exCurrency || "NGN",
                        sumInsuredFrgn: result.sumInsuredFrgn ?? prev.sumInsuredFrgn ?? 0,
                        grossPremiumFrgn: result.grossPremiumFrgn ?? prev.grossPremiumFrgn ?? 0,
                        coinsuranceDistribution: result.coinsuranceLines?.map((line: any) => ({
                            partyID: line.participantId || "",
                            partyName: line.participantName || "",
                            propRate: line.sharePercent || 0,
                            propValue: line.shareSumInsured || 0,
                            propPremium: line.sharePremium || 0,
                            commRate: line.commissionRate || 0,
                            commValue: line.commissionAmount || 0,
                            orcRate: line.orcRate || 0,
                            orcValue: line.orcAmount || 0,
                            vatRate: 0,
                            vatValue: 0,
                            netPremium: line.netPremium || 0,
                            isLead: line.isLead || false
                        })) || [],
                    }));
                } catch (error: any) {
                    console.error("Failed to load debit note:", error);
                    toast({
                        description: error?.message || "Failed to load debit note.",
                        variant: "destructive"
                    });
                    setViewMode('list');
                } finally {
                    setListLoading(false);
                }
            };
            loadNote();
        }
    }, [viewMode, dncnNoFromState, dispatch]);

    // --- VIEW NOTE ---
    const handleViewNote = async (dncnNo: string) => {
        setListLoading(true);
        try {
            const result = await dispatch(loadDebitNote({ dncnNo })).unwrap();
            setSelectedNote(result);

            // ✅ Populate formData so the view table has data to render
            setFormData(prev => ({
                ...prev,
                coinsuranceDistribution: result.coinsuranceLines?.map((line: any) => ({
                    partyID: line.participantId || "",
                    partyName: line.participantName || "",
                    propRate: line.sharePercent || 0,
                    propValue: line.shareSumInsured || 0,
                    propPremium: line.sharePremium || 0,
                    commRate: line.commissionRate || 0,
                    commValue: line.commissionAmount || 0,
                    orcRate: line.orcRate || 0,
                    orcValue: line.orcAmount || 0,
                    vatRate: 0,
                    vatValue: 0,
                    netPremium: line.netPremium || 0,
                    isLead: line.isLead || false
                })) || [],
            }));

            setViewMode('view');
        } catch (error: any) {
            console.error("Failed to fetch debit note details", error);
            toast({
                description: error?.message || "Failed to load debit note details.",
                variant: "destructive"
            });
        } finally {
            setListLoading(false);
        }
    };

    // --- REFRESH DEBIT NOTE ---
    const handleRefreshDebitNote = async (dncnNo: string) => {
        try {
            await dispatch(refreshDebitNote({ dncnNo })).unwrap();
            toast({
                description: `Debit note ${dncnNo} refreshed successfully`,
                variant: "default"
            });
            fetchDebitNoteList();
        } catch (error: any) {
            toast({
                description: error?.message || "Failed to refresh debit note",
                variant: "destructive"
            });
        }
    };

    // --- APPROVE DEBIT NOTE ---
    const handleApproveDebitNote = async (dncnNo: string) => {
        try {
            const result = await dispatch(approveDebitNote({
                dncnNo,
                approvalStatus: 2
            })).unwrap();
            toast({
                description: `✅ Debit note ${dncnNo} approved successfully. New number: ${result.debitNoteNo}`,
                variant: "default"
            });
            fetchDebitNoteList();
        } catch (error: any) {
            toast({
                description: error?.message || "Failed to approve debit note",
                variant: "destructive"
            });
        }
    };

    // --- RECALCULATE ---
    const handleRecalculate = async () => {
        if (!formData.policyNo) {
            toast({ description: "Policy No is required for recalculation.", variant: "destructive" });
            return;
        }

        setLocalLoading(true);
        try {
            const payload = {
                grossPremium: formData.grossPremium || formData.totalRiskPremium || 0,
                commissionRate: formData.commissionRate || 0,
                whtRate: formData.whtRate || 0,
                orcRate: 0, // Removed
                ncdfRate: 0, // Removed
                naicomLevyRate: 0, // Removed
                deductOrcFromNet: true
            };

            const result = await dispatch(calculateDebitNotePremium(payload)).unwrap();

            if (result) {
                setFormData(prev => ({
                    ...prev,
                    commissionAmount: result.commissionAmount ?? prev.commissionAmount,
                    whtAmount: result.whtAmount ?? 0,
                    netPremium: result.netPremium ?? prev.netPremium,
                }));
                toast({
                    description: `✅ Debit Note recalculated successfully! Net: ${formatCurrency(result.netPremium ?? formData.netPremium)}`,
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

    // --- DISTRIBUTE RISK ---
    const handleCalculateAllCoinsurance = async () => {
        if (!formData.policyNo) {
            toast({ description: "Policy No is required.", variant: "destructive" });
            return;
        }

        if (formData.coinsuranceDistribution.length === 0) {
            toast({ description: "Please add at least one coinsurance participant first.", variant: "destructive" });
            return;
        }

        setLocalLoading(true);
        try {
            const payload = {
                totalRiskSumInsured: formData.totalRiskSumInsured || formData.sumInsured || 0,
                totalRiskPremium: formData.totalRiskPremium || formData.grossPremium || 0,
                ourSharePercent: formData.ourSharePercent || 100,
                ourGrossPremium: formData.grossPremium || 0,
                lines: formData.coinsuranceDistribution.map((item, index) => ({
                    sn: index + 1,
                    participantId: item.partyID,
                    participantName: item.partyName,
                    sharePercent: item.propRate || 0,
                    commissionRate: item.commRate || 0,
                    orcRate: 0, // Removed
                    whtRate: 0,
                    isLead: item.isLead || false,
                    shareSumInsured: item.propValue || 0,
                    sharePremium: item.propPremium || 0,
                    commissionAmount: item.commValue || 0,
                    orcAmount: 0, // Removed
                    whtAmount: 0,
                    netPremium: item.netPremium || 0
                }))
            };

            const result = await dispatch(distributeDebitNoteRisk(payload)).unwrap();

            if (result && result.lines) {
                const updatedLines = result.lines.map((line: any) => ({
                    partyID: line.participantId,
                    partyName: line.participantName,
                    propRate: line.sharePercent || 0,
                    propValue: line.shareSumInsured || 0,
                    propPremium: line.sharePremium || 0,
                    commRate: line.commissionRate || 0,
                    commValue: line.commissionAmount || 0,
                    orcRate: 0, // Removed
                    orcValue: 0, // Removed
                    vatRate: 0,
                    vatValue: 0,
                    netPremium: line.netPremium || 0,
                    isLead: line.isLead || false
                }));

                setFormData(prev => ({
                    ...prev,
                    coinsuranceDistribution: updatedLines,
                    coinsuranceLines: updatedLines
                }));

                if (result.isBalanced) {
                    toast({
                        description: `✅ Distribution balanced! ${result.lines.length} participants`,
                        variant: "default"
                    });
                } else {
                    toast({
                        description: `⚠️ Distribution has errors: ${result.errors.join(', ')}`,
                        variant: "destructive"
                    });
                }
            }
        } catch (error: any) {
            console.error("Distribute error:", error);
            toast({
                description: error?.message || "Failed to distribute risk. Please check your inputs.",
                variant: "destructive"
            });
        } finally {
            setLocalLoading(false);
        }
    };

   // --- SAVE / RAISE DEBIT NOTE ---
const handleSave = async () => {
    if (!policyNo) {
        toast({ description: "Policy Number is missing.", variant: "destructive" });
        return;
    }

    // Validate required fields
    if (!formData.insuredName) {
        toast({ description: "Insured Name is required.", variant: "destructive" });
        return;
    }
    if (!formData.branchId && !formData.branchID) {
        toast({ description: "Branch is required.", variant: "destructive" });
        return;
    }

    setLocalLoading(true);
    try {
        const formatDateForBackend = (dateString: string) => {
            return new Date(dateString).toISOString();
        };

        const payload = {
            policyNo: formData.policyNo,
            detailId: formData.detailId || 0,
            riskClass: "GroupLife",
            branchId: formData.branchId || formData.branchID || "",
            bizSource: formData.bizSource || "DIRECT",
            bizOption: formData.bizOption || formData.sourceType || "DIRECT",
            billingDate: formatDateForBackend(formData.billingDate),
            startDate: formatDateForBackend(formData.startDate),
            endDate: formatDateForBackend(formData.endDate),
            insuredName: formData.insuredName || "",
            narration: formData.narration || "",
            transGuid: formData.transGuid || `DN-${Date.now()}`,
            paymentType: formData.paymentType || "DIRECT CASH",
            creditRefNo: formData.creditRefNo || "N/A",
            totalRiskSumInsured: formData.totalRiskSumInsured || 0,
            totalRiskPremium: formData.totalRiskPremium || 0,
            sumInsured: formData.sumInsured || 0,
            grossPremium: formData.grossPremium || 0,
            ourSharePercent: formData.ourSharePercent || 100,
            commissionRate: formData.commissionRate || 0,
            commissionAmount: formData.commissionAmount || 0,
            whtRate: formData.whtRate || 0,
            whtAmount: formData.whtAmount || 0,
            orcRate: 0,
            orcAmount: 0,
            netPremium: formData.netPremium || 0,
            exRate: formData.exRate || 1,
            exCurrency: formData.exCurrency || "NGN",
            sumInsuredFrgn: formData.sumInsuredFrgn || 0,
            grossPremiumFrgn: formData.grossPremiumFrgn || 0,
            coinsuranceLines: formData.coinsuranceDistribution.map((item, index) => ({
                sn: index + 1,
                participantId: item.partyID,
                participantName: item.partyName,
                sharePercent: item.propRate || 0,
                commissionRate: item.commRate || 0,
                orcRate: 0,
                whtRate: 0,
                isLead: item.isLead || false,
                shareSumInsured: item.propValue || 0,
                sharePremium: item.propPremium || 0,
                commissionAmount: item.commValue || 0,
                orcAmount: 0,
                whtAmount: 0,
                netPremium: item.netPremium || 0
            })),
            postCommissionCreditNote: formData.postCommissionCreditNote || false,
            postCoinsuranceCreditNotes: formData.postCoinsuranceCreditNotes || false,
            postCoinsuranceOrcDebitNotes: false,
            postLeadOrcCreditNotes: false,
        };

        if (viewMode === 'edit') {
            // Amend the existing note. This used to go through raiseDebitNote, so "Update Note"
            // quietly raised a second note instead of changing the one being edited.
            const noteNo = formData.dncnNo || location.state?.debitNoteNo || urlDncnNo || '';
            const updated = await dispatch(updateDebitNote({
                dncnNo: noteNo,
                request: {
                    ...payload,
                    partyId: formData.partyID || '',
                    partyName: formData.partyName || '',
                    mktStaffId: formData.mktStaffID || '',
                },
            })).unwrap();

            toast({
                description: `✅ Debit Note updated successfully! DN: ${updated.debitNoteNo || noteNo}`,
                variant: "success",
                duration: 5000,
            });
        } else {
            const result = await dispatch(raiseDebitNote(payload)).unwrap();

            toast({
                description: `✅ Debit Note raised successfully! DN: ${result.debitNoteNo}`,
                variant: "success",
                duration: 5000,
            });
        }

        // Land on the scheme's Debit Note tab
        navigate(schemeUrl(policyNo, 'debit-note'), { replace: true });

    } catch (error: any) {
        console.error("Save error", error);
        toast({
            description: error?.message || "Failed to raise Debit Note.",
            variant: "destructive"
        });
        setSaveSuccess(false);
    } finally {
        setLocalLoading(false);
    }
};

// --- CANCEL ---
const handleCancel = () => {
    // Go back to the scheme this note belongs to, on the tab the user came from. navigate(-1) only goes to
    // "whatever page was before", which was the endorsements list when the scheme was reached from there.
    const target = location.state?.returnTo;
    if (typeof target === 'string' && target.startsWith('/underwriting/group-life-quotations/')) {
        navigate(target, { replace: true });   // replace: the form must not stay in the history behind the scheme
        return;
    }
    if (policyNo) {
        const fromSections = viewMode === 'add' && location.state?.sourcePage === 'group-life-details';
        navigate(schemeUrl(policyNo, fromSections ? 'group-life' : 'debit-note'), { replace: true });
        return;
    }
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

    const handleAddCoinsuranceRow = () => {
        const currentCoinsuranceTotal = formData.coinsuranceDistribution.reduce(
            (sum, item) => sum + (item.propRate || 0), 0
        );
        const remaining = MAX_PROPORTION_LIMIT - currentCoinsuranceTotal;

        const newRow = {
            partyID: "",
            partyName: "",
            propRate: Math.max(0, remaining),
            propValue: formData.sumInsured || 0,
            propPremium: formData.grossPremium || 0,
            commRate: formData.commissionRate || 0,
            commValue: formData.commissionAmount || 0,
            orcRate: 0,
            orcValue: 0,
            vatRate: 0,
            vatValue: 0,
            netPremium: formData.netPremium || 0,
            isLead: false
        };

        setFormData(prev => ({
            ...prev,
            coinsuranceDistribution: [...prev.coinsuranceDistribution, newRow]
        }));
    };

    const handleCoinsuranceChange = (index: number, field: string, value: any) => {
        if (field === 'propRate') {
            const numValue = parseFloat(value) || 0;
            const otherRowsTotal = formData.coinsuranceDistribution.reduce((sum, item, i) =>
                i === index ? sum : sum + (item.propRate || 0), 0);
            const totalWithNewValue = otherRowsTotal + numValue;

            if (totalWithNewValue > MAX_PROPORTION_LIMIT) {
                toast({
                    description: `Coinsurance total cannot exceed ${MAX_PROPORTION_LIMIT}%. Current other rows total: ${otherRowsTotal}%. Max allowed for this row: ${MAX_PROPORTION_LIMIT - otherRowsTotal}%`,
                    variant: "destructive"
                });
                return;
            }
        }

        setFormData(prev => {
            const updated = [...prev.coinsuranceDistribution];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, coinsuranceDistribution: updated };
        });
    };

    const handleDeleteCoinsuranceRow = (index: number) => {
        setFormData(prev => ({
            ...prev,
            coinsuranceDistribution: prev.coinsuranceDistribution.filter((_, i) => i !== index)
        }));
    };

    // --- OPTIONS ---
    const branchOptions = branches.map((b: any) => ({ value: b.branchID, label: b.description || b.branchName }));
    const agentOptions = agents.map((a: any) => ({
        value: a.agentID || a.id || '',
        label: a.agent || a.name || 'Unnamed Agent'
    }));
    const mktStaffOptions = mktStaffs.map((m: any) => ({ value: m.mktStaffID, label: m.staffName || `${m.surname} ${m.firstname}` }));

    const paymentOptions = [
        { value: "DIRECT CASH", label: "Direct Cash" },
        { value: "DIRECT CHEQUE", label: "Direct Cheque" },
        { value: "CREDIT NOTE", label: "Credit Note" },
        { value: "CREDIT ADVISE", label: "Credit Advise" },
        { value: "TRANSFER", label: "TRANSFER" }
    ];

    const sourceOptions = [
        { value: "DIRECT", label: "DIRECT" },
        { value: "BROKER", label: "BROKER" },
        { value: "AGENT", label: "AGENT" }
    ];

    const currencyOptions = [
        { value: "NGN", label: "🇳🇬 NGN" },
        { value: "USD", label: "🇺🇸 USD" },
        { value: "GBP", label: "🇬🇧 GBP" },
        { value: "EUR", label: "🇪🇺 EUR" }
    ];

    const statusOptions = [
        { value: 0, label: "Draft" },
        { value: 1, label: "Pending" },
        { value: 2, label: "Approved" },
        { value: 3, label: "Rejected" }
    ];

    const formatCurrency = (amount: any) => {
        return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(amount) || 0);
    };

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

    const renderInputField = (label: string, name: string, value: any, onChange: any, type: string = "text", disabled?: boolean, className?: string) => (
        <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</Label>
            <Input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled }
                className={`h-11 ${className || ''}`}
            />
        </div>
    );

    // --- VIEW MODE ---
    if (viewMode === 'view' && selectedNote) {
        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans text-slate-900 min-h-screen bg-slate-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10 pb-6 border-b border-slate-200">
                    <div>
                        <Button
                            variant="ghost"
                            onClick={handleCancel}
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to List
                        </Button>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                            Debit Note: {selectedNote.debitNoteNo}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Policy: {selectedNote.policyNo}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {!isReadOnly && selectedNote.approval !== 2 && (
                            <>
                                <Button variant="outline" onClick={() => setViewMode('edit')} className="mr-2">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={() => {
                                        const noteNumber = selectedNote?.debitNoteNo || selectedNote?.dncnNo;
                                        if (noteNumber) {
                                            handleApproveDebitNote(noteNumber);
                                        }
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    Approve
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* ✅ VIEW MODE - READ ONLY */}
                <div className="space-y-6 relative">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="p-5 bg-gradient-to-r from-white to-slate-50 border-b border-slate-200 rounded-t-xl">
                            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <Info className="w-5 h-5 text-blue-600" />
                                Reference Information
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 md:p-8">
                            {renderInputField('Billing Date', 'billingDate', formData.billingDate.split("T")[0], () => { }, 'date', true, 'bg-slate-50')}
                            {renderSelectField('Payment Type', paymentOptions, formData.paymentType, () => { }, 'Select Type', true)}
                            {renderInputField('Credit Ref No', 'creditRefNo', formData.creditRefNo || '', () => { }, 'text', true, 'bg-slate-50')}
                            {renderInputField('Credit Start Date', 'creditStartDate', formData.creditStartDate?.split("T")[0] || '', () => { }, 'date', true, 'bg-slate-50')}
                            {renderSelectField('Branch *', branchOptions, formData.branchId || formData.branchID, () => { }, 'Select Branch', true)}
                            {renderSelectField('Business Source', sourceOptions, formData.bizSource, () => { }, 'Select Source', true)}
                            {(formData.bizSource === 'BROKER' || formData.bizSource === 'AGENT') && (
                                renderSelectField(
                                    `Select ${formData.bizSource === 'BROKER' ? 'Broker' : 'Agent'}`,
                                    agentOptions,
                                    formData.partyID,
                                    () => { },
                                    'Select Party',
                                    true
                                )
                            )}
                            {renderSelectField('Marketing Staff', mktStaffOptions, formData.mktStaffID, () => { }, 'Select Staff', true)}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Marketing Unit</Label>
                                <Input
                                    name="mktUnitID"
                                    value={
                                        formData.mktStaffID
                                            ? mktStaffs.find((s: any) => s.mktStaffID === formData.mktStaffID)?.mktGrpName
                                            || formData.mktUnitID
                                            || 'No unit assigned'
                                            : 'Select a staff first'
                                    }
                                    disabled
                                    className="bg-slate-50 text-slate-600 h-11"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="p-5 bg-gradient-to-r from-white to-slate-50 border-b border-slate-200 rounded-t-xl">
                            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                Policy Details
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 md:p-8">
                            {renderInputField('Policy No', 'policyNo', formData.policyNo, () => { }, 'text', true, 'bg-slate-50 text-slate-600')}
                            {renderInputField('Detail ID', 'detailId', String(formData.detailId), () => { }, 'text', true, 'bg-slate-50 text-slate-600')}
                            {renderInputField('Insured Name *', 'insuredName', formData.insuredName, () => { }, 'text', true, 'bg-slate-50')}
                            {renderInputField('Our Share (%)', 'ourSharePercent', String(formData.ourSharePercent), () => { }, 'number', true, 'bg-slate-50 text-slate-600')}
                            {renderInputField('Start Date', 'startDate', formData.startDate.split("T")[0], () => { }, 'date', true, 'bg-slate-50 text-slate-600')}
                            {renderInputField('End Date', 'endDate', formData.endDate.split("T")[0], () => { }, 'date', true, 'bg-slate-50 text-slate-600')}
                            <div className="space-y-2 lg:col-span-4">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Narration</Label>
                                <Input name="narration" value={formData.narration} disabled className="bg-slate-50 h-11" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="p-5 bg-gradient-to-r from-white to-slate-50 border-b border-slate-200 rounded-t-xl">
                            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <span className="w-5 h-5 text-blue-600 font-bold flex items-center justify-center">₦</span>
                                Premium
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 md:p-8">
                            <div className="lg:col-span-4 mt-2 mb-2">
                                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Premium</h4>
                            </div>
                            
                            {renderInputField('Sum Insured ', 'sumInsuredFrgn', String(formData.sumInsuredFrgn), () => { }, 'number', true, 'bg-slate-50')}
                            {renderInputField('Premium ', 'grossPremiumFrgn', String(formData.grossPremiumFrgn), () => { }, 'number', true, 'bg-slate-50')}
                            {renderInputField('Currency', 'exCurrency', formData.exCurrency, () => { }, 'text', true, 'bg-slate-50')}
                            {renderInputField('Exchange Rate', 'exRate', String(formData.exRate), () => { }, 'number', true, 'bg-slate-50')}

                            <div className="lg:col-span-4 mt-4 mb-2">
                                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Premium</h4>
                            </div>
                            {renderInputField('Total Risk Sum Insured', 'totalRiskSumInsured', String(formData.totalRiskSumInsured), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}
                            {renderInputField('Total Risk Premium', 'totalRiskPremium', String(formData.totalRiskPremium), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}

                          
{renderInputField('Comm. Rate (%)', 'commissionRate', String(formData.commissionRate), handleInputChange, 'number')}
{renderInputField('WHT Rate (%)', 'whtRate', String(formData.whtRate), handleInputChange, 'number')}


{renderInputField('Comm. Amount', 'commissionAmount', String(formData.commissionAmount), () => {}, 'number', true, 'bg-slate-50 text-slate-600')}
{renderInputField('WHT Amount', 'whtAmount', String(formData.whtAmount), () => {}, 'number', true, 'bg-slate-50 text-slate-600')}
{renderInputField('Net Premium', 'netPremium', String(formData.netPremium), () => {}, 'number', true, 'bg-slate-100 text-blue-700 font-bold h-11')}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="p-5 bg-gradient-to-r from-white to-slate-50 border-b border-slate-200 rounded-t-xl">
                            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600" />
                                Underwriting Companies
                            </h3>
                        </div>
                        <div className="m-4 md:m-6 border border-slate-200 rounded-lg overflow-x-auto">
                            <table className="w-full border-collapse table-fixed min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 border-b-2 border-slate-200 w-[80px]">Party ID</th>
                                        <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 border-b-2 border-slate-200 w-[180px]">Party Name</th>
                                        <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 border-b-2 border-slate-200 w-[90px]">Prop Rate%</th>
                                        <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 border-b-2 border-slate-200 w-[90px]">Comm Rate%</th>
                                        <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 border-b-2 border-slate-200 w-[110px]">Prop Value</th>
                                        <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 border-b-2 border-slate-200 w-[110px]">Prop Premium</th>
                                        <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 border-b-2 border-slate-200 w-[110px]">Net Premium</th>
                                        <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500 border-b-2 border-slate-200 w-[60px]">Lead</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.coinsuranceDistribution.length === 0 ? (
                                        <tr><td colSpan={8} className="text-center p-4 text-slate-500">No Records</td></tr>
                                    ) : (
                                        formData.coinsuranceDistribution.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-1.5 px-2 border-b border-slate-100">
                                                    <Input type="text" value={item.partyID} disabled className="min-w-[70px] h-8 text-sm bg-slate-50" />
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-slate-100">
                                                    <Input type="text" value={item.partyName} disabled className="min-w-[140px] h-8 text-sm bg-slate-50" />
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-slate-100 text-right">
                                                    <Input type="number" value={String(item.propRate)} disabled className="text-right min-w-[60px] max-w-[80px] h-8 text-sm bg-slate-50" />
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-slate-100 text-right">
                                                    <Input type="number" value={String(item.commRate)} disabled className="text-right min-w-[60px] max-w-[80px] h-8 text-sm bg-slate-50" />
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-slate-100 text-right">
                                                    <Input type="number" value={String(item.propValue)} disabled className="text-right min-w-[90px] max-w-[110px] bg-slate-50 h-8 text-sm" />
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-slate-100 text-right">
                                                    <Input type="number" value={String(item.propPremium)} disabled className="text-right min-w-[90px] max-w-[110px] bg-slate-50 h-8 text-sm" />
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-slate-100 text-right">
                                                    <Input type="number" value={String(item.netPremium)} disabled className="text-right min-w-[90px] max-w-[110px] bg-slate-50 font-bold h-8 text-sm" />
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-slate-100 text-center">
                                                    <Checkbox checked={item.isLead} disabled className="h-3.5 w-3.5 opacity-50" />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 flex justify-end">
                        <Button variant="outline" onClick={() => setViewMode('list')}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to List
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // --- EDIT/ADD MODE ---
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans text-slate-900 min-h-screen bg-slate-50">
            {saveSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    <Check className="w-5 h-5 inline mr-2" />
                    Debit Note raised successfully! You can continue creating another note.
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
                        {viewMode === 'add' ? 'New' : 'Edit'} {formData.noteType === 'CN' ? 'Credit Note' : 'Debit Note'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Policy: {policyNo}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={handleCancel} className="mr-2">Cancel</Button>
                    <Button onClick={handleSave} disabled={localLoading}>
                        {localLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        {viewMode === 'add' ? 'Raise Note' : 'Update Note'}
                    </Button>
                </div>
            </div>

            <div className="space-y-6 relative">
                {localLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="text-sm font-medium text-slate-600">Processing...</p>
                        </div>
                    </div>
                )}

                {/* 1. Reference Information - ALL EDITABLE */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    {renderSectionHeader('reference', 'Reference Information', <Info className="w-5 h-5 text-blue-600" />)}
                    {expandedSections.reference && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 md:p-8">
                            {renderInputField('Billing Date', 'billingDate', formData.billingDate.split("T")[0], handleInputChange, 'date')}
                            {renderSelectField('Payment Type', paymentOptions, formData.paymentType, (val) => handleValueChange('paymentType', val), 'Select Type')}
                            {renderInputField('Credit Ref No', 'creditRefNo', formData.creditRefNo || '', handleInputChange)}
                            {renderInputField('Credit Start Date', 'creditStartDate', formData.creditStartDate?.split("T")[0] || '', handleInputChange, 'date')}
                            {renderSelectField('Branch *', branchOptions, formData.branchId || formData.branchID, (val) => handleValueChange('branchId', val), 'Select Branch')}
                            {renderSelectField('Business Source', sourceOptions, formData.bizSource, (val) => handleValueChange('bizSource', val), 'Select Source')}
                            {(formData.bizSource === 'BROKER' || formData.bizSource === 'AGENT') && (
                                renderSelectField(
                                    `Select ${formData.bizSource === 'BROKER' ? 'Broker' : 'Agent'}`,
                                    agentOptions,
                                    formData.partyID,
                                    (val) => handleValueChange('partyID', val),
                                    'Select Party'
                                )
                            )}
                            {renderSelectField('Marketing Staff', mktStaffOptions, formData.mktStaffID, (val) => {
                                const selectedStaff = mktStaffs.find((s: any) => s.mktStaffID === val);
                                setFormData(prev => ({
                                    ...prev,
                                    mktStaffID: val || "",
                                    mktUnitID: selectedStaff?.mktStaffID || selectedStaff?.mktGrpID || ""
                                }));
                            }, 'Select Staff')}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Marketing Unit</Label>
                                <Input
                                    name="mktUnitID"
                                    value={
                                        formData.mktStaffID
                                            ? mktStaffs.find((s: any) => s.mktStaffID === formData.mktStaffID)?.mktGrpName
                                            || formData.mktUnitID
                                            || 'No unit assigned'
                                            : 'Select a staff first'
                                    }
                                    disabled
                                    className="bg-slate-50 text-slate-600 h-11"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Policy Details - ALL EDITABLE */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    {renderSectionHeader('details', 'Policy Details', <FileText className="w-5 h-5 text-blue-600" />)}
                    {expandedSections.details && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 md:p-8">
                            {renderInputField('Policy No', 'policyNo', formData.policyNo, handleInputChange, 'text', false, 'text-slate-600')}
                            {renderInputField('Detail ID', 'detailId', String(formData.detailId), handleInputChange, 'text', false, 'text-slate-600')}
                            {renderInputField('Insured Name *', 'insuredName', formData.insuredName, handleInputChange, 'text')}
                            {renderInputField('Our Share (%)', 'ourSharePercent', String(formData.ourSharePercent), handleInputChange, 'number')}
                            {renderInputField('Start Date', 'startDate', formData.startDate.split("T")[0], handleInputChange, 'date')}
                            {renderInputField('End Date', 'endDate', formData.endDate.split("T")[0], handleInputChange, 'date')}
                            <div className="space-y-2 lg:col-span-4">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Narration</Label>
                                <Input name="narration" value={formData.narration} onChange={handleInputChange} className="h-11" />
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Premium & Levies - ALL EDITABLE (Removed ORC, NCDF, NAICOM, Tracking Cost) */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
    {renderSectionHeader(
        'premium',
        'Premium',
        <span className="w-5 h-5 text-blue-600 font-bold flex items-center justify-center">₦</span>,
        expandedSections.premium && (
            <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                    e.stopPropagation();
                    handleRecalculate();
                }}
                disabled={localLoading || !formData.policyNo}
            >
                <RefreshCw className={`w-3 h-3 mr-2 ${localLoading ? 'animate-spin' : ''}`} />
                Recalculate
            </Button>
        )
    )}
    {expandedSections.premium && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 md:p-8">
            <div className="lg:col-span-4 mt-2 mb-2">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider"> Premium</h4>
            </div>

            {/* Foreign-currency note: the figures are in the policy currency, the note is booked in naira. */}
            {!['', 'NGN', 'NAIRA'].includes(String(formData.exCurrency || '').toUpperCase()) && Number(formData.exRate) > 1 && (
                <div className="lg:col-span-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    Foreign-currency note: amounts are in <strong>{formData.exCurrency}</strong> and are booked in NGN at a
                    rate of <strong>{Number(formData.exRate).toLocaleString()}</strong> (gross premium ≈ NGN{' '}
                    <strong>{(Number(formData.grossPremium || 0) * Number(formData.exRate)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>).
                    The currency and rate come from the scheme and cannot be changed here.
                </div>
            )}
            
            {/* ✅ READ-ONLY - Disabled */}
            {renderInputField('Sum Insured ', 'sumInsuredFrgn', String(formData.sumInsuredFrgn), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}
            {/* ✅ READ-ONLY - Disabled */}
            {renderInputField('Premium ', 'grossPremiumFrgn', String(formData.grossPremiumFrgn), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}
            
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
                        isDisabled
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
                        disabled
                        className="bg-slate-50 text-slate-600 h-11 flex-1"
                    />
                    {/* The rate is the scheme's own (legacy: read-only); the server ignores a posted rate. */}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchExchangeRate(formData.exCurrency || "NGN", "NGN")}
                        disabled
                        title="The exchange rate comes from the scheme"
                        className="h-11 px-3"
                    >
                        <RefreshCw className={`w-4 h-4 ${exchangeRateLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <div className="lg:col-span-4 mt-4 mb-2">
                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Premium</h4>
            </div>

            {/* ✅ READ-ONLY - Disabled */}
            {renderInputField('Total Risk Sum Insured', 'totalRiskSumInsured', String(formData.totalRiskSumInsured), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}
            {/* ✅ READ-ONLY - Disabled */}
            {renderInputField('Total Risk Premium', 'totalRiskPremium', String(formData.totalRiskPremium), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}

            {/* ✅ EDITABLE - Rate field (user can change) */}
            {renderInputField('Comm. Rate (%)', 'commissionRate', String(formData.commissionRate), handleInputChange, 'number')}
            {/* ✅ READ-ONLY - Disabled (calculated) */}
            {renderInputField('Comm. Amount', 'commissionAmount', String(formData.commissionAmount), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}

            {/* ✅ EDITABLE - Rate field (user can change) */}
            {renderInputField('WHT Rate (%)', 'whtRate', String(formData.whtRate), handleInputChange, 'number')}
            {/* ✅ READ-ONLY - Disabled (calculated) */}
            {renderInputField('WHT Amount', 'whtAmount', String(formData.whtAmount), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}

            {/* ✅ READ-ONLY - Disabled (calculated) */}
            {renderInputField('Net Premium', 'netPremium', String(formData.netPremium), handleInputChange, 'number', true, 'bg-slate-100 text-blue-700 font-bold h-11')}

            <div className="lg:col-span-4 mt-4 flex justify-center">
                <Button
                    onClick={(e) => {
                        e.preventDefault();
                        handleRecalculate();
                    }}
                    disabled={localLoading || !formData.policyNo}
                    type="button"
                >
                    {localLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calculator className="w-4 h-4 mr-2" />}
                    Calculate
                </Button>
            </div>
        </div>
    )}
</div>

                {/* 4. Coinsurance Distribution - ALL EDITABLE */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    {renderSectionHeader(
                        'coinsurance',
                        'Underwriting Companies',
                        <Users className="w-5 h-5 text-blue-600" />,
                        expandedSections.coinsurance && (
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddCoinsuranceRow();
                                    }}
                                    disabled={formData.coinsuranceDistribution.reduce((sum, item) => sum + (item.propRate || 0), 0) >= MAX_PROPORTION_LIMIT}
                                >
                                    <Plus className="w-3 h-3 mr-2" />
                                    Add Row
                                </Button>
                                {formData.coinsuranceDistribution.length > 0 && (
                                    <Button
                                        size="sm"
                                        variant="default"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCalculateAllCoinsurance();
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Calculator className="w-3 h-3 mr-2" />
                                        Calculate
                                    </Button>
                                )}
                            </div>
                        )
                    )}
                    {expandedSections.coinsurance && (
                        <div className="m-4 md:m-6 border border-slate-200 rounded-lg overflow-x-auto">
                            <table className="w-full border-collapse table-fixed min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 border-b-2 border-slate-200 w-[80px]">Party ID</th>
                                        <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 border-b-2 border-slate-200 w-[180px]">Party Name</th>
                                        <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 border-b-2 border-slate-200 w-[90px]">Prop Rate%</th>
                                        <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 border-b-2 border-slate-200 w-[90px]">Comm Rate%</th>
                                        <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 border-b-2 border-slate-200 w-[110px]">Prop Value</th>
                                        <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 border-b-2 border-slate-200 w-[110px]">Prop Premium</th>
                                        <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 border-b-2 border-slate-200 w-[110px]">Net Premium</th>
                                        <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500 border-b-2 border-slate-200 w-[60px]">Lead</th>
                                        <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500 border-b-2 border-slate-200 w-[60px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.coinsuranceDistribution.length === 0 ? (
                                        <tr><td colSpan={9} className="text-center p-4 text-slate-500">No Records</td></tr>
                                    ) : (
                                        formData.coinsuranceDistribution.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-1.5 px-2 border-b border-slate-100">
                                                    <Input
                                                        type="text"
                                                        value={item.partyID}
                                                        onChange={(e) => handleCoinsuranceChange(idx, 'partyID', e.target.value)}
                                                        className="min-w-[70px] h-8 text-sm"
                                                    />
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-slate-100">
                                                    <Select
                                                        options={agentOptions}
                                                        value={agentOptions.find(opt => opt.value === item.partyID) || null}
                                                        onChange={(opt) => {
                                                            const updated = [...formData.coinsuranceDistribution];
                                                            updated[idx] = {
                                                                ...updated[idx],
                                                                partyID: opt?.value || "",
                                                                partyName: opt?.label || ""
                                                            };
                                                            setFormData(prev => ({ ...prev, coinsuranceDistribution: updated }));
                                                        }}
                                                        classNamePrefix="react-select"
                                                        placeholder="Select..."
                                                        isSearchable={true}
                                                        menuPortalTarget={document.body}
                                                        styles={{
                                                            control: (base) => ({ ...base, minHeight: '32px', height: '32px', fontSize: '0.8rem' }),
                                                            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                        }}
                                                    />
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-slate-100 text-right">
                                                    <Input
                                                        type="number"
                                                        value={String(item.propRate)}
                                                        onChange={(e) => handleCoinsuranceChange(idx, 'propRate', parseFloat(e.target.value) || 0)}
                                                        className="text-right min-w-[60px] max-w-[80px] h-8 text-sm"
                                                    />
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-slate-100 text-right">
                                                    <Input
                                                        type="number"
                                                        value={String(item.commRate)}
                                                        onChange={(e) => handleCoinsuranceChange(idx, 'commRate', parseFloat(e.target.value) || 0)}
                                                        className="text-right min-w-[60px] max-w-[80px] h-8 text-sm"
                                                    />
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-slate-100 text-right">
                                                    <Input
                                                        type="number"
                                                        value={String(item.propValue)}
                                                        disabled
                                                        className="text-right min-w-[90px] max-w-[110px] bg-slate-50 h-8 text-sm"
                                                    />
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-slate-100 text-right">
                                                    <Input
                                                        type="number"
                                                        value={String(item.propPremium)}
                                                        disabled
                                                        className="text-right min-w-[90px] max-w-[110px] bg-slate-50 h-8 text-sm"
                                                    />
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-slate-100 text-right">
                                                    <Input
                                                        type="number"
                                                        value={String(item.netPremium)}
                                                        disabled
                                                        className="text-right min-w-[90px] max-w-[110px] bg-slate-50 font-bold h-8 text-sm"
                                                    />
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-slate-100 text-center">
                                                    <Checkbox
                                                        checked={item.isLead}
                                                        onCheckedChange={(checked) => handleCoinsuranceChange(idx, 'isLead', checked === true)}
                                                        className="h-3.5 w-3.5"
                                                    />
                                                </td>
                                                <td className="py-1.5 px-2 border-b border-slate-100 text-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteCoinsuranceRow(idx)}
                                                        className="h-7 w-7 p-0"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    {viewMode === 'edit' && formData.dncnNo && formData.approval !== 2 && (
                        <Button
                            onClick={() => {
                                if (formData.dncnNo) {
                                    handleApproveDebitNote(formData.dncnNo);
                                }
                            }}
                            disabled={localLoading}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {localLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                            Approve
                        </Button>
                    )}
                    <Button onClick={handleSave} disabled={localLoading}>
                        {localLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        {viewMode === 'add' ? 'Raise Note' : 'Update Note'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DebitNote;