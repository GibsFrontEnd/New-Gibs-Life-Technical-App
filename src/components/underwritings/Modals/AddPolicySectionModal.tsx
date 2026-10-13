//@ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "../../../features/store"
import type { RootState } from "../../../features/store"
import { getSubRiskSectionsByRiskId, getSubRiskSectionsBySectionCode } from "../../../features/reducers/productReducers/subRiskSectionSlice"
import { getSubRiskSMIsBySectionCode } from "../../../features/reducers/productReducers/subRiskSMISlice"
import { getAllRisks } from "../../../features/reducers/adminReducers/riskSlice"
import { fetchProducts } from "../../../features/reducers/productReducers/productSlice"
import Select from "react-select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Button } from "../../ui/new-button"
import Input from "../../ui/Input"
import { Label } from "../../ui/label"
import type { PolicySection, PolicyRiskItemUI, PolicyAdjustmentCalculations } from "../../../types/underwriting"
import "../../Modals/AddSectionModal.css"
import "./AddPolicySectionModal.css"
import {
    calculatePolicyRiskItems,
    calculatePolicySectionAdjustment,
} from "../../../features/reducers/underwriteReducers/underwritingSlice"
import { toast } from "../../ui/use-toast"
import { Checkbox } from "../../ui/checkbox"
import { Loader2, Plus, Trash2 } from "lucide-react"
import {
    SECTION_DISCOUNTS,
    SECTION_LOADINGS,
    BASIS_PREMIUM,
    BASIS_SUM_INSURED,
    ITEM_DISCOUNT_SUGGESTIONS,
    ITEM_LOADING_SUGGESTIONS,
    readItemAdjustments,
    toItemAdjustmentInput,
    type ItemAdjustment,
    emptySectionRates,
    hasSectionAdjustments,
    readSectionRates,
    savedSectionAdjustmentResult,
    type SectionRates,
} from "../../../utils/section-adjustments"
import { formatMoney } from "../../../utils/currency"

interface AddPolicySectionModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (section: PolicySection) => void | Promise<void>
    section?: PolicySection | any
    productId: string
    proportionRate?: number
    onCalculateFullRiskArray?: (sectionID: string, fullRiskArray: any[]) => void
    subRiskFields?: any[]
    isReadOnly?: boolean;
    /** The policy's currency; sums insured and premiums are in it */
    currency?: string
}

