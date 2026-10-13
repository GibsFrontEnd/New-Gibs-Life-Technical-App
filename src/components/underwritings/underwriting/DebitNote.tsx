//@ts-nocheck
import React, { useState, useEffect } from "react";
import Select, { SingleValue } from "react-select";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useLocation, useOutletContext } from "react-router-dom";
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
    Banknote,
    Building,
    Briefcase,
    CreditCard,
    Info,
    Clock,
    BriefcaseIcon,
    Users,
    Plus,
    Calculator,
    RefreshCw
} from "lucide-react";
import type { RootState, AppDispatch } from "../../../features/store";
import {
    fetchDebitNotes,
    createDebitNote,
    getDebitNoteMapping,
    fetchPolicyCalculations,
    getCoinsuranceDistribution,
    deleteDebitNote,
    fetchDebitNoteById,
    updateDebitNote,
    getPolBizType,
    recalculateDebitNote,
    calculateCoinsurance
} from "../../../features/reducers/underwriteReducers/underwritingSlice";
import { getAllBranches } from "../../../features/reducers/companyReducers/branchSlice";
import { getAllAgents } from "../../../features/reducers/csuReducers/agentSlice";
import { fetchMktStaffs, selectMarketingStaff } from "../../../features/reducers/companyReducers/marketingStaffSlice";
import { toast } from "@/components/ui/use-toast";
import Input from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/new-button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppSelector } from "../../../hooks/use-apps";

// === NEW: Import the DebitNoteList component ===
import DebitNoteList from "./DebitNoteList";

// --- CONFIGURATION ---
export const MAX_PROPORTION_LIMIT = 100;

// --- CURRENCY API CONFIG ---
const CURRENCY_API_URL = "https://api.exchangerate-api.com/v4/latest/";

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

interface MarketingDistribution {
    mktUnitID: string;
    mktUnitName: string;
    busProp: number;
    sumInsured: number;
    grossPremium: number;
    commission: number;
    netPremium: number;
}

interface DebitNoteState {
    dncnNo?: string;
    policyNo: string;
    detailID: string;
    billingDate: string;
    paymentType: string;
    creditRefNo: string;
    creditStartDate: string;
    branchID: string;
    bizSource: string;
    partyID: string;
    mktStaffID: string;
    mktUnitID: string;
    insuredID: string;
    useOptionalInsured: boolean;
    insuredName: string;
    startDate: string;
    endDate: string;
    sumInsured: number;
    grossPremium: number;
    totalRiskSumInsured: number;
    totalRiskPremium: number;
    commissionRate: number;
    commissionAmount: number;
    vatRate: number;
    vatAmount: number;
    businessProportion: number;
    orcRate: number;
    orcAmount: number;
    netPremium: number;
    narration: string;
    exchangeRate: number;
    currency: string;
    foreignSumInsured: number;
    foreignPremium: number;
    bankID: string;
    sourceType: string;
    totalTrackingCost: number;
    ncdfLevyRate: number;
    ncdfLevyAmount: number;
    naicomLevyRate: number;
    naicomLevyAmount: number;
    coinsuranceDistribution: CoinsuranceDistribution[];
    marketingDistribution: MarketingDistribution[];
}

