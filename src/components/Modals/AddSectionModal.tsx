//@ts-nocheck
//@ts-nocheck
// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "../../features/store"
import type { RootState } from "../../features/store"
import { getSubRiskSectionsBySubRisk } from "../../features/reducers/productReducers/subRiskSectionSlice"
import { getSubRiskSMIsBySectionCode } from "../../features/reducers/productReducers/subRiskSMISlice"
import { getAllRisks } from "../../features/reducers/adminReducers/riskSlice"
import { getAllProducts } from "../../features/reducers/productReducers/productSlice"
import Select from "react-select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/new-button"
import Input from "../ui/Input"
import { Label } from "../ui/label"
import type { QuoteSection, RiskItem, CalculatedAggregate, AdjustmentCalculations } from "../../types/quotation"
import "./AddSectionModal.css"

import {
  calculateRiskItems,
  calculateSectionAggregate,
  calculateSectionAdjustment,
} from "../../features/reducers/quoteReducers/quotationSlice"
import { toast } from "../ui/use-toast"
import { Checkbox } from "../ui/checkbox"

interface AddSectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (section: QuoteSection) => void
  section?: QuoteSection | any
  productId: string
  onCalculateFullRiskArray?: (sectionID: string, fullRiskArray: any[]) => void
}

export const AddSectionModal = ({
  isOpen,
  onClose,
  onSave,
  section,
  productId,
  onCalculateFullRiskArray,
}: AddSectionModalProps) => {
  const dispatch = useDispatch<AppDispatch>()
  const { subRiskSections } = useSelector((state: RootState) => state.subRiskSections)
  const [sectionAgregate, setSectionAggregate] = useState<any>(null)
  const [adjCollapse, setAdjCollapse] = useState<boolean>(true)
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { risks } = useSelector((state: RootState) => state.risks)
  const { products } = useSelector((state: RootState) => state.products)
  const [riskClass, setRiskClass] = useState("")
  const [subRiskClass, setSubRiskClass] = useState("")

  const filteredProducts = products.filter(p => p.riskID === riskClass)
  const productOptions = filteredProducts.map(p => ({ value: p.productID, label: p.productName }))
  const sectionAdjustments = section?.sectionAdjustments
  const sectionAdjustmentsDiscounts = section?.sectionAdjustments?.discountsApplied
  const sectionAdjustmentsLoadings = section?.sectionAdjustments?.loadingsApplied

  const [sectionAdjustmentsResult, setSectionAdjustmentsResult] = useState<AdjustmentCalculations>({
    startingPremium: sectionAdjustments?.startingPremium || 0,
    specialDiscountAmount: sectionAdjustmentsDiscounts?.find((d) => d.name == "Special Discount")?.amount || 0,
    specialDiscountNetAmount: sectionAdjustmentsDiscounts?.find((d) => d.name == "Special Discount")?.premiumAfterAdjustment || 0,
    deductibleDiscountAmount: sectionAdjustmentsDiscounts?.find((d) => d.name == "Deductible Discount")?.amount || 0,
    deductibleDiscountNetAmount: sectionAdjustmentsDiscounts?.find((d) => d.name == "Deductible Discount")?.premiumAfterAdjustment || 0,
    spreadDiscountAmount: sectionAdjustmentsDiscounts?.find((d) => d.name == "Spread Discount")?.amount || 0,
    spreadDiscountNetAmount: sectionAdjustmentsDiscounts?.find((d) => d.name == "Spread Discount")?.premiumAfterAdjustment || 0,
    ltaDiscountAmount: sectionAdjustmentsDiscounts?.find((d) => d.name == "LTA Discount")?.amount || 0,
    ltaDiscountNetAmount: sectionAdjustmentsDiscounts?.find((d) => d.name == "LTA Discount")?.premiumAfterAdjustment || 0,
    theftLoadingAmount: sectionAdjustmentsLoadings?.find((d) => d.name == "Theft Loading")?.amount || 0,
    theftLoadingNetAmount: sectionAdjustmentsLoadings?.find((d) => d.name == "Theft Loading")?.premiumAfterAdjustment || 0,
    srccLoadingAmount: sectionAdjustmentsLoadings?.find((d) => d.name == "SRCC Loading")?.amount || 0,
    srccLoadingNetAmount: sectionAdjustmentsLoadings?.find((d) => d.name == "SRCC Loading")?.premiumAfterAdjustment || 0,
    otherLoading2Amount: sectionAdjustmentsLoadings?.find((d) => d.name == "Other Loading 2")?.amount || 0,
    otherLoading2NetAmount: sectionAdjustmentsLoadings?.find((d) => d.name == "Other Loading 2")?.premiumAfterAdjustment || 0,
    netPremiumDue: section?.sectionAdjustments?.finalNetPremium || 0,
    success: false,
    message: "",
  })

  const [adjustments, setAdjustments] = useState({
    specialDiscountRate: sectionAdjustmentsDiscounts?.find((d) => d.name == "Special Discount")?.rate || 0,
    deductibleDiscountRate: sectionAdjustmentsDiscounts?.find((d) => d.name == "Deductible Discount")?.rate || 0,
    spreadDiscountRate: sectionAdjustmentsDiscounts?.find((d) => d.name == "Spread Discount")?.rate || 0,
    ltaDiscountRate: sectionAdjustmentsDiscounts?.find((d) => d.name == "LTA Discount")?.rate || 0,
    otherDiscountsRate: sectionAdjustmentsDiscounts?.find((d) => d.name == "Special Discount")?.rate || 0,
    theftLoadingRate: sectionAdjustmentsLoadings?.find((d) => d.name == "Theft Loading")?.rate || 0,
    srccLoadingRate: sectionAdjustmentsLoadings?.find((d) => d.name == "SRCC Loading")?.rate || 0,
    otherLoading2Rate: sectionAdjustmentsLoadings?.find((d) => d.name == "Other Loading 2")?.rate || 0,
  })

  const { subRiskSMIs } = useSelector((state: RootState) => state.subRiskSMIs)
  
  const initialForm = (): QuoteSection => ({
    sectionID: section?.sectionID || "",
    sectionName: section?.sectionName || "",
    location: section?.location || "",
    sectionSumInsured: section?.sectionSumInsured || 0,
    sectionPremium: section?.sectionGrossPremium || 0,
    sectionNetPremium: (section as any)?.sectionNetPremium ?? 0,
    lastCalculated: (section as any)?.lastCalculated ?? null,
    proportionRate: 100,
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
  })

  const [formData, setFormData] = useState<QuoteSection>(initialForm)
  const [selectedSectionCode, setSelectedSectionCode] = useState<string>(section?.sectionID || "")
  const [applyingMap, setApplyingMap] = useState<Record<string, boolean>>({})
  const [itemsInTable, setItemsInTable] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (productId){ dispatch(getSubRiskSectionsBySubRisk(productId) as any)
      dispatch(getAllRisks({ pageNumber: 1, pageSize: 100 }) as any)
    }

  }, [dispatch, productId])
  useEffect(() => {
    if (riskClass) {
      dispatch(getAllProducts({ riskId: riskClass, pageNumber: 1, pageSize: 100 }) as any)
    }
  }, [dispatch, riskClass])

  useEffect(() => {
    if (subRiskSections && subRiskSections.length > 0 && section?.sectionID) {
      setSelectedSectionCode(section.sectionID)
      setFormData(initialForm())
    }
  }, [subRiskSections])

  useEffect(() => {
    if (productId && productId=="Package" && subRiskClass) {
      console.log(productId,subRiskClass);   
      dispatch(getSubRiskSectionsBySubRisk(subRiskClass))}  }, [subRiskClass])


  useEffect(() => {
    if (selectedSectionCode) dispatch(getSubRiskSMIsBySectionCode(selectedSectionCode) as any)
  }, [dispatch, selectedSectionCode])

  useEffect(() => {
    if (section) {
      setFormData(initialForm())
      setSelectedSectionCode(section.sectionID)
    }
  }, [section])

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
    }  }, [])



  const keyFor = (index: number) => `${formData.sectionID || "sec"}|${index}`

  const handleSectionNameChange = (sectionCode: string) => {
    setSelectedSectionCode(sectionCode)
    const selected = subRiskSections.find((s) => s.sectionCode === sectionCode)
    if (selected)
      setFormData((p) => ({
        ...p,
        sectionName: selected.sectionName,
        sectionID: sectionCode,
      }))
    else setFormData((p) => ({ ...p, sectionName: "", sectionID: sectionCode }))
  }

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
      _showStock: false,
      _collapsed: false,
    }
    setFormData((prev) => ({
      ...prev,
      riskItems: [...(prev.riskItems || []), newItem],
    }))
    setEditingIndex(formData.riskItems.length);
    console.log(formData.riskItems.length);
    
    if(formData.riskItems.length>0)handleAddToTable(formData.riskItems.length-1);
  }

  const handleItemChange = (index: number, field: keyof RiskItem | string, value: any) => {
    const updated = [...(formData.riskItems as any[])]
    const numeric = ["actualValue", "itemRate", "multiplyRate", "feaDiscountRate"]
    const parsed = numeric.includes(field as string) ? (value === "" ? 0 : Number(value)) : value
    updated[index] = { ...updated[index], [field]: parsed }

    if (field === "smiCode") {
      const s = subRiskSMIs.find((x) => x.smiCode === value)
      if (s)
        updated[index].itemRate =
          (s as any).rate ?? (s as any).itemRate ?? (s as any).defaultRate ?? updated[index].itemRate
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
    const updated = (formData.riskItems as any[])
      .filter((_, i) => i !== index)
      .map((it, i) => ({ ...it, itemNo: i + 1 }))
    
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
        const resp: CalculatedAggregate = await dispatch(calculateSectionAggregate(payload)).unwrap()
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
    const payload = {
      aggregatePremium: sectionAgregate.aggregatePremium,
      ...adjustments,
    }
    console.log(payload)

    if (payload) {
      try {
        const resp: AdjustmentCalculations = await dispatch(calculateSectionAdjustment(payload)).unwrap()
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
      const resp = await (dispatch(calculateRiskItems(payload)) as any).unwrap()

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
    if (!formData.riskItems || formData.riskItems?.length === 0) return

    const mapAllKey = "ALL"
    setApplyingMap((m) => ({ ...m, [mapAllKey]: true }))

    const payload = {
      subRisk: productId || "",
      riskItems: formData.riskItems.map((it: any) => ({
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
      const resp = await (dispatch(calculateRiskItems(payload)) as any).unwrap()
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

    const updatedSection: QuoteSection = {
      ...formData,
      ...adjustments,
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

    onSave(updatedSection)
    console.log(formData);
    console.log("Saved section:", updatedSection)
  }

  const formatCurrency = (amount: number): string =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount)

  const getSmiLabel = (smiCode: string) => {
    const sm = subRiskSMIs.find((s) => s.smiCode === smiCode)
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
              {productId =="Package" && <>
            <div className="form-field">
              <Label htmlFor="riskClass">Business Category *</Label>
              <Select
                options={risks.map(r => ({ value: r.riskID, label: r.riskName }))}
                value={riskClass ? { value: riskClass, label: risks.find(r => r.riskID === riskClass)?.riskName } : null}
                onChange={opt => setRiskClass(opt?.value ?? "")}
                placeholder="Select Business Category"
                isDisabled={itemsInTable.size > 0 || !!formData?.riskItems?.[0]?.smiCode}
              isClearable
              />
            </div>

            <div className="form-field">
              <Label htmlFor="subriskID">Subclass / Product *</Label>
              <Select
                options={productOptions}
                value={productOptions.find(p => p.value === subRiskClass) || null}
                onChange={opt => {setSubRiskClass(opt?.value ?? ""); handleSectionNameChange("")}}
                placeholder="Select Subclass"
                isDisabled={!riskClass || itemsInTable.size > 0 || !!formData?.riskItems?.[0]?.smiCode}
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
                  disabled={itemsInTable.size > 0  || !!formData?.riskItems?.[0]?.smiCode}
                >
                  <option value="">{!formData.sectionName ? "Select Section" : formData.sectionName}</option>
                  {subRiskSections.map((s, index) => (
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
                  disabled={itemsInTable.size > 0 || !!formData?.riskItems?.[0]?.smiCode}
                />
              </div>
            </div>
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
                              <Button
  size="sm"
  variant="outline"
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
</Button>                                <Button size="sm" variant="ghost" onClick={() => handleRemoveItem(index)}>
                                  Remove
                                </Button>
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div style={{ fontWeight: 700 }}>Risk Items ({formData.riskItems?.length})</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Button onClick={()=>{handleAddItem();}} size="sm">
                  Add Item
                </Button>
                <Button onClick={handleCalculateAllItems} size="sm" variant="outline" disabled={!!applyingMap["ALL"]}>
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
                  value={(formData as any).proportionRate ?? 0}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      proportionRate: e.target.value === "" ? 0 : Number(e.target.value),
                    }))
                  }
                  style={{ width: 120 }}
                  disabled
                />
              </div>

              {(formData.riskItems || [])
                .map((item: any, index: number) => ({ item, index }))
                .filter(({ index }) => !itemsInTable.has(index))
                .map(({ item, index }) => (
                <article
                  key={`${item.sectionID}-${index}`}
                  className={`item-card ${item._collapsed ? "collapsed" : ""}`}
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
                            onClick={() => {handleApplyAndCalculate(index);}}
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
                          >
                            Add to Table
                          </Button>
 */}                          <Button
                            onClick={() => handleRemoveItem(index)}
                            size="sm"
                            variant="outline"
                            className="remove-btn"
                          >
                            Remove
                          </Button>
                          <div className="" onClick={() => toggleCollapse(index)}>
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
                              >
                                <option value="">
                                  {!item.smiCode
                                    ? "Select SMI"
                                    : subRiskSMIs.find((s) => {
                                      s.smiCode == item.smiCode
                                    })?.smiDetails}
                                </option>
                                {subRiskSMIs.map((smi, i) => (
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
                            disabled={!!applyingMap[keyFor(index)]}
                          >
                            {applyingMap[keyFor(index)] ? "Applying..." : "Apply"}
                          </Button>
{/*                           <Button
                            onClick={() => handleAddToTable(index)}
                            size="sm"
                            variant="secondary"
                            className="stage-btn"
                          >
                            Add to Table
                          </Button>
 */}                          <Button
                            onClick={() => handleRemoveItem(index)}
                            size="sm"
                            variant="outline"
                            className="remove-btn"
                          >
                            Remove
                          </Button>
                          <div className="" onClick={() => toggleCollapse(index)}>
                            <Checkbox checked={item._collapsed} /> {item._collapsed ? "Expand" : "Collapse"}
                          </div>
                        </div>
                      </footer>
                    </>
                  )}
                </article>
              ))}
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
                      <div className="qc-adjustment-field">
                        <Label htmlFor="specialDiscountRate">Special Discount (%)</Label>
                        <Input
                          id="specialDiscountRate"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={adjustments.specialDiscountRate}
                          onChange={(e) =>
                            setAdjustments((prev) => ({
                              ...prev,
                              specialDiscountRate: Number(e.target.value),
                            }))
                          }
                        />
                      </div>
                      <div className="qc-adjustment-field">
                        <Label htmlFor="deductibleDiscountRate">Deductible Discount (%)</Label>
                        <Input
                          id="deductibleDiscountRate"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={adjustments.deductibleDiscountRate}
                          onChange={(e) =>
                            setAdjustments((prev) => ({
                              ...prev,
                              deductibleDiscountRate: Number(e.target.value),
                            }))
                          }
                        />
                      </div>
                      <div className="qc-adjustment-field">
                        <Label htmlFor="spreadDiscountRate">Spread Discount (%)</Label>
                        <Input
                          id="spreadDiscountRate"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={adjustments.spreadDiscountRate}
                          onChange={(e) =>
                            setAdjustments((prev) => ({
                              ...prev,
                              spreadDiscountRate: Number(e.target.value),
                            }))
                          }
                        />
                      </div>
                      <div className="qc-adjustment-field">
                        <Label htmlFor="ltaDiscountRate">LTA Discount (%)</Label>
                        <Input
                          id="ltaDiscountRate"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={adjustments.ltaDiscountRate}
                          onChange={(e) =>
                            setAdjustments((prev) => ({
                              ...prev,
                              ltaDiscountRate: Number(e.target.value),
                            }))
                          }
                        />
                      </div>
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
                            setAdjustments((prev) => ({
                              ...prev,
                              otherDiscountsRate: Number(e.target.value),
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="qc-adjustment-section">
                      <h4>Loadings</h4>
                      <div className="qc-adjustment-field">
                        <Label htmlFor="theftLoadingRate">Theft Loading (%)</Label>
                        <Input
                          id="theftLoadingRate"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={adjustments.theftLoadingRate}
                          onChange={(e) =>
                            setAdjustments((prev) => ({
                              ...prev,
                              theftLoadingRate: Number(e.target.value),
                            }))
                          }
                        />
                      </div>
                      <div className="qc-adjustment-field">
                        <Label htmlFor="srccLoadingRate">SRCC Loading (%)</Label>
                        <Input
                          id="srccLoadingRate"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={adjustments.srccLoadingRate}
                          onChange={(e) =>
                            setAdjustments((prev) => ({
                              ...prev,
                              srccLoadingRate: Number(e.target.value),
                            }))
                          }
                        />
                      </div>
                      <div className="qc-adjustment-field">
                        <Label htmlFor="otherLoading2Rate">Other Loading 2 (%)</Label>
                        <Input
                          id="otherLoading2Rate"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={adjustments.otherLoading2Rate}
                          onChange={(e) =>
                            setAdjustments((prev) => ({
                              ...prev,
                              otherLoading2Rate: Number(e.target.value),
                            }))
                          }
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
            <Button onClick={handleSave}>Save & Update</Button>
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddSectionModal