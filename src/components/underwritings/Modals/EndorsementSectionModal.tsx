//@ts-nocheck
//@ts-nocheck
// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "../../../features/store"
import type { RootState } from "../../../features/store"
import { getSubRiskSectionsBySubRisk, getSubRiskSectionsByRiskId, getSubRiskSectionsBySectionCode } from "../../../features/reducers/productReducers/subRiskSectionSlice"
import { getSubRiskSMIsBySectionCode } from "../../../features/reducers/productReducers/subRiskSMISlice"
import { getAllRisks } from "../../../features/reducers/adminReducers/riskSlice"
import { getAllProducts } from "../../../features/reducers/productReducers/productSlice"
import Select from "react-select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Button } from "../../ui/new-button"
import Input from "../../ui/Input"
import { Label } from "../../ui/label"
import type { PolicySection, PolicyRiskItemUI, PolicyAdjustmentCalculations } from "../../../types/underwriting"
// Use the SHARED CSS
import "../../Modals/AddSectionModal.css"

import {
    calculatePolicyRiskItems,
    calculatePolicySectionAggregate,
    calculatePolicySectionAdjustment,
} from "../../../features/reducers/underwriteReducers/underwritingSlice"
import { toast } from "../../ui/use-toast"
import { Checkbox } from "../../ui/checkbox"

interface EndorsementSectionModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (section: PolicySection, deletedRiskIndices?: number[]) => void
    section?: PolicySection | any
    productId: string
    proportionRate?: number
    onCalculateFullRiskArray?: (sectionID: string, fullRiskArray: any[]) => void
    subRiskFields?: any[]
    isReadOnly?: boolean;
    endorsementType: string;
    initialSoftDeletedIndices?: number[];
}