const DebitNote = () => {
    const { policyNo } = useParams<{ policyNo: string }>();
    const location = useLocation();
    const dispatch = useDispatch<AppDispatch>();

    // ✅ FIX: Safely access underwriting state with fallback
    const underwritingState = useSelector((state: RootState) => state.underwritings);
    
    // ✅ Destructure with defaults to prevent undefined errors
    const {
        debitNotes = [],
        calculationHistory = [],
        loading: storeLoading = false,
        businessType: businessTypeOptions = [],
        currentPolicy = null,
    } = underwritingState || {};

    // ✅ Log to verify state is loaded
    console.log("🔍 Underwriting State:", underwritingState);
    console.log("📋 Debit Notes:", debitNotes);
    console.log("📋 Calculation History:", calculationHistory);

    const { branches } = useSelector((state: RootState) => state.branches || { branches: [] });
    const { agents } = useSelector((state: RootState) => state.parties || { agents: [] });
    const { mktStaffs } = useAppSelector(selectMarketingStaff);

    const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit' | 'view'>(() => {
        return location.state?.detailID ? 'add' : 'list';
    });
    const [activeListView, setActiveListView] = useState<'old' | 'new'>('new');
    const [selectedNote, setSelectedNote] = useState<any>(null);
    const [localLoading, setLocalLoading] = useState(false);
    const [NAICOMLevy, setNAICOMLevy] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [exchangeRateLoading, setExchangeRateLoading] = useState(false);

    const { isReadOnly } = useOutletContext<{ isReadOnly: boolean }>() || { isReadOnly: false };


    const [formData, setFormData] = useState<DebitNoteState>({
        policyNo: "",
        detailID: "",
        billingDate: new Date().toISOString(),
        paymentType: "DIRECT CASH",
        creditRefNo: "N/A",
        creditStartDate: new Date().toISOString(),
        branchID: "",
        bizSource: "DIRECT",
        partyID: "",
        mktStaffID: "",
        mktUnitID: "",
        insuredID: "",
        useOptionalInsured: false,
        insuredName: "",
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        sumInsured: 0,
        grossPremium: 0,
        totalRiskSumInsured: 0,
        totalRiskPremium: 0,
        commissionRate: 0,
        commissionAmount: 0,
        vatRate: 0,
        vatAmount: 0,
        businessProportion: 100,
        orcRate: 0,
        orcAmount: 0,
        netPremium: 0,
        narration: "",
        exchangeRate: 1,
        currency: "NGN",
        foreignSumInsured: 0,
        foreignPremium: 0,
        bankID: "N/A",
        sourceType: "DIRECT",
        totalTrackingCost: 0,
        ncdfLevyRate: 0,
        ncdfLevyAmount: 0,
        naicomLevyRate: 0,
        naicomLevyAmount: 0,
        coinsuranceDistribution: [],
        marketingDistribution: []
    });

    const [expandedSections, setExpandedSections] = useState({
        reference: true,
        details: true,
        premium: true,
        coinsurance: false,
        marketing: false
    });

    // --- CURRENCY EXCHANGE RATE FETCHER ---
    const fetchExchangeRate = async (fromCurrency: string, toCurrency: string = "NGN") => {
        if (fromCurrency === toCurrency) {
            setFormData(prev => ({ ...prev, exchangeRate: 1 }));
            return;
        }

        setExchangeRateLoading(true);
        try {
            // Try multiple API endpoints for redundancy
            const endpoints = [
                `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`,
                `https://api.exchangeratesapi.io/latest?base=${fromCurrency}`,
                `https://api.currencyapi.com/v3/latest?apikey=YOUR_API_KEY&base_currency=${fromCurrency}`
            ];

            let rate = null;
            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint);
                    if (response.ok) {
                        const data = await response.json();
                        // Handle different API response formats
                        if (data.rates) {
                            rate = data.rates[toCurrency] || data.rates[toCurrency.toUpperCase()];
                            if (rate) break;
                        }
                        if (data.data) {
                            rate = data.data[toCurrency]?.value;
                            if (rate) break;
                        }
                    }
                } catch (e) {
                    console.warn(`Failed to fetch from ${endpoint}`, e);
                    continue;
                }
            }

            if (rate) {
                setFormData(prev => ({ ...prev, exchangeRate: rate }));
                toast({
                    description: `Exchange rate updated: 1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`,
                    variant: "default"
                });
            } else {
                // Fallback: use approximate rates
                const fallbackRates: Record<string, number> = {
                    'USD': 1500,
                    'EUR': 1600,
                    'GBP': 1850,
                    'NGN': 1
                };
                const fallbackRate = fallbackRates[fromCurrency] || 1;
                setFormData(prev => ({ ...prev, exchangeRate: fallbackRate }));
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
        const UNDERWRITING_API = "https://lifetechnicalapi.newgibsonline.com/api";
        dispatch(getAllBranches({ baseUrl: UNDERWRITING_API }));
        dispatch(getAllAgents({ pageNumber: 1, pageSize: 100, baseUrl: UNDERWRITING_API }));
        dispatch(fetchMktStaffs({ baseUrl: UNDERWRITING_API }));
        dispatch(getPolBizType() as any);
    }, [dispatch]);

    // --- FETCH DEBIT NOTES LIST ---
    useEffect(() => {
        if (viewMode === 'list' && policyNo) {
            setListLoading(true);
            dispatch(fetchDebitNotes(policyNo)).finally(() => {
                setListLoading(false);
            });
        }
    }, [viewMode, policyNo, dispatch]);

    // --- AUTO-FILL ---
    useEffect(() => {
        if (viewMode === 'add' && policyNo) {
            const loadAutoFill = async () => {
                setLocalLoading(true);
                try {
                    const stateDetailId = location.state?.detailID;
                    let calcId = stateDetailId || null;

                    if (!calcId) {
                        if (calculationHistory && calculationHistory.length > 0) {
                            calcId = calculationHistory[0].detailID || calculationHistory[0].policyDetailId;
                        } else {
                            const calcs = await dispatch(fetchPolicyCalculations(policyNo)).unwrap();
                            if (calcs && calcs.length > 0) {
                                calcId = calcs[0].detailID || calcs[0].policyDetailId;
                            }
                        }
                    }

                    if (calcId) {
                        const mapping = await dispatch(getDebitNoteMapping({ policyNo, detailID: calcId })).unwrap();
                        console.log("Debit Note Mapping (Auto-fill):", mapping);

                        if (mapping) {
                            let coinsuranceData: CoinsuranceDistribution[] = [];
                            try {
                                const coinsDist = await dispatch(getCoinsuranceDistribution(policyNo)).unwrap();
                                if (Array.isArray(coinsDist)) {
                                    coinsuranceData = coinsDist.map((item: any) => ({
                                        partyID: item.leaderID || "",
                                        partyName: item.leader || item.tag || "",
                                        propRate: Number(item.retProp) || 0,
                                        propValue: Number(item.retValue) || 0,
                                        propPremium: Number(item.retPremium) || 0,
                                        commRate: Number(item.commRate) || 0,
                                        commValue: Number(item.commValue) || 0,
                                        orcRate: Number(item.orcRate) || 0,
                                        orcValue: Number(item.orcValue) || 0,
                                        vatRate: Number(item.vatRate) || 0,
                                        vatValue: Number(item.vatValue) || 0,
                                        netPremium: Number(item.netPremium) || 0,
                                        isLead: false
                                    }));
                                }
                            } catch (err) {
                                console.warn("Failed to fetch coinsurance distribution", err);
                            }

                            setFormData(prev => ({
                                ...prev,
                                policyNo: (mapping.policyNo || policyNo || "").toString(),
                                detailID: (mapping.detailID || calcId || "").toString(),
                                branchID: (mapping.branchID || mapping.branch || prev.branchID || "").toString(),
                                partyID: (mapping.partyID || mapping.party || prev.partyID || "").toString(),
                                mktStaffID: (mapping.mktStaffID || mapping.mktStaff || prev.mktStaffID || "").toString(),
                                insuredID: (mapping.insuredID || prev.insuredID || "").toString(),
                                insuredName: mapping.insuredName || prev.insuredName || "",
                                bizSource: mapping.bizSource || currentPolicy?.bizSource || prev.bizSource || "DIRECT",
                                sourceType: mapping.sourceType || mapping.businessType || currentPolicy?.sourceType || currentPolicy?.businessType || prev.sourceType || "",
                                startDate: mapping.startDate ? new Date(mapping.startDate).toISOString() : prev.startDate,
                                endDate: mapping.endDate ? new Date(mapping.endDate).toISOString() : prev.endDate,
                                billingDate: new Date().toISOString(),
                                creditStartDate: new Date().toISOString(),
                                sumInsured: Number(mapping.sumInsured) || prev.sumInsured,
                                grossPremium: Number(mapping.grossPremium) || prev.grossPremium,
                                totalRiskSumInsured: Number(mapping.totalRiskValue) || Number(mapping.sumInsured) || prev.totalRiskSumInsured,
                                totalRiskPremium: Number(mapping.totalPremium) || Number(mapping.grossPremium) || prev.totalRiskPremium,
                                businessProportion: Number(mapping.proportionRate) || prev.businessProportion,
                                netPremium: Number(mapping.totalPremium) || Number(mapping.grossPremium) || prev.netPremium,
                                commissionRate: Number(mapping.partyRate) || 0,
                                commissionAmount: Number(mapping.commission) || 0,
                                vatRate: Number(mapping.vatRate) || 0,
                                vatAmount: Number(mapping.vatAmount) || 0,
                                ncdfLevyAmount: Number(mapping.ncdfLevyAmount) || 0,
                                naicomLevyAmount: Number(mapping.naicomLevyAmount) || 0,
                                currency: mapping.exCurrency || prev.currency,
                                exchangeRate: Number(mapping.exRate) || prev.exchangeRate,
                                narration: mapping.remarks || prev.narration || `Being debit note for ${policyNo}`,
                                creditRefNo: "N/A",
                                bankID: "N/A",
                                coinsuranceDistribution: coinsuranceData.length > 0 ? coinsuranceData : (mapping.coinsuranceDistribution || []),
                                marketingDistribution: mapping.marketingDistribution || []
                            }));
                            toast({ description: "Form auto-filled from calculation.", variant: "default" });
                        }
                    }
                } catch (error) {
                    console.error("Auto-fill error", error);
                } finally {
                    setLocalLoading(false);
                }
            };
            loadAutoFill();
        }
    }, [viewMode, policyNo, dispatch, calculationHistory, location]);

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
        setFormData(prev => ({ ...prev, currency: selectedCurrency }));
        
        // Fetch exchange rate when currency changes
        if (selectedCurrency !== currentCurrency) {
            await fetchExchangeRate(selectedCurrency, "NGN");
        } else {
            setFormData(prev => ({ ...prev, exchangeRate: 1 }));
        }
    };

    const handleSave = async () => {
        if (!policyNo) {
            toast({ description: "Policy Number is missing.", variant: "destructive" });
            return;
        }

        setLocalLoading(true);
        try {
            const recalcPayload = {
                policyNo: formData.policyNo,
                trackID: Math.floor(1000 + Math.random() * 9000),
                bizSource: formData.bizSource,
                totalRiskPremium: formData.totalRiskPremium,
                grossPremium: formData.grossPremium,
                totalRiskSumInsured: formData.totalRiskSumInsured,
                commissionRate: formData.commissionRate,
                vatRate: formData.vatRate,
                ncdfLevyRate: formData.ncdfLevyRate,
                naicomLevyRate: formData.naicomLevyRate,
                orcRate: formData.orcRate
            };

            const recalcResult = await dispatch(recalculateDebitNote(recalcPayload)).unwrap();

            if (!recalcResult) {
                throw new Error("Recalculation failed - cannot save.");
            }

            const formatDateForBackend = (dateString: string) => {
                return new Date(dateString).toISOString();
            };

            const payload = {
                policyNo: formData.policyNo,
                detailID: formData.detailID,
                billingDate: formatDateForBackend(formData.billingDate),
                paymentType: formData.paymentType || "DIRECT CASH",
                creditRefNo: formData.creditRefNo || "N/A",
                creditStartDate: formatDateForBackend(formData.creditStartDate),
                branchID: formData.branchID,
                bizSource: formData.bizSource,
                partyID: formData.partyID,
                mktStaffID: formData.mktStaffID,
                mktUnitID: formData.mktUnitID,
                insuredID: formData.insuredID || "N/A",
                useOptionalInsured: formData.useOptionalInsured || false,
                insuredName: formData.insuredName,
                startDate: formatDateForBackend(formData.startDate),
                endDate: formatDateForBackend(formData.endDate),
                sumInsured: formData.sumInsured || 0,
                grossPremium: formData.grossPremium || 0,
                totalRiskSumInsured: formData.totalRiskSumInsured || 0,
                totalRiskPremium: formData.totalRiskPremium || 0,
                commissionRate: formData.commissionRate || 0,
                commissionAmount: (recalcResult.commissionAmount ?? formData.commissionAmount) || 0,
                vatRate: formData.vatRate || 0,
                vatAmount: (recalcResult.vatAmount ?? formData.vatAmount) || 0,
                businessProportion: formData.businessProportion || 100,
                orcRate: formData.orcRate || 0,
                orcAmount: (recalcResult.orcAmount ?? formData.orcAmount) || 0,
                netPremium: (recalcResult.netPremium ?? formData.netPremium) || 0,
                narration: formData.narration || "",
                exchangeRate: formData.exchangeRate || 1,
                currency: formData.currency || "NGN",
                foreignSumInsured: formData.foreignSumInsured || 0,
                foreignPremium: formData.foreignPremium || 0,
                bankID: formData.bankID || "N/A",
                sourceType: formData.sourceType || "DIRECT",
                totalTrackingCost: formData.totalTrackingCost || 0,
                ncdfLevyRate: formData.ncdfLevyRate || 0,
                ncdfLevyAmount: (recalcResult.ncdfLevyValue ?? formData.ncdfLevyAmount) || 0,
                naicomLevyRate: formData.naicomLevyRate || 0,
                naicomLevyAmount: (recalcResult.naicomLevyValue ?? formData.naicomLevyAmount) || 0,
                coinsuranceDistribution: formData.coinsuranceDistribution && formData.coinsuranceDistribution.length > 0
                    ? formData.coinsuranceDistribution.map(item => ({
                        partyID: item.partyID,
                        partyName: item.partyName,
                        propRate: item.propRate,
                        propValue: item.propValue,
                        propPremium: item.propPremium,
                        commRate: item.commRate,
                        commValue: item.commValue,
                        orcRate: item.orcRate || 0,
                        orcValue: item.orcValue || 0,
                        vatRate: item.vatRate || 0,
                        vatValue: item.vatValue || 0,
                        netPremium: item.netPremium || 0,
                        isLead: item.isLead || false
                    }))
                    : [],
                marketingDistribution: formData.marketingDistribution && formData.marketingDistribution.length > 0
                    ? formData.marketingDistribution.map(item => ({
                        mktUnitID: item.mktUnitID,
                        mktUnitName: item.mktUnitName,
                        busProp: item.busProp,
                        sumInsured: item.sumInsured,
                        grossPremium: item.grossPremium,
                        commission: item.commission,
                        netPremium: item.netPremium
                    }))
                    : []
            };

            console.log("Debit Note Payload:", JSON.stringify(payload, null, 2));

            if (formData.dncnNo) {
                await dispatch(updateDebitNote({ dncnNo: formData.dncnNo, noteData: payload })).unwrap();
                toast({ description: "Debit Note updated successfully.", variant: "default" });
            } else {
                await dispatch(createDebitNote(payload)).unwrap();
                toast({ description: "Debit Note saved successfully.", variant: "default" });
            }

            setViewMode('list');
            dispatch(fetchDebitNotes(policyNo));
        } catch (error) {
            console.error("Save error", error);
            toast({ description: "Failed to save Debit Note.", variant: "destructive" });
        } finally {
            setLocalLoading(false);
        }
    };

   const handleRecalculate = async () => {
    if (!formData.policyNo) {
        toast({ description: "Policy No is required for recalculation.", variant: "destructive" });
        return;
    }

    // Check if we have values to calculate
    if (!formData.totalRiskPremium && !formData.grossPremium) {
        toast({ 
            description: "Please enter Total Risk Premium or Gross Premium first.", 
            variant: "destructive" 
        });
        setLocalLoading(false);
        return;
    }

    setLocalLoading(true);
    try {
        const payload = {
            policyNo: formData.policyNo,
            trackID: Math.floor(1000 + Math.random() * 9000),
            bizSource: formData.bizSource || "DIRECT",
            totalRiskPremium: formData.totalRiskPremium || formData.grossPremium || 0,
            grossPremium: formData.grossPremium || formData.totalRiskPremium || 0,
            totalRiskSumInsured: formData.totalRiskSumInsured || formData.sumInsured || 0,
            commissionRate: formData.commissionRate || 0,
            vatRate: formData.vatRate || 0,
            ncdfLevyRate: formData.ncdfLevyRate || 0,
            naicomLevyRate: formData.naicomLevyRate || 0,
            orcRate: formData.orcRate || 0
        };

        console.log("Recalculate Payload:", payload);

        const result = await dispatch(recalculateDebitNote(payload)).unwrap();
        console.log("Recalculate Result:", result);

        if (result) {
            setFormData(prev => ({
                ...prev,
                commissionAmount: result.commissionAmount ?? prev.commissionAmount,
                vatAmount: result.vatAmount ?? prev.vatAmount,
                netPremium: result.netPremium ?? prev.netPremium,
                ncdfLevyAmount: result.ncdfLevyValue ?? prev.ncdfLevyAmount,
                naicomLevyAmount: result.naicomLevyValue ?? prev.naicomLevyAmount,
                orcAmount: result.orcAmount ?? prev.orcAmount
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

    const handleAddCoinsuranceRow = () => {
        const currentCoinsuranceTotal = formData.coinsuranceDistribution.reduce(
            (sum, item) => sum + (item.propRate || 0), 0
        );
        const remaining = MAX_PROPORTION_LIMIT - currentCoinsuranceTotal;

        setFormData(prev => ({
            ...prev,
            coinsuranceDistribution: [
                ...prev.coinsuranceDistribution,
                {
                    partyID: "",
                    partyName: "",
                    propRate: remaining,
                    propValue: prev.sumInsured || 0,
                    propPremium: prev.grossPremium || 0,
                    commRate: prev.commissionRate || 0,
                    commValue: prev.commissionAmount || 0,
                    orcRate: prev.orcRate || 0,
                    orcValue: prev.orcAmount || 0,
                    vatRate: prev.vatRate || 0,
                    vatValue: prev.vatAmount || 0,
                    netPremium: prev.netPremium || 0,
                    isLead: false
                }
            ]
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
            bizSource: formData.bizSource || "DIRECT",
            trackID: Math.floor(1000 + Math.random() * 9000),
            totalRiskSumInsured: formData.totalRiskSumInsured || formData.sumInsured || 0,
            totalRiskPremium: formData.totalRiskPremium || formData.grossPremium || 0,
            grossSumInsured: formData.sumInsured || formData.totalRiskSumInsured || 0,
            grossPremium: formData.grossPremium || formData.totalRiskPremium || 0,
            headerCommRate: formData.commissionRate || 0,
            leaderBusProp: formData.businessProportion || 100,
            companyAbrev: "GIBS",
            participants: formData.coinsuranceDistribution.map(item => ({
                partyCode: item.partyID,
                partyName: item.partyName,
                busPropRate: item.propRate || 0,
                orcRate: item.orcRate || 0,
                vatRate: item.vatRate || 0,
                commRate: item.commRate || 0,
                isLead: item.isLead || false
            }))
        };

        console.log("Calculate Coinsurance Payload:", payload);

        const result = await dispatch(calculateCoinsurance(payload)).unwrap();
        console.log("Calculate Coinsurance Result:", result);

        if (result && Array.isArray(result.participants)) {
            setFormData(prev => ({
                ...prev,
                coinsuranceDistribution: result.participants.map((p: any, i: number) => ({
                    partyID: p.partyCode || prev.coinsuranceDistribution[i]?.partyID || "",
                    partyName: p.partyName || prev.coinsuranceDistribution[i]?.partyName || "",
                    propRate: p.busPropRate || 0,
                    propValue: p.propSumInsured || p.riskSumInsured || p.propValue || 0,
                    propPremium: p.propPremium || p.riskPremium || 0,
                    commRate: p.commRate || p.commissionRate || 0,
                    commValue: p.commAmount || p.commission || p.commValue || 0,
                    orcRate: p.orcRate || 0,
                    orcValue: p.orcAmount || p.orcValue || 0,
                    vatRate: p.vatRate || 0,
                    vatValue: p.vatAmount || p.vatValue || 0,
                    netPremium: p.netPremium || 0,
                    isLead: p.isLead || false
                }))
            }));
            toast({ 
                description: `✅ ${result.participants.length} coinsurance rows calculated successfully!`,
                variant: "default" 
            });
        } else {
            toast({ 
                description: "Coinsurance calculation returned no results. Please check your inputs.", 
                variant: "destructive" 
            });
        }
    } catch (error: any) {
        console.error("Calculate All error:", error);
        toast({ 
            description: error?.message || "Failed to calculate coinsurance. Please check your inputs.", 
            variant: "destructive" 
        });
    } finally {
        setLocalLoading(false);
    }
};

    const handleViewNote = async (dncnNo: string) => {
        setListLoading(true);
        try {
            const note = await dispatch(fetchDebitNoteById(dncnNo)).unwrap();
            setSelectedNote(note);
            setViewMode('view');
        } catch (error) {
            console.error("Failed to fetch debit note details", error);
            toast({ description: "Failed to load debit note details.", variant: "destructive" });
        } finally {
            setListLoading(false);
        }
    };

    // --- OPTIONS ---
    const branchOptions = branches.map((b: any) => ({ value: b.branchID, label: b.description || b.branchName }));
    const agentOptions = agents.map((a: any) => ({ value: a.partyID, label: (a.party || "").trim() }));
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
                isSearchable={false}
                isDisabled={isDisabled}
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
                disabled={disabled}
                className={`h-11 ${className || ''}`}
            />
        </div>
    );

    // --- LIST VIEW ---
    if (viewMode === 'list') {
        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans text-slate-900 min-h-screen bg-slate-50">
                {activeListView === 'new' ? (
                    <DebitNoteList policyNo={policyNo} />
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
                        {listLoading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                    <p className="text-sm font-medium text-slate-600">Loading debit notes...</p>
                                </div>
                            </div>
                        )}

                        {(!debitNotes || debitNotes.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                    <Save className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">No Debit Notes Found</h3>
                                <p className="text-slate-500 max-w-sm mt-2">Create a new debit note to get started with this policy.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">Ref No</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">Insured Name</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">Billing Date</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">Biz Source</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">Gross Premium</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">Status</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">Submitted On</th>
                                            <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {debitNotes.map((note: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-3 px-4 border-b border-slate-100 font-medium">{note.dncnNo || '-'}</td>
                                                <td className="py-3 px-4 border-b border-slate-100">{note.insuredName}</td>
                                                <td className="py-3 px-4 border-b border-slate-100">{note.billingDate ? new Date(note.billingDate).toLocaleDateString() : '-'}</td>
                                                <td className="py-3 px-4 border-b border-slate-100">{note.bizSource}</td>
                                                <td className="py-3 px-4 border-b border-slate-100 font-semibold">{formatCurrency(note.grossPremium)}</td>
                                                <td className="py-3 px-4 border-b border-slate-100">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${note.approvalStatus === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {note.approvalStatus || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 border-b border-slate-100 text-sm text-slate-500">{note.submittedOn ? new Date(note.submittedOn).toLocaleString() : '-'}</td>
                                                <td className="py-3 px-4 border-b border-slate-100 text-center">
                                                    <Button variant="ghost" size="sm" onClick={() => handleViewNote(note.dncnNo)}>
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // --- VIEW MODE ---
    if (viewMode === 'view' && selectedNote) {
        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans text-slate-900 min-h-screen bg-slate-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10 pb-6 border-b border-slate-200">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Debit Note: {selectedNote.dncnNo}</h1>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => setViewMode('list')} className="mr-2">
                            Back to List
                        </Button>
                        {!isReadOnly && (
                            <>
                                <Button variant="outline" onClick={() => {
                                    setFormData({
                                        dncnNo: selectedNote.dncnNo,
                                        policyNo: selectedNote.policyNo || "",
                                        detailID: selectedNote.detailID || "",
                                        billingDate: selectedNote.billingDate || new Date().toISOString(),
                                        paymentType: selectedNote.paymentType || "",
                                        creditRefNo: selectedNote.creditRefNo || null,
                                        creditStartDate: selectedNote.crRefDate || new Date().toISOString(),
                                        branchID: selectedNote.branchID || "",
                                        bizSource: selectedNote.bizSource || "",
                                        partyID: selectedNote.partyID || "",
                                        mktStaffID: selectedNote.mktStaffID || "",
                                        mktUnitID: selectedNote.mktUnitID || "",
                                        insuredID: selectedNote.insuredID || "",
                                        useOptionalInsured: selectedNote.isOptionalInsured || false,
                                        insuredName: selectedNote.insuredName || "",
                                        startDate: selectedNote.startDate || new Date().toISOString(),
                                        endDate: selectedNote.endDate || new Date().toISOString(),
                                        sumInsured: selectedNote.sumInsured || 0,
                                        grossPremium: selectedNote.grossPremium || 0,
                                        totalRiskSumInsured: selectedNote.totalRiskValue || 0,
                                        totalRiskPremium: selectedNote.totalPremium || 0,
                                        commissionRate: selectedNote.partyRate || 0,
                                        commissionAmount: selectedNote.commission || 0,
                                        vatRate: selectedNote.vatRate || 0,
                                        vatAmount: selectedNote.vatAmount || 0,
                                        businessProportion: selectedNote.propRate || 100,
                                        orcRate: 0,
                                        orcAmount: 0,
                                        netPremium: selectedNote.netAmount || 0,
                                        narration: selectedNote.narration || "",
                                        exchangeRate: selectedNote.exRate || 1,
                                        currency: selectedNote.exCurrency || "NGN",
                                        foreignSumInsured: selectedNote.sumInsuredFrgn || 0,
                                        foreignPremium: selectedNote.grossPremiumFrgn || 0,
                                        bankID: selectedNote.bankID || null,
                                        sourceType: selectedNote.sourceType || "",
                                        totalTrackingCost: selectedNote.trackingCost || 0,
                                        ncdfLevyRate: selectedNote.ncdfLevyRate || 0,
                                        ncdfLevyAmount: selectedNote.ncdfLevyAmount || 0,
                                        naicomLevyRate: selectedNote.naicomLevyRate || 0,
                                        naicomLevyAmount: selectedNote.naicomLevyAmount || 0,
                                        coinsuranceDistribution: selectedNote.coinsuranceDistribution || [],
                                        marketingDistribution: selectedNote.marketingDistribution || []
                                    });
                                    setViewMode('edit');
                                }} className="mr-2">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                                <Button variant="destructive" onClick={async () => {
                                    if (window.confirm(`Are you sure you want to delete debit note ${selectedNote.dncnNo}?`)) {
                                        try {
                                            await dispatch(deleteDebitNote(selectedNote.dncnNo)).unwrap();
                                            toast({ description: "Debit note deleted successfully", variant: "default" });
                                            setViewMode('list');
                                            dispatch(fetchDebitNotes(policyNo!));
                                        } catch (error) {
                                            toast({ description: "Failed to delete debit note", variant: "destructive" });
                                        }
                                    }
                                }}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Reference Information */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 md:p-8 border-l-4 border-l-blue-600 hover:shadow-lg transition-all">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6 pb-4 border-b border-slate-200 flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-600" /> Reference Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { label: "Debit Note No", value: selectedNote.dncnNo || '-' },
                                { label: "Legacy Ref No", value: selectedNote.refDNCNNo || '-' },
                                { label: "Policy No", value: selectedNote.policyNo || '-' },
                                { label: "Billing Date", value: selectedNote.billingDate ? new Date(selectedNote.billingDate).toLocaleDateString() : '-' },
                                { label: "Payment Type", value: selectedNote.paymentType || '-' },
                                { label: "Cheque/Ref No", value: selectedNote.chequeNo || '-' }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">{item.label}</label>
                                    <input value={item.value} disabled className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 h-9" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Policy Details */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 md:p-8 border-l-4 border-l-blue-600 hover:shadow-lg transition-all">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6 pb-4 border-b border-slate-200 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" /> Policy Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { label: "Branch", value: selectedNote.branchName || selectedNote.branchID || '-' },
                                { label: "Business Source", value: selectedNote.bizSource || '-' },
                                { label: "Sub Risk", value: selectedNote.subRisk || selectedNote.subRiskID || '-' },
                                { label: "Insured Name", value: selectedNote.insuredName || '-' },
                                { label: "Agent/Broker", value: selectedNote.party || selectedNote.partyID || '-' },
                                { label: "Marketing Staff", value: selectedNote.mktStaff || selectedNote.mktStaffID || '-' },
                                { label: "Start Date", value: selectedNote.startDate ? new Date(selectedNote.startDate).toLocaleDateString() : '-' },
                                { label: "End Date", value: selectedNote.endDate ? new Date(selectedNote.endDate).toLocaleDateString() : '-' }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">{item.label}</label>
                                    <input value={item.value} disabled className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 h-9" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Premium Breakdown */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 md:p-8 border-l-4 border-l-blue-600 hover:shadow-lg transition-all">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6 pb-4 border-b border-slate-200 flex items-center gap-2">
                            <Banknote className="w-5 h-5 text-blue-600" /> Premium Breakdown
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { label: "Sum Insured", value: formatCurrency(selectedNote.sumInsured), className: "font-semibold" },
                                { label: "Gross Premium", value: formatCurrency(selectedNote.grossPremium), className: "font-semibold" },
                                { label: "Commission Rate", value: `${selectedNote.partyRate || 0}%` },
                                { label: "Commission Amount", value: formatCurrency(selectedNote.commission) },
                                { label: "VAT Rate", value: `${selectedNote.vatRate || 0}%` },
                                { label: "VAT Amount", value: formatCurrency(selectedNote.vatAmount) },
                                { label: "NCDF Levy", value: formatCurrency(selectedNote.ncdfLevyAmount) },
                                { label: "NAICOM Levy", value: formatCurrency(selectedNote.naicomLevyAmount) },
                                { label: "Net Amount", value: formatCurrency(selectedNote.netAmount), className: "font-bold text-lg text-blue-700" }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">{item.label}</label>
                                    <input value={item.value} disabled className={`w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 h-9 ${item.className || ''}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Narration */}
                    {selectedNote.narration && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 md:p-8 border-l-4 border-l-blue-600 hover:shadow-lg transition-all">
                            <h3 className="text-lg font-semibold text-slate-900 mb-6 pb-4 border-b border-slate-200 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" /> Narration
                            </h3>
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700">
                                {selectedNote.narration}
                            </div>
                        </div>
                    )}

                    {/* Submission Info */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-md p-6 md:p-8 border-l-4 border-l-blue-600 hover:shadow-lg transition-all">
                        <h3 className="text-lg font-semibold text-slate-900 mb-6 pb-4 border-b border-slate-200 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" /> Submission Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: "Submitted By", value: selectedNote.submittedBy || '-' },
                                { label: "Submitted On", value: selectedNote.submittedOn ? new Date(selectedNote.submittedOn).toLocaleString() : '-' },
                                { label: "Modified By", value: selectedNote.modifiedBy || '-' },
                                { label: "Modified On", value: selectedNote.modifiedOn ? new Date(selectedNote.modifiedOn).toLocaleString() : '-' }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">{item.label}</label>
                                    <input value={item.value} disabled className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 h-9" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- EDIT/ADD MODE ---
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans text-slate-900 min-h-screen bg-slate-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10 pb-6 border-b border-slate-200">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                    {viewMode === 'add' ? 'New Debit Note' : 'Edit Debit Note'}
                </h1>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setViewMode('list')} className="mr-2">Cancel</Button>
                    <Button onClick={handleSave} disabled={localLoading}>
                        {localLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Note
                    </Button>
                </div>
            </div>

            <div className="space-y-6 relative">
                {localLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="text-sm font-medium text-slate-600">Loading debit note data...</p>
                        </div>
                    </div>
                )}

                {/* 1. Reference Information */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    {renderSectionHeader(
                        'reference',
                        'Reference Information',
                        <Info className="w-5 h-5 text-blue-600" />
                    )}
                    {expandedSections.reference && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 md:p-8 animate-fadeIn">
                            {renderInputField('Billing Date', 'billingDate', formData.billingDate.split("T")[0], handleInputChange, 'date')}
                            
                            {/* COMMENTED - Payment Type with default "DIRECT CASH" */}
                            {/* {renderSelectField('Payment Type', paymentOptions, formData.paymentType, (val) => handleValueChange('paymentType', val), 'Select Type')} */}
                            
                            {/* COMMENTED - Credit Ref No with default null */}
                            {/* {renderInputField('Credit Ref No', 'creditRefNo', formData.creditRefNo || '', handleInputChange)} */}
                            
                            {/* COMMENTED - Credit Start Date with default new Date().toISOString() */}
                            {/* {renderInputField('Credit Start Date', 'creditStartDate', formData.creditStartDate.split("T")[0], handleInputChange, 'date')} */}
                            
                            {/* COMMENTED - Bank ID with default null */}
                            {/* {renderInputField('Bank ID', 'bankID', formData.bankID || '', handleInputChange, 'text', false, 'h-11')} */}
                            
                            {renderSelectField('Branch Category *', branchOptions, formData.branchID, (val) => handleValueChange('branchID', val), 'Select Branch')}
                            {renderSelectField('Business Source', sourceOptions, formData.bizSource, (val) => handleValueChange('bizSource', val), 'Select Source')}
                            
                            {/* COMMENTED - Business Type with default "DIRECT" */}
                            {/* {renderSelectField('Business Type', businessTypeOptions, formData.sourceType, (val) => handleValueChange('sourceType', val), 'Select Business Type')} */}
                            
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
                                    placeholder="Select a marketing staff to see unit"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. Policy Details */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    {renderSectionHeader(
                        'details',
                        'Policy Details',
                        <FileText className="w-5 h-5 text-blue-600" />
                    )}
                    {expandedSections.details && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 md:p-8">
                            {renderInputField('Policy No', 'policyNo', formData.policyNo, handleInputChange, 'text', true, 'bg-slate-50 text-slate-600')}
                            {renderInputField('Detail ID', 'detailID', formData.detailID, handleInputChange, 'text', true, 'bg-slate-50 text-slate-600')}
                            {renderInputField('Insured Name', 'insuredName', formData.insuredName, handleInputChange, 'text', true, 'bg-slate-50 text-slate-600')}
                            
                            {/* COMMENTED - Use Optional Insured with default false */}
                            {/* <div className="flex items-center gap-3 mt-6">
                                <Checkbox
                                    id="useOptionalInsured"
                                    checked={formData.useOptionalInsured}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, useOptionalInsured: checked === true }))}
                                />
                                <Label htmlFor="useOptionalInsured" className="text-sm cursor-pointer">Use Optional Insured</Label>
                            </div> */}
                            
                            {renderInputField('Bus. Proportion (%)', 'businessProportion', String(formData.businessProportion), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}
                            {renderInputField('Start Date', 'startDate', formData.startDate.split("T")[0], handleInputChange, 'date', true, 'bg-slate-50 text-slate-600')}
                            {renderInputField('End Date', 'endDate', formData.endDate.split("T")[0], handleInputChange, 'date', true, 'bg-slate-50 text-slate-600')}
                            
                            <div className="space-y-2 lg:col-span-4">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Narration</Label>
                                <Input name="narration" value={formData.narration} onChange={handleInputChange} className="h-11" />
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Premium & Levies */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    {renderSectionHeader(
                        'premium',
                        'Premium',
                        <Banknote className="w-5 h-5 text-blue-600" />,
                        expandedSections.premium && !isReadOnly && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRecalculate();
                                }}
                                disabled={localLoading || !formData.policyNo || formData.grossPremium}
                            >
                                <Loader2 className={`w-3 h-3 mr-2 ${localLoading ? 'animate-spin' : 'hidden'}`} />
                                <Clock className={`w-3 h-3 mr-2 ${localLoading ? 'hidden' : ''}`} />
                                Recalculate
                            </Button>
                        )
                    )}
                    {expandedSections.premium && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 md:p-8">
                            <div className="lg:col-span-4 mt-2 mb-2">
                                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Foreign Premium</h4>
                            </div>
                            {renderInputField('Tracking Cost', 'totalTrackingCost', String(formData.totalTrackingCost), handleInputChange, 'number')}
                            {renderInputField('Foreign Sum Insured', 'foreignSumInsured', String(formData.foreignSumInsured), handleInputChange, 'number')}
                            {renderInputField('Foreign Premium', 'foreignPremium', String(formData.foreignPremium), handleInputChange, 'number')}
                            
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Currency</Label>
                                <div className="flex gap-2">
                                    <Select
                                        options={currencyOptions}
                                        value={currencyOptions.find(c => c.value === formData.currency) || null}
                                        onChange={(opt) => {
                                            if (opt?.value) {
                                                handleCurrencyChange(opt.value);
                                            }
                                        }}
                                        classNamePrefix="react-select"
                                        placeholder="Select Currency"
                                        isSearchable={false}
                                        className="flex-1 text-sm"
                                    />
                                    {exchangeRateLoading && (
                                        <div className="flex items-center">
                                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Exchange Rate</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        name="exchangeRate"
                                        value={String(formData.exchangeRate)}
                                        disabled
                                        className="bg-slate-50 text-slate-600 h-11 flex-1"
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => fetchExchangeRate(formData.currency, "NGN")}
                                        disabled={exchangeRateLoading}
                                        className="h-11 px-3"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${exchangeRateLoading ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>
                            </div>

                            <div className="lg:col-span-4 mt-4 mb-2">
                                <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Premium</h4>
                            </div>

                            {renderInputField('Total Risk Sum Insured', 'totalRiskSumInsured', String(formData.totalRiskSumInsured), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}
                            {renderInputField('Total Risk Premium', 'totalRiskPremium', String(formData.totalRiskPremium), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}
                            
                            {/* <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sum Insured (Share)</Label>
                                <Input type="number" name="sumInsured" value={String(formData.sumInsured)} disabled className="bg-slate-50 text-slate-600 h-11" />
                            </div> */}
                            {/* <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Premium (Share)</Label>
                                <Input type="number" name="grossPremium" value={String(formData.grossPremium)} disabled className="bg-slate-50 text-slate-600 h-11" />
                            </div> */}
                            
                            {renderInputField('Comm. Rate (%)', 'commissionRate', String(formData.commissionRate), handleInputChange, 'number')}
                            {renderInputField('Comm. Amount', 'commissionAmount', String(formData.commissionAmount), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}
                            {renderInputField('VAT Rate (%)', 'vatRate', String(formData.vatRate), handleInputChange, 'number')}
                            {renderInputField('VAT Amount', 'vatAmount', String(formData.vatAmount), handleInputChange, 'number', true, 'bg-slate-50 text-slate-600')}
                            
                            {/* <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ORC Rate (%)</Label>
                                <Input type="number" name="orcRate" value={String(formData.orcRate)} onChange={handleInputChange} className="h-11" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ORC Amount</Label>
                                <Input type="number" name="orcAmount" value={String(formData.orcAmount)} disabled className="bg-slate-50 text-slate-600 h-11" />
                            </div> */}
                            
                            {renderInputField('Net Premium', 'netPremium', String(formData.netPremium), handleInputChange, 'number', true, 'bg-slate-100 text-blue-700 font-bold h-11')}
                            
                            {/* <div className="flex items-center gap-3 mt-6">
                                <Checkbox
                                    id="doNaicomLevy"
                                    checked={NAICOMLevy}
                                    onCheckedChange={(checked) => setNAICOMLevy(!NAICOMLevy)}
                                />
                                <Label htmlFor="doNaicomLevy" className="text-sm cursor-pointer">Add Levies</Label>
                            </div>

                            {NAICOMLevy && (
                                <>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">NCDF Levy Rate (%)</Label>
                                        <Input type="number" name="ncdfLevyRate" value={String(formData.ncdfLevyRate)} onChange={handleInputChange} className="h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">NCDF Levy Amount</Label>
                                        <Input type="number" name="ncdfLevyAmount" value={String(formData.ncdfLevyAmount)} disabled className="bg-slate-50 text-slate-600 h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">NAICOM Levy Rate (%)</Label>
                                        <Input type="number" name="naicomLevyRate" value={String(formData.naicomLevyRate)} onChange={handleInputChange} className="h-11" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">NAICOM Levy Amount</Label>
                                        <Input type="number" name="naicomLevyAmount" value={String(formData.naicomLevyAmount)} disabled className="bg-slate-50 text-slate-600 h-11" />
                                    </div>
                                </>
                            )} */}

                            <div className="lg:col-span-4 mt-4 flex justify-center">
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleRecalculate();
                                    }}
                                    disabled={localLoading || !formData.policyNo}
                                    type="button"
                                >
                                    {localLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
                                    Calculate
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Coinsurance Distribution */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    {renderSectionHeader(
                        'coinsurance',
                        'Underwriting Companies',
                        <Users className="w-5 h-5 text-blue-600" />,
                        expandedSections.coinsurance && !isReadOnly && (
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
                        )
                    )}
                    {expandedSections.coinsurance && (
                        <>
                            <div className="m-4 md:m-6 border border-slate-200 rounded-lg overflow-x-auto overflow-y-visible">
                                <table className="w-full border-collapse table-fixed min-w-[800px]">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200 whitespace-nowrap w-[80px]">Party ID</th>
                                            <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200 whitespace-nowrap w-[180px]">Party Name</th>
                                            <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200 whitespace-nowrap w-[90px]">Prop Rate%</th>
                                            <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200 whitespace-nowrap w-[90px]">Comm Rate%</th>
                                            <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200 whitespace-nowrap w-[90px]">VAT Rate%</th>
                                            <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200 whitespace-nowrap w-[110px]">Prop Value</th>
                                            <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200 whitespace-nowrap w-[110px]">Prop Premium</th>
                                            <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200 whitespace-nowrap w-[110px]">Comm Value</th>
                                            <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200 whitespace-nowrap w-[110px]">VAT Value</th>
                                            <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200 whitespace-nowrap w-[110px]">Net Premium</th>
                                            <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200 whitespace-nowrap w-[60px]">Lead</th>
                                            {!isReadOnly && <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200 whitespace-nowrap w-[60px]">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.coinsuranceDistribution.length === 0 ? (
                                            <tr><td colSpan={isReadOnly ? 11 : 12} className="text-center p-4 text-slate-500">No Records</td></tr>
                                        ) : (
                                            formData.coinsuranceDistribution.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-1.5 px-2 border-b border-slate-100">
                                                        <Input
                                                            type="text"
                                                            value={item.partyID}
                                                            onChange={(e) => handleCoinsuranceChange(idx, 'partyID', e.target.value)}
                                                            disabled={isReadOnly}
                                                            className="min-w-[70px] h-8 text-sm"
                                                        />
                                                    </td>
                                                    <td className="py-1.5 px-2 border-b border-slate-100 relative">
                                                        <div className="w-full">
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
                                                                isDisabled={isReadOnly}
                                                                classNamePrefix="react-select"
                                                                placeholder="Select..."
                                                                isSearchable={false}
                                                                menuPortalTarget={document.body}
                                                                styles={{
                                                                    control: (base) => ({
                                                                        ...base,
                                                                        minHeight: '32px',
                                                                        height: '32px',
                                                                        fontSize: '0.8rem',
                                                                        borderColor: '#e2e8f0',
                                                                        borderRadius: '0.375rem',
                                                                        boxShadow: 'none',
                                                                        '&:hover': { borderColor: '#cbd5e1' }
                                                                    }),
                                                                    valueContainer: (base) => ({
                                                                        ...base,
                                                                        height: '32px',
                                                                        padding: '0 6px',
                                                                        display: 'flex',
                                                                        alignItems: 'center'
                                                                    }),
                                                                    indicatorsContainer: (base) => ({
                                                                        ...base,
                                                                        height: '32px'
                                                                    }),
                                                                    dropdownIndicator: (base) => ({
                                                                        ...base,
                                                                        padding: '2px 6px'
                                                                    }),
                                                                    menu: (base) => ({
                                                                        ...base,
                                                                        zIndex: 9999,
                                                                        borderRadius: '0.375rem',
                                                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                                                        border: '1px solid #e2e8f0',
                                                                        fontSize: '0.8rem',
                                                                        width: '300px',
                                                                        maxWidth: '400px'
                                                                    }),
                                                                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                                                                    option: (base, state) => ({
                                                                        ...base,
                                                                        padding: '6px 10px',
                                                                        fontSize: '0.8rem',
                                                                        backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#eff6ff' : 'white',
                                                                        color: state.isSelected ? 'white' : '#0f172a',
                                                                        cursor: 'pointer',
                                                                        '&:hover': {
                                                                            backgroundColor: state.isSelected ? '#2563eb' : '#eff6ff'
                                                                        }
                                                                    }),
                                                                    singleValue: (base) => ({
                                                                        ...base,
                                                                        color: '#0f172a',
                                                                        fontSize: '0.8rem'
                                                                    }),
                                                                    placeholder: (base) => ({
                                                                        ...base,
                                                                        color: '#94a3b8',
                                                                        fontSize: '0.8rem'
                                                                    })
                                                                }}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-1.5 px-2 border-b border-slate-100 text-right">
                                                        <Input
                                                            type="number"
                                                            value={String(item.propRate)}
                                                            onChange={(e) => handleCoinsuranceChange(idx, 'propRate', parseFloat(e.target.value) || 0)}
                                                            disabled={isReadOnly}
                                                            className="text-right min-w-[60px] max-w-[80px] h-8 text-sm"
                                                        />
                                                    </td>
                                                    <td className="py-1.5 px-2 border-b border-slate-100 text-right">
                                                        <Input
                                                            type="number"
                                                            value={String(item.commRate)}
                                                            onChange={(e) => handleCoinsuranceChange(idx, 'commRate', parseFloat(e.target.value) || 0)}
                                                            disabled={isReadOnly}
                                                            className="text-right min-w-[60px] max-w-[80px] h-8 text-sm"
                                                        />
                                                    </td>
                                                    <td className="py-1.5 px-2 border-b border-slate-100 text-right">
                                                        <Input
                                                            type="number"
                                                            value={String(item.vatRate)}
                                                            onChange={(e) => handleCoinsuranceChange(idx, 'vatRate', parseFloat(e.target.value) || 0)}
                                                            disabled={isReadOnly}
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
                                                            value={String(item.commValue)}
                                                            disabled
                                                            className="text-right min-w-[90px] max-w-[110px] bg-slate-50 h-8 text-sm"
                                                        />
                                                    </td>
                                                    <td className="py-1.5 px-2 border-b border-slate-100 text-right">
                                                        <Input
                                                            type="number"
                                                            value={String(item.vatValue)}
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
                                                            disabled={isReadOnly}
                                                            className="h-3.5 w-3.5"
                                                        />
                                                    </td>
                                                    {!isReadOnly && (
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
                                                    )}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {formData.coinsuranceDistribution.length > 0 && !isReadOnly && (
                                <>
                                    <div className="mx-4 md:mx-6 mb-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Calculated Totals</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                            {[
                                                { label: "Total Prop Value", value: formData.coinsuranceDistribution.reduce((sum, item) => sum + (Number(item.propValue) || 0), 0) },
                                                { label: "Total Prop Premium", value: formData.coinsuranceDistribution.reduce((sum, item) => sum + (Number(item.propPremium) || 0), 0) },
                                                { label: "Total Commission", value: formData.coinsuranceDistribution.reduce((sum, item) => sum + (Number(item.commValue) || 0), 0) },
                                                { label: "Total VAT", value: formData.coinsuranceDistribution.reduce((sum, item) => sum + (Number(item.vatValue) || 0), 0) },
                                                { label: "Total Net Premium", value: formData.coinsuranceDistribution.reduce((sum, item) => sum + (Number(item.netPremium) || 0), 0), bold: true }
                                            ].map((item, idx) => (
                                                <div key={idx}>
                                                    <Label className="text-xs text-slate-500">{item.label}</Label>
                                                    <div className={`font-medium text-sm ${item.bold ? 'font-bold text-blue-600' : ''}`}>
                                                        {item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50 rounded-b-lg">
                                        <Button
                                            size="sm"
                                            variant="default"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCalculateAllCoinsurance();
                                            }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            <Calculator className="w-4 h-4 mr-2" />
                                            Calculate Coinsurance
                                        </Button>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                {/* 5. Marketing Distribution - COMMENTED OUT */}
                {/* <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div 
                        className="p-5 bg-gradient-to-r from-white to-slate-50 border-b border-slate-200 cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors"
                        onClick={() => toggleSection('marketing')}
                    >
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            {expandedSections.marketing ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            Marketing
                        </h3>
                    </div>
                    {expandedSections.marketing && (
                        <div className="m-6 border border-slate-200 rounded-lg overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">Unit Name</th>
                                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">Bus. Prop</th>
                                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">Premium</th>
                                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">Commission</th>
                                        <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b-2 border-slate-200">Net</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.marketingDistribution.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center p-4 text-slate-500">No marketing distribution</td></tr>
                                    ) : (
                                        formData.marketingDistribution.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-3 px-4 border-b border-slate-100">{item.mktUnitName}</td>
                                                <td className="py-3 px-4 border-b border-slate-100 text-right">{item.busProp}%</td>
                                                <td className="py-3 px-4 border-b border-slate-100 text-right">{item.grossPremium}</td>
                                                <td className="py-3 px-4 border-b border-slate-100 text-right">{item.commission}</td>
                                                <td className="py-3 px-4 border-b border-slate-100 text-right">{item.netPremium}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div> */}

                {/* Footer Actions */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 flex justify-end">
                    <Button onClick={handleSave} disabled={localLoading}>
                        {localLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Note
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DebitNote;