export const AddPolicySectionModal = ({
    isOpen,
    onClose,
    onSave,
    section,
    productId,
    proportionRate = 100,
    onCalculateFullRiskArray,
    subRiskFields = [],
    isReadOnly = false,
    currency,
}: AddPolicySectionModalProps) => {

    // Check if this is a Package risk (P or PP)
    const isPackageRisk = productId === "P" || productId === "PP"


    const dispatch = useDispatch<AppDispatch>()

    const [localSections, setLocalSections] = useState<any[]>([])
    const [localSMIs, setLocalSMIs] = useState<any[]>([])

    const { risks } = useSelector((state: RootState) => state.risks)
    const { products } = useSelector((state: RootState) => state.products)
    const [riskClass, setRiskClass] = useState("")
    const [subRiskClass, setSubRiskClass] = useState("")

    // For Package risks: use subRiskClass if selected, otherwise fallback to riskClass
    // For non-Package risks: use productId directly
    const getEffectiveRiskId = () => {
        if (isPackageRisk) {
            return subRiskClass || riskClass
        }
        return productId
    }

    const filteredProducts = products.filter(p => p.riskID === riskClass)
    const productOptions = filteredProducts.map(p => ({ value: p.productID, label: p.productName }))

    const [sectionAgregate, setSectionAggregate] = useState<any>(null)
    const [adjCollapse, setAdjCollapse] = useState<boolean>(true)
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [showAllFields, setShowAllFields] = useState(false)
    const [isLoadingSections, setIsLoadingSections] = useState(false)
    const [isLoadingSMIs, setIsLoadingSMIs] = useState(false)

    const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({})

    // Section-level discounts/loadings (rates, %). Loaded from the section being edited each
    // time the modal opens — see the open effect below.
    const [adjustments, setAdjustments] = useState<SectionRates>(emptySectionRates)
    // Latest adjustment breakdown (saved one on open, then the live preview from the API)
    const [sectionAdjustmentsResult, setSectionAdjustmentsResult] = useState<any>(null)
    const [isPreviewingAdjustments, setIsPreviewingAdjustments] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const initialForm = (): PolicySection => ({
        sectionID: section?.sectionID || "",
        sectionName: section?.sectionName || "",
        location: section?.location || "",
        sectionSumInsured: section?.sectionSumInsured || 0,
        sectionPremium: section?.sectionGrossPremium || 0,
        sectionNetPremium: (section as any)?.sectionNetPremium ?? 0,
        lastCalculated: (section as any)?.lastCalculated ?? null,
        riskItems: section?.riskItems
            ? (section.riskItems as any[]).map((it: any, idx: number) => ({
                itemNo: it.itemNo ?? idx + 1,
                sectionID: it.sectionID ?? it.sectionId ?? section?.sectionID ?? `section_${Date.now()}`,
                smiCode: it.smiCode ?? "",
                itemDescription: it.itemDescription ?? "",
                actualValue: it.actualValue ?? 0,
                itemRate: it.itemRate ?? 0,
                multiplyRate: it.multiplyRate ?? 0,
                location: section?.location ?? "",
                feaDiscountRate: it.feaDiscountRate ?? 0,
                actualPremium: it.actualPremium ?? 0,
                actualPremiumFormula: it.actualPremiumFormula ?? "",
                shareValue: it.shareValue ?? 0,
                shareValueFormula: it.shareValueFormula ?? "",
                premiumValue: it.premiumValue ?? 0,
                premiumValueFormula: it.premiumValueFormula ?? "",
                stockDiscountAmount: it.stockDiscountAmount ?? 0,
                feaDiscountAmount: it.feaDiscountAmount ?? 0,
                netPremiumAfterDiscounts: it.netPremiumAfterDiscounts ?? 0,
                stockItem: it.stockItem ?? null,
                // named item discounts/loadings, editable; saved amounts kept for display
                ...readItemAdjustments(it),
                appliedDiscounts: it.appliedDiscounts ?? it.discountsApplied ?? [],
                appliedLoadings: it.appliedLoadings ?? it.loadingsApplied ?? [],
                _showStock: !!it.stockItem,
                _collapsed: false,
            }))
            : [],
        proportionRate: section?.proportionRate ?? proportionRate,
    } as PolicySection)

    const [formData, setFormData] = useState<PolicySection>(initialForm)
    const [selectedSectionCode, setSelectedSectionCode] = useState<string>(section?.sectionID || "")
    const [applyingMap, setApplyingMap] = useState<Record<string, boolean>>({})
    const [itemsInTable, setItemsInTable] = useState<Set<number>>(new Set())

    // Fetch risks (Business Categories) - ONLY for Package risks
    useEffect(() => {
        if (isPackageRisk) {
            dispatch(getAllRisks({ pageNumber: 1, pageSize: 100 }) as any)
        }
    }, [dispatch, isPackageRisk])

    // Fetch products (Subclasses) whenever the selected Business Category changes - ONLY for Package risks
    useEffect(() => {
        if (isPackageRisk && riskClass) {
            dispatch(fetchProducts({ riskId: riskClass, pageNumber: 1, pageSize: 100 }) as any)
        }
    }, [dispatch, isPackageRisk, riskClass])

    // Fetch sections using the effective risk ID
    useEffect(() => {
        const effectiveRiskId = getEffectiveRiskId()
        
        console.log("🔍 [Modal] Sections fetch useEffect triggered:", {
            productId,
            isPackageRisk,
            riskClass,
            subRiskClass,
            effectiveRiskId,
            isOpen,
            shouldFetch: !!(effectiveRiskId && isOpen)
        });

        if (effectiveRiskId && isOpen) {
            console.log("🚀 [Modal] Starting to fetch sections with effectiveRiskId:", effectiveRiskId);
            setLocalSections([])
            setIsLoadingSections(true);

            dispatch(getSubRiskSectionsByRiskId(effectiveRiskId) as any)
                .unwrap()
                .then((data: any[]) => {
                    console.log("✅ [Modal] Sections API Response:", {
                        data,
                        isArray: Array.isArray(data),
                        length: data?.length,
                        firstItem: data?.[0]
                    });
                    setLocalSections(Array.isArray(data) ? data : [])
                })
                .catch((error) => {
                    console.error("❌ [Modal] Error fetching sections:", error);
                    console.error("Error details:", {
                        message: error?.message,
                        status: error?.status,
                        response: error?.response
                    });
                    setLocalSections([])
                })
                .finally(() => {
                    setIsLoadingSections(false);
                    console.log("🏁 [Modal] Sections fetch completed, isLoadingSections set to false");
                });
        } else {
            console.log("⚠️ [Modal] Skipping sections fetch - conditions not met:", {
                hasEffectiveRiskId: !!effectiveRiskId,
                isOpen
            });
            setLocalSections([])
        }
    }, [dispatch, isPackageRisk, riskClass, subRiskClass, productId, isOpen]);

    // Backfill riskClass on edit when Package — the backend doesn't
    // return riskClass directly, but the section's subRiskID (via by-section-code) is it.
    const [riskClassResolvedFor, setRiskClassResolvedFor] = useState<string | null>(null)

    useEffect(() => {
        const targetSectionID = section?.sectionID ?? null

        console.log("🧩 [Modal] riskClass backfill useEffect triggered:", {
            productId,
            isPackageRisk,
            isOpen,
            sectionID: targetSectionID,
            currentRiskClass: riskClass,
            riskClassResolvedFor,
            shouldFetch: !!(isPackageRisk && isOpen && targetSectionID && riskClassResolvedFor !== targetSectionID)
        });

        if (isPackageRisk && isOpen && targetSectionID && riskClassResolvedFor !== targetSectionID) {
            console.log("🚀 [Modal] Fetching subRiskID via getSubRiskSectionsBySectionCode with code:", targetSectionID);

            dispatch(getSubRiskSectionsBySectionCode(targetSectionID) as any)
                .unwrap()
                .then((data: any[]) => {
                    console.log("✅ [Modal] by-section-code API Response:", {
                        data,
                        isArray: Array.isArray(data),
                        length: Array.isArray(data) ? data.length : undefined,
                    });

                    const match = Array.isArray(data) ? data[0] : data
                    console.log("🔎 [Modal] Resolved match record:", match);

                    if (match?.subRiskID) {
                        console.log("✅ [Modal] Setting riskClass to subRiskID:", match.subRiskID);
                        setRiskClass(match.subRiskID)
                    } else {
                        console.warn("⚠️ [Modal] No subRiskID found on match record. Keys present:", match ? Object.keys(match) : match);
                    }
                    setRiskClassResolvedFor(targetSectionID)
                })
                .catch((error) => {
                    console.error("❌ [Modal] Error fetching by section code:", error);
                    console.error("Error details:", {
                        message: error?.message,
                        status: error?.status,
                        response: error?.response
                    });
                    setRiskClassResolvedFor(targetSectionID)
                })
        } else {
            console.log("⏭️ [Modal] Skipping riskClass backfill - conditions not met:", {
                isPackageRisk,
                isOpen,
                hasSectionID: !!targetSectionID,
                alreadyResolvedForThisSection: riskClassResolvedFor === targetSectionID,
            });
        }
    }, [dispatch, isPackageRisk, isOpen, section?.sectionID])

    // Fetch SMIs using the selected section code and effective risk ID
    useEffect(() => {
        const effectiveRiskId = getEffectiveRiskId()
        
        if (selectedSectionCode && effectiveRiskId) {
            setLocalSMIs([])
            setIsLoadingSMIs(true);
            dispatch(getSubRiskSMIsBySectionCode({
                sectionCode: selectedSectionCode,
                riskID: effectiveRiskId
            }) as any)
                .unwrap()
                .then((data: any[]) => {
                    setLocalSMIs(Array.isArray(data) ? data : [])
                })
                .catch(() => {
                    setLocalSMIs([])
                })
                .finally(() => setIsLoadingSMIs(false));
        }
    }, [dispatch, selectedSectionCode, isPackageRisk, riskClass, subRiskClass, productId]);

    // Load the section being edited (or a blank one) every time the modal opens. This modal
    // stays mounted, so useState initialisers only ever saw the first render — everything
    // that depends on `section` has to be (re)set here.
    useEffect(() => {
        if (isOpen) {
            const form = initialForm()
            setFormData(form)
            setEditingIndex(null)
            setItemsInTable(new Set((form.riskItems || []).map((_: any, i: number) => i)))

            const rates = readSectionRates(section)
            setAdjustments(rates)
            setAdjCollapse(!hasSectionAdjustments(rates))
            setSectionAdjustmentsResult(savedSectionAdjustmentResult(section))
            setSectionAggregate(section
                ? {
                    aggregateSumInsured: Number(section.sectionSumInsured) || 0,
                    // premium the section adjustments are applied to (after item-level discounts)
                    aggregatePremium: Number(section.sectionGrossPremium ?? section.sectionPremium) || 0,
                }
                : null)

            if (section) {
                setSelectedSectionCode(section.sectionID)
                const existingDynamics: any = {};
                subRiskFields.forEach((field: any) => {
                    const key = field.dbSectionField;
                    const val = section[key] !== undefined ? section[key]
                        : section[key.toLowerCase()] !== undefined ? section[key.toLowerCase()]
                            : section[key.charAt(0).toLowerCase() + key.slice(1)];
                    if (val !== undefined) {
                        existingDynamics[key] = val;
                    }
                });
                setDynamicValues({ ...existingDynamics });
            } else {
                console.log("🧹 [Modal] Add mode - resetting selectedSectionCode/dynamicValues/riskClass");
                setSelectedSectionCode("")
                setDynamicValues({});
                setRiskClass("")
                setSubRiskClass("")
                setRiskClassResolvedFor(null)
            }
        }
    }, [isOpen, section, subRiskFields])

    const keyFor = (index: number) => `${formData.sectionID || "sec"}|${index}`

    const handleSectionNameChange = (selectedValue: string) => {
        console.log("🖱️ [Modal] Section selected:", {
            selectedValue,
            localSectionsCount: localSections.length,
            localSections: localSections.map(s => ({ code: s.sectionCode, name: s.sectionName }))
        });

        const selectedSection = localSections.find((s) => s.sectionCode === selectedValue);

        if (selectedSection) {
            console.log("✅ [Modal] Found selected section:", selectedSection);
            setSelectedSectionCode(selectedSection.sectionCode);
            setFormData((prev) => ({
                ...prev,
                sectionName: selectedSection.sectionName,
                sectionID: selectedSection.sectionCode,
            }));
        } else {
            console.warn("⚠️ [Modal] No section found for value:", selectedValue);
            setSelectedSectionCode("");
            setFormData((prev) => ({ ...prev, sectionName: "", sectionID: "" }));
        }
    };

    const handleAddItem = () => {
        const newItem: any = {
            itemNo: (formData.riskItems || []).length + 1,
            id: `local_${Date.now()}`,
            sectionID: formData.sectionID || `section_${Date.now()}`,
            smiCode: "",
            itemDescription: "",
            actualValue: 0,
            itemRate: 0,
            multiplyRate: 0,
            location: formData.location,
            feaDiscountRate: 0,
            actualPremium: 0,
            actualPremiumFormula: "",
            shareValue: 0,
            shareValueFormula: "",
            premiumValue: 0,
            premiumValueFormula: "",
            stockDiscountAmount: 0,
            feaDiscountAmount: 0,
            netPremiumAfterDiscounts: 0,
            stockItem: null,
            discounts: [],
            loadings: [],
            _showStock: false,
            _collapsed: false,
        }
        setFormData((prev) => ({
            ...prev,
            riskItems: [...(prev.riskItems || []), newItem],
        }))
        setEditingIndex(formData.riskItems.length);
        if (formData.riskItems.length > 0) handleAddToTable(formData.riskItems.length - 1);
    }

    // ----- item-level named discounts/loadings -----
    const updateItemAdjustments = (index: number, kind: "discounts" | "loadings", fn: (list: ItemAdjustment[]) => ItemAdjustment[]) =>
        setFormData((prev) => {
            const items = [...(prev.riskItems as any[])]
            items[index] = { ...items[index], [kind]: fn([...(items[index]?.[kind] || [])]) }
            return { ...prev, riskItems: items }
        })

    const addItemAdjustment = (index: number, kind: "discounts" | "loadings") =>
        updateItemAdjustments(index, kind, (list) => [...list, { adjustmentName: "", rate: "", appliedOn: BASIS_PREMIUM }])

    const changeItemAdjustment = (index: number, kind: "discounts" | "loadings", row: number, field: keyof ItemAdjustment, value: any) =>
        updateItemAdjustments(index, kind, (list) => list.map((a, i) => (i === row
            ? { ...a, [field]: field === "rate" ? (value === "" ? "" : Number(value)) : value }
            : a)))

    const removeItemAdjustment = (index: number, kind: "discounts" | "loadings", row: number) =>
        updateItemAdjustments(index, kind, (list) => list.filter((_, i) => i !== row))

    // Amount the last calculation produced for a named adjustment
    const appliedAmount = (item: any, kind: "discounts" | "loadings", name: string) => {
        const list = kind === "discounts" ? item.appliedDiscounts : item.appliedLoadings
        const hit = (list || []).find((a: any) =>
            String(a.adjustmentName ?? a.name ?? "").trim().toLowerCase() === String(name || "").trim().toLowerCase())
        return hit ? Number(hit.amount) || 0 : null
    }

    const handleItemChange = (index: number, field: keyof PolicyRiskItemUI | string, value: any) => {
        const updated = [...(formData.riskItems as any[])]
        const numeric = ["actualValue", "itemRate", "multiplyRate", "feaDiscountRate"]
        const parsed = numeric.includes(field as string) ? (value === "" ? 0 : Number(value)) : value
        updated[index] = { ...updated[index], [field]: parsed }

        if (field === "smiCode") {
            const s = localSMIs.find((x) => x.smiCode === value)
            if (s)
                updated[index].itemRate =
                    (s as any).rates ?? (s as any).rate ?? (s as any).itemRate ?? (s as any).defaultRate ?? updated[index].itemRate
        }

        // Stock is always rated at the item rate (the Stock Rate input is read-only and shows itemRate)
        if ((field === "itemRate" || field === "smiCode") && updated[index].stockItem) {
            updated[index].stockItem = {
                ...updated[index].stockItem,
                stockRate: updated[index].itemRate,
            }
        }
        if (field === "location")
            updated[index].location = formData.location;

        setFormData((p) => ({ ...p, riskItems: updated }))
    }

    const handleRemoveItem = (index: number) => {
        const updated = (formData.riskItems as any[])
            .filter((_, i) => i !== index)
            .map((it, i) => ({ ...it, itemNo: i + 1 }))

        const newItemsInTable = new Set<number>()
        itemsInTable.forEach(oldIndex => {
            if (oldIndex < index) newItemsInTable.add(oldIndex)
            else if (oldIndex > index) newItemsInTable.add(oldIndex - 1)
        })
        setItemsInTable(newItemsInTable)
        setFormData((p) => ({ ...p, riskItems: updated }))
        if (editingIndex === index) setEditingIndex(null);
    }

    const handleAddToTable = async (index: number) => {
        setItemsInTable(prev => new Set([...prev, index]))
    }

    const handleEditFromTable = (index: number) => {
        setItemsInTable(prev => {
            const newSet = new Set(prev)
            newSet.delete(index)
            return newSet
        })
    }

    const toggleStockUI = (index: number) => {
        const updated = [...(formData.riskItems as any[])]
        updated[index]._showStock = !updated[index]._showStock
        if (updated[index]._showStock && !updated[index].stockItem) {
            updated[index].stockItem = {
                stockCode: "",
                stockDescription: "",
                stockSumInsured: 0,
                stockRate: updated[index].itemRate || 0,
                stockDiscountRate: 0,
            }
        }
        setFormData((p) => ({ ...p, riskItems: updated }))
    }

    const handleStockChange = (index: number, field: string, value: any) => {
        const updated = [...(formData.riskItems as any[])]
        const stock = updated[index].stockItem ? { ...updated[index].stockItem } : {}
        const numeric = ["stockSumInsured", "stockRate", "stockDiscountRate"]
        stock[field] = numeric.includes(field) ? (value === "" ? 0 : Number(value)) : value
        updated[index].stockItem = stock
        setFormData((p) => ({ ...p, riskItems: updated }))
    }

    const toggleCollapse = (index: number) => {
        const updated = [...(formData.riskItems as any[])]
        updated[index]._collapsed = !updated[index]._collapsed
        setFormData((p) => ({ ...p, riskItems: updated }))
    }

    // Only the rates the API applies, as numbers (inputs can hold "" while typing)
    const getCleanAdjustments = (): SectionRates => {
        const clean = emptySectionRates()
        ;[...SECTION_DISCOUNTS, ...SECTION_LOADINGS].forEach((f) => {
            const n = Number(adjustments[f.key])
            clean[f.key] = Number.isFinite(n) && n > 0 ? n : 0
        })
        return clean
    }

    /** Runs the section adjustments on the API and returns the breakdown (null on failure). */
    const previewAdjustments = async (premium: number, rates: SectionRates) => {
        if (!(premium > 0)) return null // the API rejects an aggregate premium of 0
        const resp: PolicyAdjustmentCalculations = await dispatch(calculatePolicySectionAdjustment({
            aggregatePremium: premium,
            ...rates,
        })).unwrap()
        return resp
    }

    // Live preview: re-run the adjustments whenever the rates or the section premium change,
    // so the net premium shown is always what Save will store.
    const adjustmentsKey = JSON.stringify(getCleanAdjustments())
    useEffect(() => {
        if (!isOpen) return
        const premium = Number(sectionAgregate?.aggregatePremium) || 0
        if (!(premium > 0)) return
        let cancelled = false
        const timer = setTimeout(async () => {
            setIsPreviewingAdjustments(true)
            try {
                const resp = await previewAdjustments(premium, JSON.parse(adjustmentsKey))
                if (cancelled || !resp) return
                setSectionAdjustmentsResult(resp)
                setFormData((prev) => ({ ...prev, sectionNetPremium: Number(resp.netPremiumDue) || 0 }))
            } catch {
                if (!cancelled) toast({ description: "Could not preview section adjustments", variant: "destructive", duration: 2000 })
            } finally {
                if (!cancelled) setIsPreviewingAdjustments(false)
            }
        }, 400)
        return () => { cancelled = true; clearTimeout(timer) }
    }, [isOpen, adjustmentsKey, sectionAgregate?.aggregatePremium])

    const setAdjustmentRate = (key: string, value: string) =>
        setAdjustments((prev: any) => ({ ...prev, [key]: value === "" ? "" : Number(value) }))

    // Proportion only drives the informational share columns; premiums are calculated at 100%.
    const sectionProportionRate = () => Number((formData as any).proportionRate) || proportionRate || 100

    // Single source of truth for what we send to /calculate/risk-items (used by single-item and all-items calc)
    const toRiskItemPayload = (it: any, i: number) => ({
        itemNo: it.itemNo || i + 1,
        sectionID: it.sectionID,
        smiCode: it.smiCode,
        smiDetail: localSMIs.find((x) => x.smiCode === it.smiCode)?.smiDetails || it.smiDetail || "",
        itemDescription: it.itemDescription,
        actualValue: Number(it.actualValue) || 0,
        itemRate: Number(it.itemRate) || 0,
        multiplyRate: Number(it.multiplyRate) || 0,
        location: it.location || "",
        feaDiscountRate: Number(it.feaDiscountRate) || 0,
        discounts: toItemAdjustmentInput(it.discounts),
        loadings: toItemAdjustmentInput(it.loadings),
        stockItem: it.stockItem ? {
            stockCode: it.stockItem.stockCode || "",
            stockDescription: it.stockItem.stockDescription || "",
            stockSumInsured: Number(it.stockItem.stockSumInsured) || 0,
            stockRate: Number(it.itemRate) || 0, // stock is rated at the item rate
            stockDiscountRate: Number(it.stockItem.stockDiscountRate) || 0,
        } : null,
    })


    /**
     * Recalculates every risk item on the server and returns the section figures (all at 100%),
     * or null if the calculation failed (a toast has already been shown).
     */
    const handleCalculateAllItems = async () => {
        const items: any[] = formData.riskItems || []
        if (items.length === 0) return null
        setApplyingMap((m) => ({ ...m, ALL: true }))

        const payload = {
            subRisk: getEffectiveRiskId(),
            riskItems: items.map(toRiskItemPayload),
            proportionRate: sectionProportionRate(),
        }

        try {
            const resp = await (dispatch(calculatePolicyRiskItems(payload)) as any).unwrap()
            if (!resp || !Array.isArray(resp.calculatedItems)) {
                toast({ description: "Failed to calculate all items", variant: "destructive", duration: 2000 });
                return null
            }

            // The API returns calculated items in the same order they were sent
            const mergedItems = items.map((it, i) => {
                const c = resp.calculatedItems[i]
                if (!c) return it
                return {
                    ...it,
                    stockItem: it.stockItem ? { ...it.stockItem, stockRate: Number(it.itemRate) || 0 } : null,
                    actualPremium: c.actualPremium,
                    actualPremiumFormula: c.actualPremiumFormula ?? it.actualPremiumFormula,
                    shareValue: c.shareValue,
                    shareValueFormula: c.shareValueFormula ?? it.shareValueFormula,
                    premiumValue: c.premiumValue,
                    premiumValueFormula: c.premiumValueFormula ?? it.premiumValueFormula,
                    totalSumInsured: c.totalSumInsured,
                    stockDiscountAmount: c.stockDiscountAmount ?? 0,
                    feaDiscountAmount: c.feaDiscountAmount ?? 0,
                    netPremiumAfterDiscounts: c.netPremiumAfterDiscounts ?? 0,
                    appliedLoadings: c.appliedLoadings ?? [],
                    appliedDiscounts: c.appliedDiscounts ?? [],
                    totalItemLoadingAmount: c.totalItemLoadingAmount ?? 0,
                    totalItemDiscountAmount: c.totalItemDiscountAmount ?? 0,
                }
            })

            // Same figures the API saves for the section before section-level adjustments:
            // sum insured incl. stock, and premium after FEA/stock discounts.
            const result = {
                riskItems: mergedItems,
                sectionSumInsured: Number(resp.totalActualValue) || 0,
                sectionPremium: Number(resp.totalNetPremiumAfterDiscounts) || 0,
            }

            setSectionAggregate({ aggregateSumInsured: result.sectionSumInsured, aggregatePremium: result.sectionPremium })
            setFormData((prev) => ({
                ...prev,
                ...result,
                sectionNetPremium: result.sectionPremium,
                lastCalculated: new Date().toISOString(),
            }))
            return result
        } catch (err: any) {
            toast({ description: "Failed to calculate all items", variant: "destructive", duration: 2000 });
            return null
        } finally {
            setApplyingMap((m) => { const c = { ...m }; delete c["ALL"]; return c })
        }
    }

    // Recalculating all items also refreshes the section totals the adjustments are applied to
    const handleApplyAndCalculate = async (index: number) => {
        const item = (formData.riskItems || [])[index]
        if (!(Number(item?.actualValue) > 0)) {
            toast({ description: "Enter an actual value above 0", variant: "warning", duration: 2500 });
            return
        }
        setApplyingMap((m) => ({ ...m, [keyFor(index)]: true }))
        try {
            const result = await handleCalculateAllItems()
            if (result) handleAddToTable(index)
        } finally {
            setApplyingMap((m) => { const c = { ...m }; delete c[keyFor(index)]; return c })
        }
    }

    const handleSave = async () => {
        setEditingIndex(null);
        if (!formData.sectionName) {
            toast({ description: "Please select a section name", variant: "warning", duration: 2000 });
            return
        }
        const items: any[] = formData.riskItems || []
        if (items.length === 0) {
            toast({ description: "Add at least one risk item to the section", variant: "warning", duration: 2500 });
            return
        }
        const incomplete = items.findIndex((it) => !(Number(it.actualValue) > 0))
        if (incomplete !== -1) {
            toast({ description: `Item ${incomplete + 1}: enter an actual value above 0`, variant: "warning", duration: 3000 });
            return
        }
        // A half-filled adjustment row would otherwise be dropped silently
        const halfFilled = items.findIndex((it) => [...(it.discounts || []), ...(it.loadings || [])].some((a: any) =>
            Boolean(String(a.adjustmentName || "").trim()) !== (Number(a.rate) > 0)))
        if (halfFilled !== -1) {
            toast({ description: `Item ${halfFilled + 1}: each discount/loading needs both a name and a rate (or remove the row)`, variant: "warning", duration: 3500 });
            return
        }

        const cleanAdjustments = getCleanAdjustments()

        // Always save freshly calculated figures (the old code saved state from before the recalculation finished)
        const calculated = await handleCalculateAllItems()
        if (!calculated) return

        // The API accepts adjustments that push a premium below zero (e.g. a discount rated on
        // the sum insured); never save that.
        const negative = (calculated.riskItems || []).findIndex((it: any) => Number(it.netPremiumAfterDiscounts) < 0)
        if (negative !== -1) {
            toast({
                description: `Item ${negative + 1}: its discounts exceed its premium (net ${formatCurrency(Number(calculated.riskItems[negative].netPremiumAfterDiscounts))}). A discount "on Sum Insured" takes that % of the whole sum insured — check the rate and basis.`,
                variant: "destructive",
                duration: 6000,
            });
            return
        }

        // Apply section-level discounts/loadings so the section's net premium (which the calculator
        // aggregates, adjusts and pro-rates) matches what the API saves for this section.
        let sectionNetPremium = calculated.sectionPremium
        let adj: any = null
        if (calculated.sectionPremium > 0) {
            try {
                adj = await previewAdjustments(calculated.sectionPremium, cleanAdjustments)
                setSectionAdjustmentsResult(adj)
                sectionNetPremium = Number(adj?.netPremiumDue ?? calculated.sectionPremium)
            } catch (err: any) {
                toast({ description: "Failed to apply section adjustments", variant: "destructive", duration: 2000 });
                return
            }
        }

        // Same shape the breakdown endpoint returns, so the calculator and a re-opened modal
        // read this section exactly like a saved one.
        const sectionAdjustments = {
            startingPremium: calculated.sectionPremium,
            finalNetPremium: sectionNetPremium,
            discountsApplied: SECTION_DISCOUNTS
                .filter((f) => cleanAdjustments[f.key] > 0)
                .map((f) => ({ name: f.apiName, type: "DISCOUNT", rate: cleanAdjustments[f.key], amount: Number(adj?.[f.amountField]) || 0 })),
            loadingsApplied: SECTION_LOADINGS
                .filter((f) => cleanAdjustments[f.key] > 0)
                .map((f) => ({ name: f.apiName, type: "LOADING", rate: cleanAdjustments[f.key], amount: Number(adj?.[f.amountField]) || 0 })),
        }

        const updatedSection: PolicySection = {
            ...formData,
            ...calculated,
            sectionGrossPremium: calculated.sectionPremium,
            sectionNetPremium,
            sectionAdjustments,
            lastCalculated: new Date().toISOString(),
            ...cleanAdjustments,
            ...dynamicValues,
        }

        try {
            if (onCalculateFullRiskArray) {
                const prepared = (updatedSection.riskItems || []).map((mi) => ({
                    ...mi,
                    sectionID: mi.sectionID ?? updatedSection.sectionID,
                }))
                onCalculateFullRiskArray(updatedSection.sectionID, prepared)
            }
        } catch (cbErr) {
            console.warn("onCalculateFullRiskArray callback failed:", cbErr)
        }

        // The modal is reset from `section` the next time it opens.
        setIsSaving(true)
        try {
            await onSave(updatedSection)
        } finally {
            setIsSaving(false)
        }
    }

    const formatCurrency = (amount: number): string => formatMoney(amount, currency)

    const renderDynamicInput = (field: any) => {
        const value = dynamicValues[field.dbSectionField] || ""
        const handleChange = (val: any) => {
            setDynamicValues((prev) => ({ ...prev, [field.dbSectionField]: val }))
        }

        switch (field.fieldType?.toUpperCase()) {
            case "DATE":
                return (
                    <Input
                        type="date"
                        value={value ? new Date(value).toISOString().split("T")[0] : ""}
                        onChange={(e) => handleChange(e.target.value)}
                        disabled={isReadOnly}
                    />
                )
            case "INT":
            case "DECIMAL":
            case "NUMBER":
                return (
                    <Input
                        type="number"
                        step={field.fieldType === "DECIMAL" ? "0.01" : "1"}
                        value={value}
                        onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
                        disabled={isReadOnly}
                    />
                )
            case "ENUM":
            case "SELECT":
                let options: { value: string; label: string }[] = []
                if (field.minValue) {
                    const values = field.minValue.split(",").map((s: string) => s.trim())
                    const labels = field.maxValue ? field.maxValue.split(",").map((s: string) => s.trim()) : values
                    options = values.map((v: string, i: number) => ({ value: v, label: labels[i] || v }))
                }
                return (
                    <select
                        className="form-select"
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        disabled={isReadOnly}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                    >
                        <option value="">Select {field.fieldCode || field.dbSectionField}</option>
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                )
            case "TEXTAREA":
                return (
                    <textarea
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={field.description || `Enter ${field.fieldCode}`}
                        disabled={isReadOnly}
                        rows={3}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                    />
                )
            case "COMPUTE":
            case "INTERPOLATE":
            case "AUTO":
                return (
                    <Input
                        value={field.defValue || value}
                        readOnly
                        disabled
                        className="bg-gray-100 text-gray-500"
                        placeholder={field.defValue || "Auto-calculated"}
                    />
                )
            case "STRING":
            default:
                return (
                    <Input
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={field.description || `Enter ${field.fieldCode || field.dbSectionField}`}
                        disabled={isReadOnly}
                    />
                )
        }
    }

    const getSmiLabel = (smiCode: string) => {
        const sm = localSMIs.find((s) => s.smiCode === smiCode)
        return sm ? (sm as any).smiDetails || sm.smiCode : smiCode || "—"
    }

    return (
        <Dialog open={isOpen} onOpenChange={() => { if (!isSaving) onClose() }} maxWidth="900px">
            <DialogContent className="add-section-modal policy-section-modal">
                <DialogHeader>
                    <DialogTitle>{section ? "Edit Section" : "Add New Section"}</DialogTitle>
                </DialogHeader>

                <div className="modal-content policy-section-body">
                    <div className="form-section">
                        <h4>Section Information</h4>
                        <div className="form-grid">
                            {isPackageRisk && (
                                <>
                                    <div className="form-field">
                                        <Label htmlFor="riskClass">Business Category</Label>
                                        <Select
                                            options={risks.map(r => ({ value: r.riskID, label: r.riskName }))}
                                            value={riskClass ? { value: riskClass, label: risks.find(r => r.riskID === riskClass)?.riskName } : null}
                                            onChange={opt => {
                                                setRiskClass(opt?.value ?? "")
                                                setSubRiskClass("") // Reset subclass when business category changes
                                                setSelectedSectionCode("")
                                                setFormData(prev => ({ ...prev, sectionName: "", sectionID: "" }))
                                            }}
                                            placeholder="Business Category"
                                            isDisabled={itemsInTable.size > 0 || !!formData?.riskItems?.[0]?.smiCode || isReadOnly}
                                            isClearable
                                        />
                                    </div>

                                    <div className="form-field">
                                        <Label htmlFor="subriskID">Subclass / Product *</Label>
                                        <Select
                                            options={productOptions}
                                            value={productOptions.find(p => p.value === subRiskClass) || null}
                                            onChange={opt => {
                                                setSubRiskClass(opt?.value ?? "")
                                                setSelectedSectionCode("")
                                                setFormData(prev => ({ ...prev, sectionName: "", sectionID: "" }))
                                            }}
                                            placeholder="Select Subclass"
                                            isDisabled={!riskClass || itemsInTable.size > 0 || !!formData?.riskItems?.[0]?.smiCode || isReadOnly}
                                            isClearable
                                        />
                                    </div>
                                </>
                            )}
                            <div className="form-field">
                                <Label htmlFor="sectionName">Section Name *</Label>
                                <select
                                    id="sectionName"
                                    value={selectedSectionCode}
                                    onChange={(e) => handleSectionNameChange(e.target.value)}
                                    className="form-select"
                                    disabled={itemsInTable.size > 0 || isReadOnly || isLoadingSections || !getEffectiveRiskId()}
                                >
                                    <option value="">
                                        {!getEffectiveRiskId()
                                            ? (isPackageRisk ? "Select a business category " : "No product ID available")
                                            : isLoadingSections
                                                ? "Loading sections..."
                                                : localSections.length === 0
                                                    ? "No sections available"
                                                    : "Select Section"}
                                    </option>
                                    {localSections.map((s) => (
                                        <option key={s.sectionCode} value={s.sectionCode}>
                                            {s.sectionName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                                    placeholder="Enter location"
                                    disabled={itemsInTable.size > 0 || !!formData?.riskItems?.[0]?.smiCode || isReadOnly}
                                />
                            </div>
                        </div>

                        {(() => {
                            const validFields = subRiskFields.filter(f => f.dbSectionField && f.dbSectionField !== "-" && f.dbSectionField.trim() !== "");
                            if (validFields.length === 0) return null;
                            const visibleFields = showAllFields ? validFields : validFields.slice(0, 3);
                            return (
                                <div style={{ marginTop: 16, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                                    <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#1e293b' }}>
                                        ADDITIONAL DETAILS
                                    </h4>
                                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                                        {visibleFields.map((field, index) => (
                                            <div key={`${field.codeID || field.dbSectionField}-${index}`} className="form-field">
                                                <Label style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', display: 'block' }}>
                                                    {field.fieldCode || field.dbSectionField}
                                                </Label>
                                                {renderDynamicInput(field)}
                                            </div>
                                        ))}
                                    </div>
                                    {validFields.length > 3 && (
                                        <div className="flex justify-center mt-4" style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                                            <Button variant="outline" size="sm" onClick={() => setShowAllFields(!showAllFields)} type="button">
                                                {showAllFields ? "Show Less" : `Show ${validFields.length - 3} More Fields`}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>

                    {itemsInTable.size > 0 && (
                        <div className="Sc-items-table-section" style={{ marginBottom: 24 }}>
                            <h4 style={{ marginBottom: 12 }}>Items in Table ({itemsInTable.size})</h4>
                            <div className="Sc-staged-table-wrapper">
                                <table className="Sc-staged-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>SMI</th>
                                            <th>Actual Value</th>
                                            <th>Premium</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(formData.riskItems || [])
                                            .map((item: any, index: number) => ({ item, index }))
                                            .filter(({ index }) => itemsInTable.has(index))
                                            .map(({ item, index }) => (
                                                <tr key={`${item.sectionID}-${index}`}>
                                                    <td>{index + 1}</td>
                                                    <td>{getSmiLabel(item.smiCode)}</td>
                                                    <td>{formatCurrency(item.actualValue || 0)}</td>
                                                    <td>{formatCurrency(item.actualPremium ?? 0)}</td>
                                                    <td>
                                                        <div style={{ display: "flex", gap: 8 }}>
                                                            <Button size="sm" variant="outline"
                                                                onClick={() => {
                                                                    setItemsInTable(prev => {
                                                                        const next = new Set(prev);
                                                                        next.delete(index);
                                                                        if (editingIndex !== null && editingIndex !== index) next.add(editingIndex);
                                                                        return next;
                                                                    });
                                                                    handleEditFromTable(index);
                                                                    setEditingIndex(index);
                                                                }}>
                                                                Edit/View
                                                            </Button>
                                                            {!isReadOnly && (
                                                                <Button size="sm" variant="ghost" onClick={() => handleRemoveItem(index)}>
                                                                    Remove
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="form-section">
                        <div style={{ fontWeight: 700, marginBottom: 12 }}>Risk Items ({formData.riskItems?.length})</div>

                        <div className="items-list">
                            <div className="proportion-row">
                                <Label htmlFor="proportionRateSmall">Proportion Rate (%)</Label>
                                <Input
                                    className="proportions-input"
                                    id="proportionRateSmall"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={(formData as any).proportionRate ?? 0}
                                    onChange={(e) => setFormData((p) => ({ ...p, proportionRate: e.target.value === "" ? 0 : Number(e.target.value) }))}
                                    style={{ width: 120 }}
                                    disabled
                                />
                            </div>

                            {(formData.riskItems || [])
                                .map((item: any, index: number) => ({ item, index }))
                                .filter(({ index }) => !itemsInTable.has(index))
                                .map(({ item, index }) => (
                                    <article key={`${item.sectionID}-${index}`} className={`item-card ${item._collapsed ? "collapsed" : ""}`}>
                                        <div className="card-top-controls" onClick={() => toggleCollapse(index)}>
                                            <div className="top-left-meta" />
                                            <div className="top-actions">
                                                <Checkbox checked={item._collapsed} />
                                            </div>
                                        </div>

                                        {item._collapsed ? (
                                            <>
                                                <div className="collapsed-header-rich">
                                                    <div className="collapsed-left-rich">
                                                        <div className="label small">#{index + 1}</div>
                                                        <div className="value small desc">{item.itemDescription || "—"}</div>
                                                        <div className="muted small smi">{getSmiLabel(item.smiCode)}</div>
                                                    </div>
                                                    <div className="collapsed-mid-rich">
                                                        <div className="label small">Actual</div>
                                                        <div className="value small">{formatCurrency(item.actualValue || 0)}</div>
                                                        <div className="label small">Rate</div>
                                                        <div className="value small">{item.itemRate ?? 0}%</div>
                                                    </div>
                                                    <div className="collapsed-right-rich">
                                                        <div className="label small">Net</div>
                                                        <div className="value small">{item.netPremiumAfterDiscounts ? formatCurrency(item.netPremiumAfterDiscounts) : "N/A"}</div>
                                                        <div className="server-mini">{item.actualPremium ? formatCurrency(item.actualPremium) : ""}</div>
                                                    </div>
                                                </div>
                                                <footer className="card-footer">
                                                    <div className="footer-actions centered">
                                                        <Button onClick={() => { handleApplyAndCalculate(index); }} size="sm" className="apply-btn" disabled={!!applyingMap[keyFor(index)]}>
                                                            {applyingMap[keyFor(index)]
                                                                ? <><Loader2 size={14} className="animate-spin mr-1" /> Calculating...</>
                                                                : "Apply"}
                                                        </Button>
                                                        <Button onClick={() => handleRemoveItem(index)} size="sm" variant="outline" className="remove-btn" disabled={isReadOnly}>
                                                            Remove
                                                        </Button>
                                                        <div onClick={() => toggleCollapse(index)}>
                                                            <Checkbox checked={item._collapsed} /> {item._collapsed ? "Expand" : "Collapse"}
                                                        </div>
                                                    </div>
                                                </footer>
                                            </>
                                        ) : (
                                            <>
                                                <div className="card-body">
                                                    <div className="card-row">
                                                        <div className="label">Item No</div>
                                                        <div className="value">{index + 1}</div>
                                                    </div>

                                                    <div className="card-row two-up">
                                                        <div>
                                                            <div className="label">Risk SMI</div>
                                                            <div className="value">
                                                                <select
                                                                    value={item.smiCode}
                                                                    onChange={(e) => handleItemChange(index, "smiCode", e.target.value)}
                                                                    className="input select"
                                                                    disabled={isReadOnly || isLoadingSMIs || !selectedSectionCode}
                                                                >
                                                                    <option value="">
                                                                        {!selectedSectionCode
                                                                            ? "Select a section first"
                                                                            : isLoadingSMIs
                                                                                ? "Loading SMIs..."
                                                                                : localSMIs.length === 0
                                                                                    ? "No SMIs available"
                                                                                    : "Select SMI"}
                                                                    </option>
                                                                    {localSMIs.map((smi, i) => (
                                                                        <option key={smi.smiCode + "" + i} value={smi.smiCode}>
                                                                            {smi.smiDetails || smi.smiCode}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="label">Description</div>
                                                            <div className="value">
                                                                <Input value={item.itemDescription}
                                                                    onChange={(e) => handleItemChange(index, "itemDescription", e.target.value)}
                                                                    placeholder="Description" disabled={isReadOnly} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="card-row two-up">
                                                        <div>
                                                            <div className="label">Actual Value</div>
                                                            <div className="value">
                                                                <Input type="number" min="0" step="0.01" value={item.actualValue}
                                                                    onChange={(e) => handleItemChange(index, "actualValue", e.target.value)}
                                                                    disabled={isReadOnly} />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="label">Rate (%)</div>
                                                            <div className="value">
                                                                <Input type="number" min="0" max="100" step="0.01" value={item.itemRate}
                                                                    onChange={(e) => handleItemChange(index, "itemRate", e.target.value)}
                                                                    disabled={isReadOnly} />
                                                            </div>
                                                            <div className="discounts-area">
                                                                {item.itemRate && item.actualValue
                                                                    ? <div>amount: {formatCurrency((item.itemRate / 100) * item.actualValue)}</div>
                                                                    : null}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="card-row two-up" style={{ marginTop: 8 }}>
                                                        <div>
                                                            <div className="label">Multiplier</div>
                                                            <div className="value">
                                                                <Input type="number" min="0" step="0.01" value={item.multiplyRate}
                                                                    onChange={(e) => handleItemChange(index, "multiplyRate", e.target.value)}
                                                                    disabled={isReadOnly} />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="label">Location</div>
                                                            <div className="value">
                                                                <Input value={formData.location}
                                                                    onChange={(e) => handleItemChange(index, "location", e.target.value)}
                                                                    placeholder="Location" disabled />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="card-row" style={{ marginTop: 8 }}>
                                                        <div className="label">Stock</div>
                                                        <div className="value">
                                                            <label className="stock-toggle">
                                                                <input type="checkbox" checked={!!item._showStock}
                                                                    onChange={() => toggleStockUI(index)} disabled={isReadOnly} />
                                                                <span style={{ marginLeft: 8 }}>Add stock</span>
                                                            </label>
                                                        </div>
                                                    </div>

                                                    {item._showStock && (
                                                        <div className="stock-block">
                                                            <div className="stock-row">
                                                                <div className="label">Stock Code</div>
                                                                <div className="value">
                                                                    <Input value={item.stockItem?.stockCode || ""}
                                                                        onChange={(e) => handleStockChange(index, "stockCode", e.target.value)}
                                                                        placeholder="Stock code" disabled={isReadOnly} />
                                                                </div>
                                                            </div>
                                                            <div className="stock-row">
                                                                <div className="label">Stock Description</div>
                                                                <div className="value">
                                                                    <Input value={item.stockItem?.stockDescription || ""}
                                                                        onChange={(e) => handleStockChange(index, "stockDescription", e.target.value)}
                                                                        placeholder="Stock description" disabled={isReadOnly} />
                                                                </div>
                                                            </div>
                                                            <div className="stock-row two-up">
                                                                <div>
                                                                    <div className="label">Stock Sum Insured</div>
                                                                    <div className="value">
                                                                        <Input type="number" value={item.stockItem?.stockSumInsured ?? 0}
                                                                            onChange={(e) => handleStockChange(index, "stockSumInsured", e.target.value)}
                                                                            disabled={isReadOnly} />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="label">Stock Rate (%)</div>
                                                                    <div className="value">
                                                                        <Input type="number" value={item.itemRate}
                                                                            onChange={(e) => handleStockChange(index, "stockRate", e.target.value)}
                                                                            disabled />
                                                                    </div>
                                                                    <div className="discounts-area">
                                                                        {item.itemRate && item.stockItem.stockSumInsured
                                                                            ? <div>amount: {formatCurrency((item.itemRate / 100) * item.stockItem.stockSumInsured)}</div>
                                                                            : null}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="stock-row">
                                                                <div className="label">Stock Discount Rate (%)</div>
                                                                <div className="value">
                                                                    <Input type="number" value={item.stockItem?.stockDiscountRate ?? 0}
                                                                        onChange={(e) => handleStockChange(index, "stockDiscountRate", e.target.value)}
                                                                        disabled={isReadOnly} />
                                                                </div>
                                                                <div className="discounts-area">
                                                                    {item.stockItem?.stockDiscountRate && item.stockItem.stockSumInsured
                                                                        ? <div>amount: {formatCurrency((item.stockItem?.stockDiscountRate / 100) * item.stockItem.stockSumInsured)}</div>
                                                                        : null}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="card-row" style={{ marginTop: 8 }}>
                                                        <div className="label">FEA Discount Rate (%)</div>
                                                        <div className="value">
                                                            <Input type="number" min="0" step="0.01" value={item.feaDiscountRate ?? 0}
                                                                onChange={(e) => handleItemChange(index, "feaDiscountRate", e.target.value)}
                                                                disabled={isReadOnly} />
                                                        </div>
                                                    </div>

                                                    <div className="discounts-area">
                                                        {item.stockDiscountAmount ? <div>Stock: {formatCurrency(item.stockDiscountAmount)}</div> : null}
                                                        {item.feaDiscountAmount ? <div>FEA: {formatCurrency(item.feaDiscountAmount)}</div> : null}
                                                    </div>

                                                    {/* Item-level named discounts/loadings, applied to this item's premium (incl. stock) */}
                                                    <div className="item-adjustments">
                                                        <div className="item-adjustments-head">
                                                            <div className="label">Item Discounts &amp; Loadings</div>
                                                            <small className="muted">Loadings first, then discounts. "Premium" compounds on the running premium; "Sum Insured" is a rate on the item's sum insured.</small>
                                                        </div>
                                                        {(["loadings", "discounts"] as const).map((kind) => (
                                                            <div key={kind} className="item-adjustments-group">
                                                                <div className="item-adjustments-title">{kind === "loadings" ? "Loadings" : "Discounts"}</div>
                                                                {(item[kind] || []).length === 0 && (
                                                                    <div className="muted small">None</div>
                                                                )}
                                                                {(item[kind] || []).map((adj: ItemAdjustment, row: number) => {
                                                                    const amount = appliedAmount(item, kind, adj.adjustmentName)
                                                                    return (
                                                                        <div key={row} className="item-adjustment-row">
                                                                            <Input
                                                                                list={`adj-${kind}`}
                                                                                placeholder={kind === "loadings" ? "e.g. Special Perils" : "e.g. Special Discount"}
                                                                                value={adj.adjustmentName}
                                                                                onChange={(e) => changeItemAdjustment(index, kind, row, "adjustmentName", e.target.value)}
                                                                                disabled={isReadOnly}
                                                                            />
                                                                            <Input
                                                                                type="number" min="0" step="0.01" placeholder="Rate %"
                                                                                value={adj.rate}
                                                                                onChange={(e) => changeItemAdjustment(index, kind, row, "rate", e.target.value)}
                                                                                disabled={isReadOnly}
                                                                            />
                                                                            <select
                                                                                className="input select"
                                                                                value={adj.appliedOn}
                                                                                onChange={(e) => changeItemAdjustment(index, kind, row, "appliedOn", e.target.value)}
                                                                                disabled={isReadOnly}
                                                                            >
                                                                                <option value={BASIS_PREMIUM}>on Premium</option>
                                                                                <option value={BASIS_SUM_INSURED}>on Sum Insured</option>
                                                                            </select>
                                                                            <span className="item-adjustment-amount">
                                                                                {amount != null ? `${kind === "loadings" ? "+" : "−"}${formatCurrency(amount)}` : ""}
                                                                            </span>
                                                                            {!isReadOnly && (
                                                                                <button type="button" className="icon-btn" title="Remove"
                                                                                    onClick={() => removeItemAdjustment(index, kind, row)}>
                                                                                    <Trash2 size={16} />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    )
                                                                })}
                                                                {!isReadOnly && (
                                                                    <Button type="button" size="sm" variant="outline" onClick={() => addItemAdjustment(index, kind)}>
                                                                        <Plus size={14} className="mr-1" /> Add {kind === "loadings" ? "loading" : "discount"}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <datalist id="adj-loadings">
                                                            {ITEM_LOADING_SUGGESTIONS.map((n) => <option key={n} value={n} />)}
                                                        </datalist>
                                                        <datalist id="adj-discounts">
                                                            {ITEM_DISCOUNT_SUGGESTIONS.map((n) => <option key={n} value={n} />)}
                                                        </datalist>
                                                    </div>

                                                    <div className="server-summary">
                                                        <div className="server-title">Actual Premium</div>
                                                        <div className="server-amount">{item.actualPremium ? formatCurrency(item.actualPremium) : "N/A"}</div>
                                                        <div style={{ marginTop: 8, display: "flex", gap: 10, flexDirection: "column" }}>
                                                            <div className="value" style={{ fontWeight: 700 }}>
                                                                total Sum Insured: {formatCurrency(item?.totalSumInsured || (item?.actualValue + item?.stockItem?.stockSumInsured) || 0)}
                                                            </div>
                                                            <div className="value" style={{ fontWeight: 700 }}>
                                                                Shared Premium: {formatCurrency(item.premiumValue ?? 0)}
                                                            </div>
                                                            <div style={{ display: "flex", gap: 12, marginTop: 6, flexWrap: "wrap" }}>
                                                                <div className="muted">Stock Discount: {formatCurrency(Number(item.stockDiscountAmount) || 0)}</div>
                                                                <div className="muted">FEA Discount: {formatCurrency(Number(item.feaDiscountAmount) || 0)}</div>
                                                                {Number(item.totalItemLoadingAmount) > 0 && (
                                                                    <div className="muted">Item Loadings: +{formatCurrency(Number(item.totalItemLoadingAmount))}</div>
                                                                )}
                                                                {Number(item.totalItemDiscountAmount) > 0 && (
                                                                    <div className="muted">Item Discounts: −{formatCurrency(Number(item.totalItemDiscountAmount))}</div>
                                                                )}
                                                            </div>
                                                            <div className="server-net">Net: {item.netPremiumAfterDiscounts ? formatCurrency(item.netPremiumAfterDiscounts) : formatCurrency(0)}</div>
                                                            {Number(item.netPremiumAfterDiscounts) < 0 && (
                                                                <div style={{ color: "#dc2626", fontSize: 13 }}>
                                                                    Discounts exceed the premium. A discount "on Sum Insured" takes that % of the whole sum insured.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <footer className="card-footer">
                                                    <div className="footer-actions centered">
                                                        <Button onClick={() => handleApplyAndCalculate(index)} size="sm" className="apply-btn"
                                                            disabled={!!applyingMap[keyFor(index)] || isReadOnly}>
                                                            {applyingMap[keyFor(index)]
                                                                ? <><Loader2 size={14} className="animate-spin mr-1" /> Calculating...</>
                                                                : "Apply"}
                                                        </Button>
                                                        <Button onClick={() => handleRemoveItem(index)} size="sm" variant="outline" className="remove-btn">
                                                            Remove
                                                        </Button>
                                                        <div onClick={() => toggleCollapse(index)}>
                                                            <Checkbox checked={item._collapsed} /> {item._collapsed ? "Expand" : "Collapse"}
                                                        </div>
                                                    </div>
                                                </footer>
                                            </>
                                        )}
                                    </article>
                                ))}
                        </div>

                        <div className="items-actions">
                            {!isReadOnly && (
                                <Button onClick={() => { handleAddItem(); }} size="sm" variant="outline" disabled={!!applyingMap["ALL"]}>
                                    <Plus size={14} className="mr-1" /> Add Item
                                </Button>
                            )}
                            <Button onClick={() => handleCalculateAllItems()} size="sm"
                                disabled={!!applyingMap["ALL"] || !(formData.riskItems || []).length}>
                                {applyingMap["ALL"]
                                    ? <><Loader2 size={14} className="animate-spin mr-1" /> Calculating...</>
                                    : "Calculate All Items"}
                            </Button>
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="qc-adjustments-panel">
                            <h3 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span>
                                    Section Discounts &amp; Loadings
                                    {hasSectionAdjustments(getCleanAdjustments()) && (
                                        <span className="badge success" style={{ marginLeft: 8, fontSize: 12 }}>Applied</span>
                                    )}
                                    {isPreviewingAdjustments && (
                                        <span className="updating-note"><Loader2 size={14} className="animate-spin" /> Recalculating…</span>
                                    )}
                                </span>
                                <div onClick={() => setAdjCollapse(!adjCollapse)} style={{ cursor: "pointer", fontSize: 14 }}>
                                    <Checkbox checked={!adjCollapse} /> {adjCollapse ? "Show" : "Hide"}
                                </div>
                            </h3>
                            {!adjCollapse && (
                                <>
                                    <p className="muted" style={{ fontSize: 13, margin: "4px 0 12px" }}>
                                        Loadings are applied first, then discounts, each on the running premium.
                                    </p>
                                    <div className="qc-adjustments-grid">
                                        {[{ title: "Discounts", fields: SECTION_DISCOUNTS }, { title: "Loadings", fields: SECTION_LOADINGS }].map((group) => (
                                            <div className="qc-adjustment-section" key={group.title}>
                                                <h4>{group.title}</h4>
                                                {group.fields.map((f) => (
                                                    <div className="qc-adjustment-field" key={f.key}>
                                                        <Label htmlFor={f.key}>{f.label} (%)</Label>
                                                        <Input id={f.key} type="number" min="0" max="100" step="0.01"
                                                            value={adjustments[f.key] ?? ""}
                                                            onChange={(e) => setAdjustmentRate(f.key, e.target.value)}
                                                            disabled={isReadOnly} />
                                                        {Number(sectionAdjustmentsResult?.[f.amountField]) > 0 && (
                                                            <small className="muted">
                                                                {group.title === "Discounts" ? "−" : "+"}{formatCurrency(Number(sectionAdjustmentsResult[f.amountField]))}
                                                            </small>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                    {!(Number(sectionAgregate?.aggregatePremium) > 0) && (
                                        <small className="muted">Calculate the risk items to see the effect of these rates.</small>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div className={`summary-section ${isPreviewingAdjustments || applyingMap["ALL"] ? "is-updating" : ""}`}>
                        <div className="summary-item">
                            <Label>Section Sum Insured</Label>
                            <div className="summary-value">{formatCurrency(formData.sectionSumInsured || 0)}</div>
                        </div>
                        <div className="summary-item">
                            <Label>Premium (after item adjustments)</Label>
                            <div className="summary-value">{formatCurrency(formData.sectionPremium || 0)}</div>
                        </div>
                        <div className="summary-item">
                            <Label>Section Loadings</Label>
                            <div className="summary-value">
                                +{formatCurrency(SECTION_LOADINGS.reduce((a, f) => a + (Number(sectionAdjustmentsResult?.[f.amountField]) || 0), 0))}
                            </div>
                        </div>
                        <div className="summary-item">
                            <Label>Section Discounts</Label>
                            <div className="summary-value">
                                −{formatCurrency(SECTION_DISCOUNTS.reduce((a, f) => a + (Number(sectionAdjustmentsResult?.[f.amountField]) || 0), 0))}
                            </div>
                        </div>
                        <div className="summary-item">
                            <Label>Section Net Premium</Label>
                            <div className="summary-value" style={{ fontWeight: 700 }}>
                                {formatCurrency(Number(sectionAdjustmentsResult?.netPremiumDue ?? formData.sectionNetPremium) || 0)}
                            </div>
                        </div>
                        {formData.lastCalculated && (
                            <div className="summary-item">
                                <Label>Last Calculated</Label>
                                <div className="summary-value">{new Date((formData as any).lastCalculated).toLocaleString()}</div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Always visible: running net premium and the actions */}
                <div className="section-modal-footer">
                    <div className="footer-net">
                        <span className="footer-net-label">Section Net Premium</span>
                        <span className="footer-net-value">
                            {isPreviewingAdjustments || applyingMap["ALL"]
                                ? <><Loader2 size={16} className="animate-spin" /> Calculating…</>
                                : formatCurrency(Number(sectionAdjustmentsResult?.netPremiumDue ?? formData.sectionNetPremium) || 0)}
                        </span>
                    </div>
                    <div className="footer-buttons">
                        <Button onClick={onClose} variant="outline" disabled={isSaving}>Cancel</Button>
                        {!isReadOnly && (
                            <Button onClick={handleSave} disabled={isSaving || !!applyingMap["ALL"]}>
                                {isSaving
                                    ? <><Loader2 size={16} className="animate-spin mr-2" /> Saving...</>
                                    : "Save & Update"}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}