export const EndorsementSectionModal = ({
    isOpen,
    onClose,
    onSave,
    section,
    productId,
    proportionRate = 100,
    onCalculateFullRiskArray,
    subRiskFields = [],
    isReadOnly: propIsReadOnly = false,
    endorsementType,
    initialSoftDeletedIndices = [],
}: EndorsementSectionModalProps) => {
    // Logic Hooks
    const isAddition = endorsementType === 'Addition';
    const isCancellation = endorsementType === 'Cancellation';
    const isDeletion = endorsementType === 'Deletion';
    const isReturn = endorsementType === 'Return';
    const isExtension = endorsementType === 'Extension';
    const isReduction = endorsementType === 'Reduction';
    const isReversal = endorsementType === 'Reversal';
    const isExistingSection = !!section?.sectionID;

    // Strict UI/Logic Separation
    // Addition:
    //   - If New (no sectionID): FULL EDIT.
    //   - If Existing (sectionID): READ ONLY.
    // Cancellation/Deletion/Return:
    //   - Always Read Only Fields.
    //   - Items can be DELETED.
    // Reversal:
    //   - FULL READ ONLY (No edits, no deletions).

    const isReadOnly = (isAddition && isExistingSection) || (isCancellation || isDeletion || isReturn || isExtension || isReduction || isReversal) || propIsReadOnly;
    const canDeleteItems = !isReadOnly || (isCancellation || isDeletion || isReturn);

    const dispatch = useDispatch<AppDispatch>()
    const { adjustmentOptions } = useSelector((state: RootState) => state.underwritings)
    const [sectionAgregate, setSectionAggregate] = useState<any>(null)
    const [adjCollapse, setAdjCollapse] = useState<boolean>(true)
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const { risks } = useSelector((state: RootState) => state.risks)
    const { products } = useSelector((state: RootState) => state.products)
    const [riskClass, setRiskClass] = useState("")
    const [subRiskClass, setSubRiskClass] = useState("")
    const [showAllFields, setShowAllFields] = useState(false)

    const [localSections, setLocalSections] = useState<any[]>([])
    const [localSMIs, setLocalSMIs] = useState<any[]>([])
    const [isLoadingSections, setIsLoadingSections] = useState(false)
    const [isLoadingSMIs, setIsLoadingSMIs] = useState(false)

    // When productId is "Package", fall back to the user-selected Business Category (riskClass)
    // as the actual risk id used to fetch sections/SMIs and to calculate items.
    const effectiveRiskId = productId === "Package" ? riskClass : productId

    const filteredProducts = products.filter(p => p.riskID === riskClass)
    const productOptions = filteredProducts.map(p => ({ value: p.productID, label: p.productName }))
    const sectionAdjustments = section?.sectionAdjustments
    const sectionAdjustmentsDiscounts = section?.sectionAdjustments?.discountsApplied
    const sectionAdjustmentsLoadings = section?.sectionAdjustments?.loadingsApplied

    // Dynamic Fields State
    // Initialize with section values if editing, or default values if new
    const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({})

    const [sectionAdjustmentsResult, setSectionAdjustmentsResult] = useState<PolicyAdjustmentCalculations>({
        startingPremium: sectionAdjustments?.startingPremium || 0,
        specialDiscountAmount: sectionAdjustmentsDiscounts?.find((d: any) => d.name == "Special Discount")?.amount || 0,
        specialDiscountNetAmount: sectionAdjustmentsDiscounts?.find((d: any) => d.name == "Special Discount")?.premiumAfterAdjustment || 0,
        deductibleDiscountAmount: sectionAdjustmentsDiscounts?.find((d: any) => d.name == "Deductible Discount")?.amount || 0,
        deductibleDiscountNetAmount: sectionAdjustmentsDiscounts?.find((d: any) => d.name == "Deductible Discount")?.premiumAfterAdjustment || 0,
        spreadDiscountAmount: sectionAdjustmentsDiscounts?.find((d: any) => d.name == "Spread Discount")?.amount || 0,
        spreadDiscountNetAmount: sectionAdjustmentsDiscounts?.find((d: any) => d.name == "Spread Discount")?.premiumAfterAdjustment || 0,
        ltaDiscountAmount: sectionAdjustmentsDiscounts?.find((d: any) => d.name == "LTA Discount")?.amount || 0,
        ltaDiscountNetAmount: sectionAdjustmentsDiscounts?.find((d: any) => d.name == "LTA Discount")?.premiumAfterAdjustment || 0,
        theftLoadingAmount: sectionAdjustmentsLoadings?.find((d: any) => d.name == "Theft Loading")?.amount || 0,
        theftLoadingNetAmount: sectionAdjustmentsLoadings?.find((d: any) => d.name == "Theft Loading")?.premiumAfterAdjustment || 0,
        srccLoadingAmount: sectionAdjustmentsLoadings?.find((d: any) => d.name == "SRCC Loading")?.amount || 0,
        srccLoadingNetAmount: sectionAdjustmentsLoadings?.find((d: any) => d.name == "SRCC Loading")?.premiumAfterAdjustment || 0,
        otherLoading2Amount: sectionAdjustmentsLoadings?.find((d: any) => d.name == "Other Loading 2")?.amount || 0,
        otherLoading2NetAmount: sectionAdjustmentsLoadings?.find((d: any) => d.name == "Other Loading 2")?.premiumAfterAdjustment || 0,
        netPremiumDue: section?.sectionAdjustments?.finalNetPremium || 0,
        success: false,
        message: "",
    })

    // Helper to map API names to internal keys
    const getAdjustmentKey = (name: string, type: 'discount' | 'loading') => {
        const n = name.toUpperCase();
        // Strict mapping based on user provided keys
        if (n.includes("SPECIAL")) return "specialDiscountRate";
        if (n.includes("DEDUCTIBLE")) return "deductibleDiscountRate";
        if (n.includes("SPREAD")) return "spreadDiscountRate";
        if (n.includes("LTA")) return "ltaDiscountRate";
        if (n.includes("THEFT") || n.includes("TPFT")) return "theftLoadingRate";
        if (n.includes("SRCC")) return "srccLoadingRate";
        if (n.includes("OTHER DISCOUNT")) return "otherDiscountsRate";
        if (n.includes("OTHER LOADING 2")) return "otherLoading2Rate";

        // For others (Fleet, Loyalty, etc), user said "connected to nothing" for now
        // We generate a key but the backend won't use it yet.
        return name.toLowerCase().replace(/[^a-z0-9]/g, "") + (type === 'discount' ? "Rate" : "Rate");
    }

    // Dynamic State Logic
    const initialAdjustments: any = {
        otherDiscountsRate: sectionAdjustmentsDiscounts?.find((d: any) => d.name == "Other Discount")?.rate || section?.otherDiscountsRate || 0,
        otherLoading2Rate: sectionAdjustmentsLoadings?.find((d: any) => d.name == "Other Loading 2")?.rate || section?.otherLoading2Rate || 0,
    };

    // Populate dynamic keys from standard options
    const discountsList = adjustmentOptions?.standardDiscounts || ["Special Discount", "Deductible Discount", "Spread Discount", "LTA Discount"]; // Fallback if API fails
    const loadingsList = adjustmentOptions?.standardLoadings || ["Theft Loading", "SRCC Loading"];

    discountsList.forEach((name: string) => {
        const key = getAdjustmentKey(name, 'discount');
        initialAdjustments[key] = sectionAdjustmentsDiscounts?.find((d: any) =>
            d.name?.toLowerCase().includes(name.toLowerCase().split('(')[0].trim()) // loose match
        )?.rate || (section as any)?.[key] || 0;
    });

    loadingsList.forEach((name: string) => {
        const key = getAdjustmentKey(name, 'loading');
        initialAdjustments[key] = sectionAdjustmentsLoadings?.find((d: any) =>
            d.name?.toLowerCase().includes(name.toLowerCase().split('(')[0].trim())
        )?.rate || (section as any)?.[key] || 0;
    });

    const [adjustments, setAdjustments] = useState<any>(initialAdjustments)

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
                _showStock: !!it.stockItem,
                _collapsed: false,
            }))
            : [],
        proportionRate: section?.proportionRate ?? proportionRate,
        // Adding any missing properties for PolicySection compliance if needed
    } as PolicySection)

    const [formData, setFormData] = useState<PolicySection>(initialForm)
    const [selectedSectionCode, setSelectedSectionCode] = useState<string>(section?.sectionID || "")
    const [applyingMap, setApplyingMap] = useState<Record<string, boolean>>({})
    const [itemsInTable, setItemsInTable] = useState<Set<number>>(new Set())
    const [softDeletedRiskItemIndices, setSoftDeletedRiskItemIndices] = useState<number[]>([])

    // Fetch risks (Business Categories) once the modal is relevant for "Package" products
    useEffect(() => {
        if (productId === "Package") {
            dispatch(getAllRisks({ pageNumber: 1, pageSize: 100 }) as any)
        }
    }, [dispatch, productId])

    // Fetch products (Subclasses) whenever the selected Business Category changes
    useEffect(() => {
        if (riskClass) {
            dispatch(getAllProducts({ riskId: riskClass, pageNumber: 1, pageSize: 100 }) as any)
        }
    }, [dispatch, riskClass])

    // Fetch sections using effectiveRiskId:
    // - normal productId when productId !== "Package"
    // - the selected Business Category (riskClass) when productId === "Package"
    useEffect(() => {
        if (effectiveRiskId && isOpen) {
            setLocalSections([])
            setIsLoadingSections(true)

            dispatch(getSubRiskSectionsByRiskId(effectiveRiskId) as any)
                .unwrap()
                .then((data: any[]) => {
                    setLocalSections(Array.isArray(data) ? data : [])
                })
                .catch(() => {
                    setLocalSections([])
                })
                .finally(() => {
                    setIsLoadingSections(false)
                })
        } else {
            setLocalSections([])
        }
    }, [dispatch, effectiveRiskId, isOpen])

    // When editing an existing section, pre-select it after sections load
    useEffect(() => {
        if (localSections.length > 0 && section?.sectionID) {
            setSelectedSectionCode(section.sectionID)
            setFormData(initialForm())
        }
    }, [localSections])

    // Backfill riskClass on edit when productId === "Package" — the backend doesn't
    // return riskClass directly, but the section's subRiskID (via by-section-code) is it.
    // Keyed off section.sectionID (not riskClass emptiness) so switching between edited
    // sections re-resolves riskClass instead of reusing a stale value from the last section.
    const [riskClassResolvedFor, setRiskClassResolvedFor] = useState<string | null>(null)

    useEffect(() => {
        const targetSectionID = section?.sectionID ?? null

        if (productId === "Package" && isOpen && targetSectionID && riskClassResolvedFor !== targetSectionID) {
            dispatch(getSubRiskSectionsBySectionCode(targetSectionID) as any)
                .unwrap()
                .then((data: any[]) => {
                    const match = Array.isArray(data) ? data[0] : data
                    if (match?.subRiskID) {
                        setRiskClass(match.subRiskID)
                    }
                    setRiskClassResolvedFor(targetSectionID)
                })
                .catch(() => {
                    // section may not resolve via this endpoint; leave riskClass as-is,
                    // user falls back to manual selection. Still mark as attempted so
                    // we don't retry-loop on every render.
                    setRiskClassResolvedFor(targetSectionID)
                })
        }
    }, [dispatch, productId, isOpen, section?.sectionID])

    // Subclass-level refinement: when a specific Subclass/Product is picked under
    // "Package", re-fetch sections scoped to that subRiskClass instead of the
    // broader riskClass, and feed the result into the same localSections state.
    useEffect(() => {
        if (productId === "Package" && subRiskClass) {
            setLocalSections([])
            setIsLoadingSections(true)

            dispatch(getSubRiskSectionsBySubRisk(subRiskClass) as any)
                .unwrap()
                .then((data: any[]) => {
                    setLocalSections(Array.isArray(data) ? data : [])
                })
                .catch(() => {
                    setLocalSections([])
                })
                .finally(() => {
                    setIsLoadingSections(false)
                })
        }
    }, [dispatch, productId, subRiskClass])

    // Fetch SMIs using the selected section code and effectiveRiskId as RiskID
    useEffect(() => {
        if (selectedSectionCode && effectiveRiskId) {
            setLocalSMIs([])
            setIsLoadingSMIs(true)
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
                .finally(() => setIsLoadingSMIs(false))
        }
    }, [dispatch, selectedSectionCode, effectiveRiskId])

    useEffect(() => {
        if (isOpen) {
            setFormData(initialForm())
            if (section) {
                setSelectedSectionCode(section.sectionID)
                const existingDynamics: any = {};
                subRiskFields.forEach((field: any) => {
                    const key = field.dbSectionField;
                    const val = section[key] !== undefined ? section[key]
                        : section[key.toLowerCase()] !== undefined ? section[key.toLowerCase()]
                            : section[key.charAt(0).toLowerCase() + key.slice(1)]; // camelCase fallback

                    if (val !== undefined) {
                        existingDynamics[key] = val;
                    }
                });
                setDynamicValues({ ...existingDynamics });
            } else {
                setSelectedSectionCode("")
                // New section: start with empty values (no master defaults)
                setDynamicValues({});
                setRiskClass("")
                setSubRiskClass("")
                setRiskClassResolvedFor(null)
            }
        }
    }, [isOpen, section, subRiskFields])

    useEffect(() => {
        if (formData.riskItems?.length > 0)
            handleCalculateAllItems()
    }, [])

    useEffect(() => {
        if (formData.riskItems?.length > 0) {
            setItemsInTable(() => {
                const allIndexes = new Set(
                    formData.riskItems.map((_, i) => i)
                )
                return allIndexes
            })
        }
    }, [])



    const keyFor = (index: number) => `${formData.sectionID || "sec"}|${index}`

    const handleSectionNameChange = (sectionCode: string) => {
        setSelectedSectionCode(sectionCode)
        const selected = localSections.find((s) => s.sectionCode === sectionCode)
        if (selected)
            setFormData((p) => ({
                ...p,
                sectionName: selected.sectionName,
                sectionID: sectionCode,
            }))
        else setFormData((p) => ({ ...p, sectionName: "", sectionID: sectionCode }))
    }

    const handleAddItem = () => {
        const currentItems = formData.riskItems || [];
        // Calculate max itemNo from existing items to ensure uniqueness/sequence
        const maxItemNo = currentItems.reduce((max, item: any) => Math.max(max, item.itemNo || 0), 0);

        const newItem: any = {
            itemNo: maxItemNo + 1,
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
            _showStock: false,
            _collapsed: false,
        }
        setFormData((prev) => ({
            ...prev,
            riskItems: [...(prev.riskItems || []), newItem],
        }))
        setEditingIndex(formData.riskItems.length);
        console.log(formData.riskItems.length);

        if (formData.riskItems.length > 0) handleAddToTable(formData.riskItems.length - 1);
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

        if (field === "itemRate" && updated[index].stockItem) {
            updated[index].stockItem = {
                ...updated[index].stockItem,
                stockRate: parsed,
            }
        }
        if (field === "location")
            updated[index].location = formData.location;

        setFormData((p) => ({ ...p, riskItems: updated }))
    }

    const handleRemoveItem = (index: number) => {
        if (isReturn) {
            setSoftDeletedRiskItemIndices(prev => {
                if (prev.includes(index)) {
                    return prev.filter(i => i !== index);
                } else {
                    return [...prev, index];
                }
            });
            return;
        }

        const updated = (formData.riskItems as any[])
            .filter((_, i) => i !== index)
        // DO NOT RE-INDEX existing items, as this breaks historical traceability and can cause duplicate IDs if not careful.
        // .map((it, i) => ({ ...it, itemNo: i + 1 }))

        const newItemsInTable = new Set<number>()
        itemsInTable.forEach(oldIndex => {
            if (oldIndex < index) {
                newItemsInTable.add(oldIndex)
            } else if (oldIndex > index) {
                newItemsInTable.add(oldIndex - 1)
            }
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

    const handleSectionAggregate = async (data: any) => {
        const payload = {
            calculatedItems: data.calculatedItems,
        }

        if (payload) {
            try {
                const resp: any = await dispatch(calculatePolicySectionAggregate(payload)).unwrap()
                console.log(resp)
                setSectionAggregate({
                    aggregateSumInsured: resp.aggregateSumInsured,
                    aggregatePremium: resp.aggregatePremium,
                })
            } catch (err: any) {
                toast({
                    description: "Failed to calculate Aggregate",
                    variant: "destructive",
                    duration: 2000,
                });
            }
        }
    }

    const handleApplySectionAdjustments = async () => {
        if (!adjustments) {
            toast({
                description: "Fill in an Adjustment",
                variant: "warning",
                duration: 2000,
            });
            return
        } else if (sectionAgregate?.aggregatePremium == null || sectionAgregate?.aggregatePremium < 0) {
            toast({
                description: "Aggregate premium must be calculated and > 0",
                variant: "warning",
                duration: 2000,
            });
            return
        }

        // Strictly filter payload to prevent unknown keys from crashing API
        const cleanAdjustments = {
            specialDiscountRate: adjustments.specialDiscountRate || 0,
            deductibleDiscountRate: adjustments.deductibleDiscountRate || 0,
            spreadDiscountRate: adjustments.spreadDiscountRate || 0,
            ltaDiscountRate: adjustments.ltaDiscountRate || 0,
            otherDiscountsRate: adjustments.otherDiscountsRate || 0,
            theftLoadingRate: adjustments.theftLoadingRate || 0,
            srccLoadingRate: adjustments.srccLoadingRate || 0,
            otherLoading2Rate: adjustments.otherLoading2Rate || 0,
            otherLoadingsRate: adjustments.otherLoadingsRate || 0
        };

        const payload = {
            aggregatePremium: sectionAgregate.aggregatePremium,
            ...cleanAdjustments,
        }
        console.log("Filtered payload:", payload)

        if (payload) {
            try {
                const resp: PolicyAdjustmentCalculations = await dispatch(calculatePolicySectionAdjustment(payload)).unwrap()
                console.log(resp)
                setSectionAdjustmentsResult(resp)
            } catch (err: any) {
                toast({
                    description: "Failed to apply Adjustments",
                    variant: "destructive",
                    duration: 2000,
                });
            }
        }
    }

    const handleApplyItem = async (index: number) => {
        const item = (formData.riskItems || [])[index]
        if (!item) return

        const mapKey = keyFor(index)
        setApplyingMap((m) => ({ ...m, [mapKey]: true }))

        const payload = {
            subRisk: productId || "",
            riskItems: [
                {
                    sectionID: item.sectionID,
                    smiCode: item.smiCode,
                    itemDescription: item.itemDescription,
                    actualValue: Number(item.actualValue) || 0,
                    itemRate: Number(item.itemRate) || 0,
                    multiplyRate: Number(item.multiplyRate) || 0,
                    location: item.location || "",
                    feaDiscountRate: Number(item.feaDiscountRate) || 0,
                    stockItem: item.stockItem
                        ? {
                            stockCode: item.stockItem.stockCode || "",
                            stockDescription: item.stockItem.stockDescription || "",
                            stockSumInsured: Number(item.stockItem.stockSumInsured) || 0,
                            stockRate: Number(item.itemRate) || 0,
                            stockDiscountRate: Number(item.stockItem.stockDiscountRate) || 0,
                        }
                        : null,
                },
            ],
            proportionRate: (formData as any).proportionRate ?? 0,
        }

        try {
            const resp = await (dispatch(calculatePolicyRiskItems(payload)) as any).unwrap()

            if (resp && Array.isArray(resp.calculatedItems) && resp.calculatedItems?.length > 0) {
                const c = resp.calculatedItems[0]
                setFormData((prev) => {
                    const items = [...(prev.riskItems || [])]

                    let targetIndex = index
                    const serverMatch = items.findIndex((it, i) => {
                        if (i === index) return true
                        return (
                            it.sectionID === (c.sectionID ?? it.sectionID) &&
                            (it.smiCode || "") === (c.smiCode || "") &&
                            String(it.itemDescription || "").trim() === String(c.itemDescription || "").trim() &&
                            Number(it.actualValue || 0) === Number(c.actualValue || it.actualValue || 0)
                        )
                    })
                    if (serverMatch !== -1) targetIndex = serverMatch

                    items[targetIndex] = {
                        ...items[targetIndex],
                        actualValue: c.actualValue ?? items[targetIndex]?.actualValue,
                        itemRate: c.itemRate ?? items[targetIndex]?.itemRate,
                        multiplyRate: c.multiplyRate ?? items[targetIndex]?.multiplyRate,
                        location: c.location ?? items[targetIndex]?.location,
                        itemDescription: c.itemDescription ?? items[targetIndex]?.itemDescription,
                        smiCode: c.smiCode ?? items[targetIndex]?.smiCode,
                        actualPremium: c.actualPremium ?? items[targetIndex]?.actualPremium,
                        actualPremiumFormula: (c as any).actualPremiumFormula ?? items[targetIndex]?.actualPremiumFormula,
                        shareValue: (c as any).shareValue ?? items[targetIndex]?.shareValue,
                        shareValueFormula: (c as any).shareValueFormula ?? items[targetIndex]?.shareValueFormula,
                        premiumValue: (c as any).premiumValue ?? items[targetIndex]?.premiumValue,
                        totalSumInsured: (c as any).totalSumInsured ?? items[targetIndex]?.totalSumInsured,
                        premiumValueFormula: (c as any).premiumValueFormula ?? items[targetIndex]?.premiumValueFormula,
                        stockDiscountAmount: (c as any).stockDiscountAmount ?? items[targetIndex]?.stockDiscountAmount ?? 0,
                        feaDiscountAmount: (c as any).feaDiscountAmount ?? items[targetIndex]?.feaDiscountAmount ?? 0,
                        netPremiumAfterDiscounts:
                            (c as any).netPremiumAfterDiscounts ?? items[targetIndex]?.netPremiumAfterDiscounts ?? 0,
                        stockItem: c.stockItem ?? items[targetIndex]?.stockItem ?? null,
                    }

                    return {
                        ...prev,
                        riskItems: items,
                        lastCalculated: new Date().toISOString(),
                    }
                })
            } else {
                console.warn("calculateRiskItems: empty response", resp)
            }
        } catch (err: any) {
            toast({
                description: "Failed to calculate item",
                variant: "destructive",
                duration: 2000,
            });
        } finally {
            setApplyingMap((m) => {
                const copy = { ...m }
                delete copy[mapKey]
                return copy
            })
        }
    }

    const handleCalculateAllItems = async () => {
        if (isReturn) return;
        if (!formData.riskItems || formData.riskItems?.length === 0) return

        const mapAllKey = "ALL"
        setApplyingMap((m) => ({ ...m, [mapAllKey]: true }))

        const payloadItems = (formData.riskItems || [])
            .filter((_, i) => !isReturn || !softDeletedRiskItemIndices.includes(i));

        const payload = {
            subRisk: productId || "",
            riskItems: payloadItems.map((it: any) => ({
                sectionID: it.sectionID,
                smiCode: it.smiCode,
                itemDescription: it.itemDescription,
                actualValue: Number(it.actualValue) || 0,
                itemRate: Number(it.itemRate) || 0,
                multiplyRate: Number(it.multiplyRate) || 0,
                location: it.location || "",
                feaDiscountRate: Number(it.feaDiscountRate) || 0,
                stockItem: it.stockItem ?? null,
            })),
            proportionRate: (formData as any).proportionRate ?? 0,
        }

        try {
            const resp = await (dispatch(calculatePolicyRiskItems(payload)) as any).unwrap()
            handleSectionAggregate(resp)

            if (resp && Array.isArray(resp.calculatedItems)) {
                const mergedItems = [...(formData.riskItems || [])]

                resp.calculatedItems.forEach((cItem: any) => {
                    const matchIndex = mergedItems.findIndex(
                        (it) =>
                            it.sectionID === (cItem.sectionID ?? it.sectionID) &&
                            (it.smiCode || "") === (cItem.smiCode || "") &&
                            String(it.itemDescription || "").trim() === String(cItem.itemDescription || "").trim() &&
                            Number(it.actualValue || 0) === Number(cItem.actualValue || it.actualValue || 0),
                    )

                    const target = matchIndex !== -1 ? matchIndex : mergedItems.findIndex((_, i) => i === 0)

                    if (target !== -1) {
                        mergedItems[target] = {
                            ...mergedItems[target],
                            actualValue: cItem.actualValue ?? mergedItems[target]?.actualValue,
                            itemRate: cItem.itemRate ?? mergedItems[target]?.itemRate,
                            multiplyRate: cItem.multiplyRate ?? mergedItems[target]?.multiplyRate,
                            location: cItem.location ?? mergedItems[target]?.location,
                            itemDescription: cItem.itemDescription ?? mergedItems[target]?.itemDescription,
                            smiCode: cItem.smiCode ?? mergedItems[target]?.smiCode,
                            actualPremium: cItem.actualPremium ?? mergedItems[target]?.actualPremium,
                            actualPremiumFormula: cItem.actualPremiumFormula ?? mergedItems[target]?.actualPremiumFormula,
                            shareValue: cItem.shareValue ?? mergedItems[target]?.shareValue,
                            shareValueFormula: cItem.shareValueFormula ?? mergedItems[target]?.shareValueFormula,
                            premiumValue: cItem.premiumValue ?? mergedItems[target]?.premiumValue,
                            premiumValueFormula: cItem.premiumValueFormula ?? mergedItems[target]?.premiumValueFormula,
                            stockDiscountAmount: cItem.stockDiscountAmount ?? mergedItems[target]?.stockDiscountAmount,
                            feaDiscountAmount: cItem.feaDiscountAmount ?? mergedItems[target]?.feaDiscountAmount,
                            netPremiumAfterDiscounts: cItem.netPremiumAfterDiscounts ?? mergedItems[target]?.netPremiumAfterDiscounts,
                            stockItem: cItem.stockItem ?? mergedItems[target]?.stockItem ?? null,
                        }
                    }
                })

                const newSectionSum = resp.totalActualValue ?? resp.totalSumInsured ?? formData.sectionSumInsured
                const newSectionPremium = resp.totalActualPremium ?? resp.totalGrossPremium ?? formData.sectionPremium
                const newSectionNet = resp.totalNetPremiumAfterDiscounts ?? formData.sectionNetPremium

                setFormData((prev) => ({
                    ...prev,
                    riskItems: mergedItems,
                    sectionSumInsured: typeof newSectionSum === "number" ? newSectionSum : prev.sectionSumInsured,
                    sectionPremium: typeof newSectionPremium === "number" ? newSectionPremium : prev.sectionPremium,
                    sectionNetPremium: typeof newSectionNet === "number" ? newSectionNet : prev.sectionNetPremium,
                    lastCalculated: new Date().toISOString(),
                }))
            }
        } catch (err: any) {
            toast({
                description: "Failed to calculate all items",
                variant: "destructive",
                duration: 2000,
            });
        } finally {
            setApplyingMap((m) => {
                const c = { ...m }
                delete c["ALL"]
                return c
            })
        }
    }

    const handleApplyAndCalculate = async (index: number) => {
        await handleCalculateAllItems()
        await handleApplyItem(index)
        await handleAddToTable(index);
    }

    useEffect(() => {
        if (isOpen) {
            setSoftDeletedRiskItemIndices(initialSoftDeletedIndices || [])
        }
    }, [isOpen, initialSoftDeletedIndices])

    // ... (rest of handleSave, keep until onSave call)

    const handleSave = () => {
        handleCalculateAllItems()
        setEditingIndex(null);
        if (!formData.sectionName) {
            toast({
                description: "Please select a section name",
                variant: "warning",
                duration: 2000,
            });
            return
        }

        const cleanAdjustments = {
            specialDiscountRate: adjustments.specialDiscountRate || 0,
            deductibleDiscountRate: adjustments.deductibleDiscountRate || 0,
            spreadDiscountRate: adjustments.spreadDiscountRate || 0,
            ltaDiscountRate: adjustments.ltaDiscountRate || 0,
            otherDiscountsRate: adjustments.otherDiscountsRate || 0,
            theftLoadingRate: adjustments.theftLoadingRate || 0,
            srccLoadingRate: adjustments.srccLoadingRate || 0,
            otherLoading2Rate: adjustments.otherLoading2Rate || 0,
            otherLoadingsRate: adjustments.otherLoadingsRate || 0
        };

        // Filter out soft-deleted items for Return endorsement payload construction if needed locally,
        // BUT for persisting state, we keep them in the array but pass the indices.
        // Actually, the requirement was to keep them in array but mark them deleted.
        // The EndorsementCalculator filters them out of payload using the indices.
        // So here we pass the full array + indices.

        const updatedSection: PolicySection = {
            ...formData,
            // riskItems: finalRiskItems, // Keep all items in local state so index matches
            ...cleanAdjustments,
            ...dynamicValues, // Include dynamic field values
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

        onSave(updatedSection, softDeletedRiskItemIndices)

        // Reset form state after save to prevent ghost data
        setFormData(initialForm())
        setAdjustments(initialAdjustments)
        setDynamicValues({})
        setSelectedSectionCode("")
        setItemsInTable(new Set())
        setEditingIndex(null)
    }

    const formatCurrency = (amount: number): string =>
        new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2,
        }).format(amount)

    const renderDynamicInput = (field: any) => {
        const value = dynamicValues[field.dbSectionField] || ""
        const handleChange = (val: any) => {
            setDynamicValues((prev) => ({
                ...prev,
                [field.dbSectionField]: val,
            }))
        }

        switch (field.fieldType) {
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
                return (
                    <Input
                        type="number"
                        step={field.fieldType === "DECIMAL" ? "0.01" : "1"}
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        disabled={isReadOnly}
                    />
                )
            case "ENUM":
                let options: { value: string; label: string }[] = []
                if (field.minValue) {
                    const values = field.minValue.split(",").map((s: string) => s.trim())
                    const labels = field.maxValue ? field.maxValue.split(",").map((s: string) => s.trim()) : values
                    options = values.map((v: string, i: number) => ({ value: v, label: labels[i] || v }))
                }
                return (
                    <select
                        className="form-select" // Use Modal's typical class
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        disabled={isReadOnly}
                    >
                        <option value="">Select {field.fieldCode}</option>
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                )
            case "COMPUTE":
            case "INTERPOLATE":
                return (
                    <Input
                        value={field.defValue || value} // Display default logic or calculated value? stick to default behavior for now
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
                        placeholder={field.description || `Enter ${field.fieldCode}`}
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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="add-section-modal">
                <DialogHeader>
                    <DialogTitle>{section ? "Edit Section" : "Add New Section"}</DialogTitle>
                </DialogHeader>

                <div className="modal-content">
                    <div className="form-section">
                        <h4>Section Information</h4>
                        <div className="form-grid">
                            {productId == "Package" && <>
                                <div className="form-field">
                                    <Label htmlFor="riskClass">Business Category *</Label>
                                    <Select
                                        options={risks.map(r => ({ value: r.riskID, label: r.riskName }))}
                                        value={riskClass ? { value: riskClass, label: risks.find(r => r.riskID === riskClass)?.riskName } : null}
                                        onChange={(opt: any) => setRiskClass(opt?.value ?? "")}
                                        placeholder="Select Business Category"
                                        isDisabled={itemsInTable.size > 0 || !!formData?.riskItems?.[0]?.smiCode || isReadOnly}
                                        isClearable
                                    />
                                </div>

                                <div className="form-field">
                                    <Label htmlFor="subriskID">Subclass / Product *</Label>
                                    <Select
                                        options={productOptions}
                                        value={productOptions.find(p => p.value === subRiskClass) || null}
                                        onChange={(opt: any) => { setSubRiskClass(opt?.value ?? ""); handleSectionNameChange("") }}
                                        placeholder="Select Subclass"
                                        isDisabled={!riskClass || itemsInTable.size > 0 || !!formData?.riskItems?.[0]?.smiCode || isReadOnly}
                                        isClearable
                                    />
                                </div>
                            </>
                            }
                            <div className="form-field">
                                <Label htmlFor="sectionName">Section Name *</Label>
                                <select
                                    id="sectionName"
                                    value={selectedSectionCode}
                                    onChange={(e) => handleSectionNameChange(e.target.value)}
                                    className="form-select"
                                    disabled={isReadOnly || isLoadingSections}
                                >
                                    <option value="">{!formData.sectionName ? "Select Section" : formData.sectionName}</option>
                                    {localSections.map((s, index) => (
                                        <option key={s.sectionCode + "" + index} value={s.sectionCode}>
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

                        {/* Mixed in Dynamic Fields */}
                        {(() => {
                            const validFields = subRiskFields.filter(f => f.dbSectionField && f.dbSectionField !== "-" && f.dbSectionField.trim() !== "");
                            if (validFields.length === 0) return null;

                            const visibleFields = showAllFields ? validFields : validFields.slice(0, 3);

                            return (
                                <div style={{ marginTop: 16, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                                    <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: '#64748b', marginBottom: 12 }}>Additional Details</h4>
                                    <div className="form-grid">
                                        {visibleFields.map((field, index) => (
                                            <div key={`${field.codeID}-${index}`} className="form-field">
                                                <Label>{field.fieldCode}</Label>
                                                {renderDynamicInput(field)}
                                            </div>
                                        ))}
                                    </div>
                                    {validFields.length > 3 && (
                                        <div className="flex justify-center mt-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowAllFields(!showAllFields)}
                                                type="button" // prevent form submit
                                            >
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
                                            .map(({ item, index }) => {
                                                const isSoftDeleted = isReturn && softDeletedRiskItemIndices.includes(index);
                                                const rowStyle = isSoftDeleted ? { opacity: 0.5, textDecoration: 'line-through', backgroundColor: '#f3f4f6' } : { backgroundColor: '#fff' };

                                                return (
                                                    <tr key={`${item.sectionID}-${index}`} style={rowStyle}>
                                                        <td>{index + 1}</td>
                                                        <td>{getSmiLabel(item.smiCode)}</td>
                                                        <td>{formatCurrency(item.actualValue || 0)}</td>
                                                        <td>{formatCurrency(item.actualPremium ?? 0)}</td>
                                                        <td>
                                                            <div style={{ display: "flex", gap: 8 }}>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={isSoftDeleted}
                                                                    onClick={() => {
                                                                        setItemsInTable(prev => {
                                                                            const next = new Set(prev);
                                                                            next.delete(index);
                                                                            if (editingIndex !== null && editingIndex !== index) {
                                                                                next.add(editingIndex);
                                                                            }
                                                                            return next;
                                                                        });
                                                                        handleEditFromTable(index);
                                                                        setEditingIndex(index);
                                                                    }}
                                                                >
                                                                    Edit/View
                                                                </Button>
                                                                {canDeleteItems && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant={isSoftDeleted ? "default" : "ghost"}
                                                                        className={isSoftDeleted ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                                                                        onClick={() => handleRemoveItem(index)}
                                                                    >
                                                                        {isSoftDeleted ? "Undo" : "Remove"}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}


                    <div className="form-section">
                        <div className="section-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <h3 className="section-title" style={{ fontWeight: 700 }}>Risk Items ({formData.riskItems ? formData.riskItems.length : 0})</h3>
                            <div className="actions-right" style={{ display: 'flex', gap: 8 }}>
                                {!['Extension', 'Reduction'].includes(endorsementType) && (
                                    <Button onClick={handleAddItem} size="sm" disabled={isReadOnly}>
                                        Add Item
                                    </Button>
                                )}
                                <Button
                                    onClick={handleCalculateAllItems}
                                    size="sm"
                                    variant="outline"
                                    disabled={!!applyingMap["ALL"] || ['Extension', 'Reduction'].includes(endorsementType)}
                                >
                                    {applyingMap["ALL"] ? "Calculating..." : "Calculate All"}
                                </Button>
                            </div>
                        </div>


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
                                    disabled={isReadOnly}
                                    value={(formData as any).proportionRate ?? 0}
                                    onChange={(e) =>
                                        setFormData((p) => ({
                                            ...p,
                                            proportionRate: e.target.value === "" ? 0 : Number(e.target.value),
                                        }))
                                    }
                                    style={{ width: 120 }}
                                />
                            </div>

                            {(formData.riskItems || [])
                                .map((item: any, index: number) => ({ item, index }))
                                .filter(({ index }) => !itemsInTable.has(index))
                                .map(({ item, index }) => {
                                    const isSoftDeleted = isReturn && softDeletedRiskItemIndices.includes(index);
                                    const cardClass = isSoftDeleted ? "item-card opacity-50 bg-gray-100" : "item-card";
                                    const contentStyle = isSoftDeleted ? { textDecoration: "line-through" } : {};
                                    const isDisabled = isReadOnly || isSoftDeleted;

                                    return (
                                        <article
                                            key={`${item.sectionID}-${index}`}
                                            className={`${cardClass} ${item._collapsed ? "collapsed" : ""}`}
                                            aria-labelledby={`item-${item.itemNo}`}
                                        >
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
                                                            <div className="value small">
                                                                {item.netPremiumAfterDiscounts ? formatCurrency(item.netPremiumAfterDiscounts) : "N/A"}
                                                            </div>
                                                            <div className="server-mini">
                                                                {item.actualPremium ? formatCurrency(item.actualPremium) : ""}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <footer className="card-footer">
                                                        <div className="footer-actions centered">
                                                            <Button
                                                                onClick={() => { handleApplyAndCalculate(index); }}
                                                                size="sm"
                                                                className="apply-btn"
                                                                disabled={!!applyingMap[keyFor(index)]}
                                                            >
                                                                {applyingMap[keyFor(index)] ? "Applying..." : "Apply"}
                                                            </Button>
                                                            {/*                           <Button
                            onClick={() => handleAddToTable(index)}
                            size="sm"
                            variant="secondary"
                            className="stage-btn"
                          </Button>
 */}                          <Button
                                                                onClick={() => handleRemoveItem(index)}
                                                                size="sm"
                                                                variant={isSoftDeleted ? "default" : "outline"}
                                                                className={isSoftDeleted ? "bg-blue-600 text-white hover:bg-blue-700" : "remove-btn"}
                                                                disabled={!canDeleteItems}
                                                            >
                                                                {isSoftDeleted ? "Undo" : "Remove"}
                                                            </Button>
                                                            <div className="" onClick={() => toggleCollapse(index)}>
                                                                <Checkbox checked={item._collapsed} /> {item._collapsed ? "Expand" : "Collapse"}
                                                            </div>
                                                        </div>
                                                    </footer>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="card-body" style={contentStyle}>
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
                                                                        disabled={isDisabled}
                                                                    >
                                                                        <option value="">
                                                                            {!item.smiCode
                                                                                ? "Select SMI"
                                                                                : localSMIs.find((s) => {
                                                                                    s.smiCode == item.smiCode
                                                                                })?.smiDetails}
                                                                        </option>
                                                                        {localSMIs.map((smi, i) => (
                                                                            <option key={smi.smiCode + "" + i} value={smi.smiCode}>
                                                                                {smi.smiDetails}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="label">Description</div>
                                                                <div className="value">
                                                                    <Input
                                                                        value={item.itemDescription}
                                                                        onChange={(e) => handleItemChange(index, "itemDescription", e.target.value)}
                                                                        placeholder="Description"
                                                                        disabled={isDisabled}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="card-row two-up">
                                                            <div>
                                                                <div className="label">Actual Value</div>
                                                                <div className="value">
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        value={item.actualValue}
                                                                        onChange={(e) => handleItemChange(index, "actualValue", e.target.value)}
                                                                        disabled={isDisabled}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <div className="label">Rate (%)</div>
                                                                <div className="value">
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        max="100"
                                                                        step="0.01"
                                                                        value={item.itemRate}
                                                                        onChange={(e) => {
                                                                            handleItemChange(index, "itemRate", e.target.value)
                                                                        }}
                                                                        disabled={isDisabled}
                                                                    />
                                                                </div>
                                                                <div className="discounts-area">
                                                                    {item.itemRate && item.actualValue ? <div>amount: {formatCurrency((item.itemRate / 100) * item.actualValue)}</div> : null}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="card-row two-up" style={{ marginTop: 8 }}>
                                                            <div>
                                                                <div className="label">Multiplier</div>
                                                                <div className="value">
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        value={item.multiplyRate}
                                                                        onChange={(e) => handleItemChange(index, "multiplyRate", e.target.value)}
                                                                        disabled={isDisabled}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <div className="label">Location</div>
                                                                <div className="value">
                                                                    <Input
                                                                        value={formData.location}
                                                                        onChange={(e) => handleItemChange(index, "location", e.target.value)}
                                                                        placeholder="Location"
                                                                        disabled
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="card-row" style={{ marginTop: 8 }}>
                                                            <div className="label">Stock</div>
                                                            <div className="value">
                                                                <label className="stock-toggle">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!item._showStock}
                                                                        onChange={() => toggleStockUI(index)}
                                                                        disabled={isDisabled}
                                                                    />
                                                                    <span style={{ marginLeft: 8 }}>Add stock</span>
                                                                </label>
                                                            </div>
                                                        </div>

                                                        {item._showStock && (
                                                            <div className="stock-block">
                                                                <div className="stock-row">
                                                                    <div className="label">Stock Code</div>
                                                                    <div className="value">
                                                                        <Input
                                                                            value={item.stockItem?.stockCode || ""}
                                                                            onChange={(e) => handleStockChange(index, "stockCode", e.target.value)}
                                                                            placeholder="Stock code"
                                                                            disabled={isDisabled}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="stock-row">
                                                                    <div className="label">Stock Description</div>
                                                                    <div className="value">
                                                                        <Input
                                                                            value={item.stockItem?.stockDescription || ""}
                                                                            onChange={(e) => handleStockChange(index, "stockDescription", e.target.value)}
                                                                            placeholder="Stock description"
                                                                            disabled={isDisabled}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="stock-row two-up">
                                                                    <div>
                                                                        <div className="label">Stock Sum Insured</div>
                                                                        <div className="value">
                                                                            <Input
                                                                                type="number"
                                                                                value={item.stockItem?.stockSumInsured ?? 0}
                                                                                onChange={(e) => handleStockChange(index, "stockSumInsured", e.target.value)}
                                                                                disabled={isDisabled}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="label">Stock Rate (%)</div>
                                                                        <div className="value">
                                                                            <Input
                                                                                type="number"
                                                                                value={item.itemRate}
                                                                                onChange={(e) => handleStockChange(index, "stockRate", e.target.value)}
                                                                                disabled
                                                                            />
                                                                        </div>
                                                                        <div className="discounts-area">
                                                                            {item.itemRate && item.stockItem.stockSumInsured ? <div>amount: {formatCurrency((item.itemRate / 100) * item.stockItem.stockSumInsured)}</div> : null}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="stock-row">
                                                                    <div className="label">Stock Discount Rate (%)</div>
                                                                    <div className="value">
                                                                        <Input
                                                                            type="number"
                                                                            value={item.stockItem?.stockDiscountRate ?? 0}
                                                                            onChange={(e) => handleStockChange(index, "stockDiscountRate", e.target.value)}
                                                                            disabled={isDisabled}
                                                                        />
                                                                    </div>
                                                                    <div className="discounts-area">
                                                                        {item.stockItem?.stockDiscountRate && item.stockItem.stockSumInsured ? <div>amount: {formatCurrency((item.stockItem?.stockDiscountRate / 100) * item.stockItem.stockSumInsured)}</div> : null}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="card-row" style={{ marginTop: 8 }}>
                                                            <div className="label">FEA Discount Rate (%)</div>
                                                            <div className="value">
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={item.feaDiscountRate ?? 0}
                                                                    onChange={(e) => handleItemChange(index, "feaDiscountRate", e.target.value)}
                                                                    disabled={isDisabled}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="discounts-area">
                                                            {item.stockDiscountAmount ? (
                                                                <div>Stock: {formatCurrency(item.stockDiscountAmount)}</div>
                                                            ) : null}
                                                            {item.feaDiscountAmount ? <div>FEA: {formatCurrency(item.feaDiscountAmount)}</div> : null}
                                                        </div>

                                                        <div
                                                            className="server-summary"
                                                            role="region"
                                                            aria-label={`Server premium for item ${item.itemNo}`}
                                                        >
                                                            <div className="server-title">Actual Premium</div>
                                                            <div className="server-amount">
                                                                {item.actualPremium ? formatCurrency(item.actualPremium) : "N/A"}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    marginTop: 8,
                                                                    display: "flex",
                                                                    gap: 10,
                                                                    flexDirection: "column",
                                                                }}
                                                            >
                                                                <div className="value" style={{ fontWeight: 700 }}>
                                                                    total Sum Insured: {formatCurrency(item?.totalSumInsured || (item?.actualValue + item?.stockItem?.stockSumInsured) || 0)}
                                                                </div>
                                                                <div className="value" style={{ fontWeight: 700 }}>
                                                                    Shared Premium: {formatCurrency(item.premiumValue ?? 0)}
                                                                </div>
                                                                <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                                                                    <div className="muted">
                                                                        Stock Discount:{" "}
                                                                        {item.stockDiscountAmount
                                                                            ? formatCurrency(item.stockDiscountAmount)
                                                                            : formatCurrency(0)}
                                                                    </div>
                                                                    <div className="muted">
                                                                        FEA Discount:{" "}
                                                                        {item.feaDiscountAmount ? formatCurrency(item.feaDiscountAmount) : formatCurrency(0)}
                                                                    </div>
                                                                </div>
                                                                <div className="server-net">
                                                                    Net:{" "}
                                                                    {item.netPremiumAfterDiscounts
                                                                        ? formatCurrency(item.netPremiumAfterDiscounts)
                                                                        : formatCurrency(0)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <footer className="card-footer">
                                                        <div className="footer-actions centered">
                                                            <Button
                                                                onClick={() => handleApplyAndCalculate(index)}
                                                                size="sm"
                                                                className="apply-btn"
                                                                disabled={!!applyingMap[keyFor(index)] || isDisabled}
                                                            >
                                                                {applyingMap[keyFor(index)] ? "Applying..." : "Apply"}
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleRemoveItem(index)}
                                                                size="sm"
                                                                variant={isSoftDeleted ? "default" : "outline"}
                                                                className={isSoftDeleted ? "bg-blue-600 text-white hover:bg-blue-700" : "remove-btn"}
                                                                disabled={!canDeleteItems}
                                                            >
                                                                {isSoftDeleted ? "Undo" : "Remove"}
                                                            </Button>
                                                            <div className="" onClick={() => toggleCollapse(index)}>
                                                                <Checkbox checked={item._collapsed} /> {item._collapsed ? "Expand" : "Collapse"}
                                                            </div>
                                                        </div>
                                                    </footer>
                                                </>
                                            )}
                                        </article>
                                    );
                                })}
                        </div>
                    </div>

                    <div className="form-section">
                        <div className="qc-adjustments-panel">
                            <h3 style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Premium Adjustments</span>
                                <div className="" onClick={() => setAdjCollapse(!adjCollapse)}>
                                    <Checkbox checked={adjCollapse} /> {adjCollapse ? "Expand" : "Collapse"}
                                </div>
                            </h3>
                            {!adjCollapse && (
                                <>
                                    <div className="qc-adjustments-grid">
                                        <div className="qc-adjustment-section">
                                            <h4>Discounts</h4>
                                            {discountsList.map((name: string) => {
                                                const key = getAdjustmentKey(name, 'discount');
                                                return (
                                                    <div className="qc-adjustment-field" key={key}>
                                                        <Label htmlFor={key}>{name} (%)</Label>
                                                        <Input
                                                            id={key}
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            value={adjustments[key] || 0}
                                                            onChange={(e) =>
                                                                setAdjustments((prev: any) => ({
                                                                    ...prev,
                                                                    [key]: Number(e.target.value),
                                                                }))
                                                            }
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                );
                                            })}
                                            <div className="qc-adjustment-field">
                                                <Label htmlFor="otherDiscountsRate">Other Discounts (%)</Label>
                                                <Input
                                                    id="otherDiscountsRate"
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    value={adjustments.otherDiscountsRate}
                                                    onChange={(e) =>
                                                        setAdjustments((prev: any) => ({
                                                            ...prev,
                                                            otherDiscountsRate: Number(e.target.value),
                                                        }))
                                                    }
                                                    disabled={isReadOnly}
                                                />
                                            </div>
                                        </div>

                                        <div className="qc-adjustment-section">
                                            <h4>Loadings</h4>
                                            {loadingsList.map((name: string) => {
                                                const key = getAdjustmentKey(name, 'loading');
                                                return (
                                                    <div className="qc-adjustment-field" key={key}>
                                                        <Label htmlFor={key}>{name} (%)</Label>
                                                        <Input
                                                            id={key}
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.01"
                                                            value={adjustments[key] || 0}
                                                            onChange={(e) =>
                                                                setAdjustments((prev: any) => ({
                                                                    ...prev,
                                                                    [key]: Number(e.target.value),
                                                                }))
                                                            }
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                );
                                            })}
                                            <div className="qc-adjustment-field">
                                                <Label htmlFor="otherLoading2Rate">Other Loading (%)</Label>
                                                <Input
                                                    id="otherLoading2Rate"
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    value={adjustments.otherLoading2Rate}
                                                    onChange={(e) =>
                                                        setAdjustments((prev: any) => ({
                                                            ...prev,
                                                            otherLoading2Rate: Number(e.target.value),
                                                        }))
                                                    }
                                                    disabled={isReadOnly}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            <div style={{ marginTop: 12, display: "flex", gap: 8, flexDirection: "column" }}>
                                {!adjCollapse && (
                                    <>
                                        <Button onClick={handleApplySectionAdjustments} size="sm" variant="outline">
                                            Apply Premium Adjustments
                                        </Button>
                                    </>
                                )}
                                {(sectionAdjustmentsResult.success || sectionAdjustmentsLoadings?.length > 0 || sectionAdjustmentsDiscounts?.length > 0) && (
                                    <div className={"proposal-adjustments-card"}>
                                        <div className="card-header">
                                            <h4>Premium Adjustments</h4>
                                            <span className="badge success">Applied</span>
                                        </div>

                                        <div className="card-body two-column">
                                            <div className="summary-column">
                                                <div className="summary-row">
                                                    <div className="label">Starting Premium</div>
                                                    <div className="value">{formatCurrency(sectionAdjustmentsResult.startingPremium)}</div>
                                                </div>

                                                <div className="summary-row">
                                                    <div className="label">Net Premium Due</div>
                                                    <div className="value highlight">
                                                        {formatCurrency(sectionAdjustmentsResult.netPremiumDue)}
                                                    </div>
                                                </div>

                                                <div className="divider" />

                                                <div className="mini-grid">
                                                    <div className="mini-item">
                                                        <div className="mini-label">Special Discount</div>
                                                        <div className="mini-value">
                                                            {formatCurrency(sectionAdjustmentsResult.specialDiscountAmount)}
                                                        </div>
                                                    </div>
                                                    <div className="mini-item">
                                                        <div className="mini-label">Deductible Discount</div>
                                                        <div className="mini-value">
                                                            {formatCurrency(sectionAdjustmentsResult.deductibleDiscountAmount)}
                                                        </div>
                                                    </div>
                                                    <div className="mini-item">
                                                        <div className="mini-label">Spread Discount</div>
                                                        <div className="mini-value">
                                                            {formatCurrency(sectionAdjustmentsResult.spreadDiscountAmount)}
                                                        </div>
                                                    </div>
                                                    <div className="mini-item">
                                                        <div className="mini-label">LTA Discount</div>
                                                        <div className="mini-value">
                                                            {formatCurrency(sectionAdjustmentsResult.ltaDiscountAmount)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="summary-column">
                                                <div className="section-title">Loadings</div>
                                                <div className="mini-grid">
                                                    <div className="mini-item">
                                                        <div className="mini-label">Theft Loading</div>
                                                        <div className="mini-value">
                                                            {formatCurrency(sectionAdjustmentsResult.theftLoadingAmount)}
                                                        </div>
                                                    </div>
                                                    <div className="mini-item">
                                                        <div className="mini-label">SRCC Loading</div>
                                                        <div className="mini-value">
                                                            {formatCurrency(sectionAdjustmentsResult.srccLoadingAmount)}
                                                        </div>
                                                    </div>
                                                    <div className="mini-item">
                                                        <div className="mini-label">Other Loading 2</div>
                                                        <div className="mini-value">
                                                            {formatCurrency(sectionAdjustmentsResult.otherLoading2Amount)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="divider" />

                                                <div className="footer-note">
                                                    <small className="muted">
                                                        {sectionAdjustmentsResult.message ?? "Section-level adjustments applied."}
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="summary-section">
                        <div className="summary-item">
                            <Label>Total Sum Insured</Label>
                            <div className="summary-value">{formatCurrency(formData.sectionSumInsured || 0)}</div>
                        </div>
                        <div className="summary-item">
                            <Label>Total Premium</Label>
                            <div className="summary-value">{formatCurrency(formData.sectionPremium || 0)}</div>
                        </div>

                        {formData.sectionNetPremium !== undefined && (
                            <div className="summary-item">
                                <Label>Net Premium</Label>
                                <div className="summary-value">{formatCurrency((formData as any).sectionNetPremium || 0)}</div>
                            </div>
                        )}
                        {sectionAgregate !== null && (
                            <>
                                <div className="summary-item">
                                    <Label>Aggregate Sum Insured</Label>
                                    <div className="summary-value">{formatCurrency(sectionAgregate.aggregateSumInsured || 0)}</div>
                                </div>
                                <div className="summary-item">
                                    <Label>Aggregate Premium</Label>
                                    <div className="summary-value">{formatCurrency(sectionAgregate.aggregatePremium || 0)}</div>
                                </div>
                            </>
                        )}
                        {formData.lastCalculated && (
                            <div className="summary-item">
                                <Label>Last Calculated</Label>
                                <div className="summary-value">{new Date((formData as any).lastCalculated).toLocaleString()}</div>
                            </div>
                        )}
                    </div>

                    <div className="modal-actions">
                        {(!isReadOnly || isCancellation || isDeletion || isReturn) && <Button onClick={handleSave}>{section ? "Update Section" : "Save Sections"}</Button>}
                        <Button onClick={onClose} variant="outline">
                            Cancel
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default EndorsementSectionModal;