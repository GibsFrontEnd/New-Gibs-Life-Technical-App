//@ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "../../features/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/new-button"
import Input from "../ui/Input"
import { Label } from "../ui/label"
import { toast } from "sonner"
import { Loader2, Plus, Trash2 } from "lucide-react"
import type { PolicyMotorVehicleUI } from "../../types/underwriting"
import {
    calculateMotorBasicPremium,
    applyMotorDiscounts,
    applyMotorLoadings,
    calculateMotorFinalPremium,
    getMotorVehicleOptions,
} from "../../features/reducers/underwriteReducers/underwritingSlice"
import {
    BASIS_PREMIUM,
    BASIS_SUM_INSURED,
    FALLBACK_VEHICLE_OPTIONS,
    readVehicleAdjustments,
    realCertificateNo,
    toAdjustmentInput,
    type MotorAdjustmentInput,
} from "../../utils/motor-vehicle"
import "./AddPolicyVehicleModal.css"
import { apiErrorMessage } from "../../utils/api-error"
import { formatMoney } from "../../utils/currency"

interface AddPolicyVehicleModalProps {
    isOpen: boolean
    onClose: () => void
    /** Resolve true when saved; the modal stays open (with the user's input) otherwise */
    onSave: (vehicle: PolicyMotorVehicleUI) => boolean | void | Promise<boolean | void>
    vehicle?: PolicyMotorVehicleUI
    /** Policy period, used as the vehicle's default cover dates */
    defaultStartDate?: string
    defaultEndDate?: string
    nextItemNo?: number
    isReadOnly?: boolean
    /** The policy's currency; values and premiums are in it */
    currency?: string
}

const dateOnly = (v: any) => (v ? String(v).split("T")[0] : "")

// Keeps a saved vehicle's current value selectable even when it isn't in the list
const withCurrent = (options: string[], current: string) =>
    current && !options.some((o) => o.toLowerCase() === String(current).toLowerCase()) ? [current, ...options] : options

export const AddPolicyVehicleModal = ({
    isOpen,
    onClose,
    onSave,
    vehicle,
    defaultStartDate,
    defaultEndDate,
    nextItemNo = 1,
    isReadOnly = false,
    currency,
}: AddPolicyVehicleModalProps) => {
    const formatCurrency = (amount: number | null | undefined) => formatMoney(amount, currency)
    const dispatch = useDispatch<AppDispatch>()
    const { motorAdjustmentOptions } = useSelector((state: RootState) => state.underwritings)
    const [options, setOptions] = useState(FALLBACK_VEHICLE_OPTIONS)
    const [isSaving, setIsSaving] = useState(false)
    const [isPreviewing, setIsPreviewing] = useState(false)
    const [preview, setPreview] = useState<any>(null)
    const [previewError, setPreviewError] = useState<string | null>(null)

    const initialForm = () => {
        const adj = readVehicleAdjustments(vehicle)
        return {
            ...(vehicle || {}),
            itemNo: vehicle?.itemNo ?? nextItemNo,
            certificateNo: realCertificateNo(vehicle),
            vehicleRegNo: vehicle?.vehicleRegNo ?? "",
            vehicleUser: vehicle?.vehicleUser ?? "",
            vehicleType: vehicle?.vehicleType ?? "",
            vehicleMake: vehicle?.vehicleMake ?? "",
            vehicleModel: vehicle?.vehicleModel ?? "",
            chassisNo: vehicle?.chassisNo ?? "",
            engineNo: vehicle?.engineNo ?? "",
            color: vehicle?.color ?? "",
            modelYear: vehicle?.modelYear || new Date().getFullYear(),
            coverType: vehicle?.coverType ?? "COMPREHENSIVE",
            usage: vehicle?.usage ?? "PRIVATE",
            vehicleValue: vehicle?.vehicleValue ?? 0,
            premiumRate: vehicle?.premiumRate ?? 0,
            state: vehicle?.state ?? "",
            seatCapacity: vehicle?.seatCapacity ?? 0,
            waxCode: vehicle?.waxCode ?? "",
            location: vehicle?.location ?? "",
            startDate: dateOnly(vehicle?.startDate) || defaultStartDate || "",
            endDate: dateOnly(vehicle?.endDate) || defaultEndDate || "",
            trackingCost: vehicle?.trackingCost ?? 0,
            rescueCost: vehicle?.rescueCost ?? 0,
            discounts: adj.discounts,
            loadings: adj.loadings,
            uiId: vehicle?.uiId ?? `vehicle_${Date.now()}`,
        }
    }

    const [formData, setFormData] = useState<any>(initialForm)

    // The modal can stay mounted: reload from `vehicle` each time it opens
    useEffect(() => {
        if (isOpen) {
            setFormData(initialForm())
            setPreview(null)
            setPreviewError(null)
        }
    }, [isOpen, vehicle])

    // Spellings must match TPD_Premium for third-party flat premiums
    useEffect(() => {
        if (!isOpen) return
        ;(dispatch(getMotorVehicleOptions()) as any)
            .unwrap()
            .then((o: any) => {
                if (o?.vehicleTypes?.length) setOptions({
                    vehicleTypes: o.vehicleTypes,
                    usageTypes: o.usageTypes?.length ? o.usageTypes : FALLBACK_VEHICLE_OPTIONS.usageTypes,
                    coverTypes: o.coverTypes?.length ? o.coverTypes : FALLBACK_VEHICLE_OPTIONS.coverTypes,
                })
            })
            .catch(() => { /* older API: keep the built-in list */ })
    }, [isOpen, dispatch])

    const set = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, [field]: value }))
    const setNumber = (field: string, value: string) => set(field, value === "" ? "" : Number(value))

    // ----- discounts / loadings -----
    const updateList = (kind: "discounts" | "loadings", fn: (l: MotorAdjustmentInput[]) => MotorAdjustmentInput[]) =>
        setFormData((prev: any) => ({ ...prev, [kind]: fn([...(prev[kind] || [])]) }))
    const addAdjustment = (kind: "discounts" | "loadings") =>
        updateList(kind, (l) => [...l, { adjustmentName: "", rate: "", appliedOn: BASIS_PREMIUM }])
    const changeAdjustment = (kind: "discounts" | "loadings", row: number, field: string, value: any) =>
        updateList(kind, (l) => l.map((a, i) => (i === row ? { ...a, [field]: field === "rate" ? (value === "" ? "" : Number(value)) : value } : a)))
    const removeAdjustment = (kind: "discounts" | "loadings", row: number) =>
        updateList(kind, (l) => l.filter((_, i) => i !== row))

    // ----- live premium preview: same steps, same order as the saved calculation -----
    const previewKey = JSON.stringify({
        t: formData.vehicleType, u: formData.usage, c: formData.coverType,
        v: Number(formData.vehicleValue) || 0, r: Number(formData.premiumRate) || 0,
        d: toAdjustmentInput(formData.discounts), l: toAdjustmentInput(formData.loadings),
        tc: Number(formData.trackingCost) || 0, rc: Number(formData.rescueCost) || 0,
    })

    useEffect(() => {
        if (!isOpen) return
        const k = JSON.parse(previewKey)
        if (!k.t || !k.c || !(k.v > 0)) {
            setPreview(null)
            return
        }
        let cancelled = false
        const timer = setTimeout(async () => {
            setIsPreviewing(true)
            setPreviewError(null)
            try {
                const basic = await (dispatch(calculateMotorBasicPremium({
                    vehicleType: k.t, vehicleValue: k.v, premiumRate: k.r, coverType: k.c, usage: k.u,
                })) as any).unwrap()
                const disc = await (dispatch(applyMotorDiscounts({
                    basicPremium: basic.basicPremium, vehicleValue: k.v, discounts: k.d,
                })) as any).unwrap()
                const load = await (dispatch(applyMotorLoadings({
                    premiumAfterDiscounts: disc.premiumAfterDiscounts, vehicleValue: k.v, loadings: k.l,
                })) as any).unwrap()
                const fin = await (dispatch(calculateMotorFinalPremium({
                    grossPremium: load.grossPremium, trackingCost: k.tc, rescueCost: k.rc,
                })) as any).unwrap()
                if (cancelled) return
                setPreview({
                    basicPremium: Number(basic.basicPremium) || 0,
                    isFlat: !!basic.isThirdPartyOrFlat,
                    discountsApplied: disc.discountsApplied || [],
                    totalDiscount: Number(disc.totalDiscountAmount) || 0,
                    loadingsApplied: load.loadingsApplied || [],
                    totalLoading: Number(load.totalLoadingAmount) || 0,
                    grossPremium: Number(load.grossPremium) || 0,
                    netPremium: Number(fin.netPremium) || 0,
                })
            } catch (err: any) {
                if (!cancelled) setPreviewError(apiErrorMessage(err, "Could not calculate the premium"))
            } finally {
                if (!cancelled) setIsPreviewing(false)
            }
        }, 400)
        return () => { cancelled = true; clearTimeout(timer) }
    }, [isOpen, previewKey])

    const appliedAmount = (kind: "discounts" | "loadings", name: string) => {
        const list = kind === "discounts" ? preview?.discountsApplied : preview?.loadingsApplied
        const hit = (list || []).find((a: any) => String(a.adjustmentName || "").trim().toLowerCase() === String(name || "").trim().toLowerCase())
        return hit ? Number(hit.amount) || 0 : null
    }

    const validate = (): string | null => {
        if (!String(formData.vehicleRegNo || "").trim()) return "Enter the registration number"
        if (!formData.vehicleType) return "Select the vehicle type"
        if (!formData.coverType) return "Select the cover type"
        if (!formData.usage) return "Select the usage"
        if (!(Number(formData.vehicleValue) > 0)) return "Enter a vehicle value above 0"
        if (!preview?.isFlat && !(Number(formData.premiumRate) > 0))
            return "Enter the premium rate (only third-party covers with a flat premium can have no rate)"
        if (formData.startDate && formData.endDate && formData.startDate > formData.endDate)
            return "The cover end date is before the start date"
        const incomplete = [...(formData.discounts || []), ...(formData.loadings || [])]
            .find((a) => (String(a.adjustmentName || "").trim() && !(Number(a.rate) > 0)) || (!String(a.adjustmentName || "").trim() && Number(a.rate) > 0))
        if (incomplete) return "Each discount/loading needs both a name and a rate (or remove the row)"
        if (preview && preview.grossPremium < 0)
            return "Discounts exceed the premium. A discount on Sum Insured takes that % of the whole vehicle value — check the rate and basis."
        return null
    }

    const handleSave = async () => {
        const problem = validate()
        if (problem) {
            toast.warning(problem)
            return
        }
        setIsSaving(true)
        try {
            const vehicleToSave = {
                ...formData,
                vehicleRegNo: String(formData.vehicleRegNo).trim().toUpperCase(),
                vehicleValue: Number(formData.vehicleValue) || 0,
                premiumRate: Number(formData.premiumRate) || 0,
                trackingCost: Number(formData.trackingCost) || 0,
                rescueCost: Number(formData.rescueCost) || 0,
                seatCapacity: Number(formData.seatCapacity) || 0,
                modelYear: Number(formData.modelYear) || new Date().getFullYear(),
                // "" is not a date to the API (some callers send this object as-is)
                startDate: formData.startDate || undefined,
                endDate: formData.endDate || undefined,
                certificateNo: formData.certificateNo || undefined,
                discounts: toAdjustmentInput(formData.discounts),
                loadings: toAdjustmentInput(formData.loadings),
            }
            await onSave(vehicleToSave)
        } finally {
            setIsSaving(false)
        }
    }

    const busy = isSaving
    const field = (id: string, label: string, input: any, wide = false) => (
        <div className={`form-field ${wide ? "wide" : ""}`}>
            <Label htmlFor={id}>{label}</Label>
            {input}
        </div>
    )
    const select = (id: string, value: string, list: string[], placeholder: string) => (
        <select id={id} value={value} onChange={(e) => set(id, e.target.value)}
            className="form-select w-full p-2 border rounded-md" disabled={isReadOnly || busy}>
            <option value="">{placeholder}</option>
            {withCurrent(list, value).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
    )

    const adjustmentBlock = (kind: "discounts" | "loadings") => {
        const isDiscount = kind === "discounts"
        const suggestions = isDiscount ? motorAdjustmentOptions?.standardDiscounts : motorAdjustmentOptions?.standardLoadings
        return (
            <div className="form-section">
                <div className="section-head">
                    <h4>{isDiscount ? "Discounts" : "Loadings"} ({(formData[kind] || []).length})</h4>
                    {!isReadOnly && (
                        <Button type="button" onClick={() => addAdjustment(kind)} size="sm" variant="outline" disabled={busy}>
                            <Plus size={14} className="mr-1" /> Add {isDiscount ? "Discount" : "Loading"}
                        </Button>
                    )}
                </div>
                {(formData[kind] || []).length === 0 ? (
                    <div className="muted-note">None</div>
                ) : (
                    (formData[kind] || []).map((a: MotorAdjustmentInput, row: number) => {
                        const amount = appliedAmount(kind, a.adjustmentName)
                        return (
                            <div key={row} className="adjustment-row">
                                <Input list={`motor-${kind}-options`} placeholder="Name" value={a.adjustmentName}
                                    onChange={(e) => changeAdjustment(kind, row, "adjustmentName", e.target.value)}
                                    disabled={isReadOnly || busy} />
                                <Input type="number" min="0" max={isDiscount ? "100" : undefined} step="0.01" placeholder="Rate %"
                                    value={a.rate} onChange={(e) => changeAdjustment(kind, row, "rate", e.target.value)}
                                    disabled={isReadOnly || busy} />
                                <select className="form-select p-2 border rounded-md" value={a.appliedOn}
                                    onChange={(e) => changeAdjustment(kind, row, "appliedOn", e.target.value)} disabled={isReadOnly || busy}>
                                    <option value={BASIS_PREMIUM}>on Premium</option>
                                    <option value={BASIS_SUM_INSURED}>on Sum Insured</option>
                                </select>
                                <span className="adjustment-amount">
                                    {amount != null ? `${isDiscount ? "−" : "+"}${formatCurrency(amount)}` : ""}
                                </span>
                                {!isReadOnly && (
                                    <button type="button" className="icon-btn" title="Remove" onClick={() => removeAdjustment(kind, row)} disabled={busy}>
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        )
                    })
                )}
                <datalist id={`motor-${kind}-options`}>
                    {(suggestions || []).map((o: string) => <option key={o} value={o} />)}
                </datalist>
            </div>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={() => { if (!isSaving) onClose() }} maxWidth="900px">
            <DialogContent className="policy-vehicle-modal">
                <DialogHeader>
                    <DialogTitle>
                        {vehicle ? `Edit Vehicle${formData.certificateNo ? ` · Cert ${formData.certificateNo}` : ""}` : "Add Vehicle"}
                    </DialogTitle>
                </DialogHeader>

                <div className="vehicle-modal-body">
                    <div className="form-section">
                        <h4>Vehicle</h4>
                        <div className="form-grid">
                            {field("vehicleRegNo", "Registration No *",
                                <Input id="vehicleRegNo" value={formData.vehicleRegNo} onChange={(e) => set("vehicleRegNo", e.target.value)}
                                    placeholder="e.g. ABC-123-XY" disabled={isReadOnly || busy} />)}
                            {field("vehicleType", "Vehicle Type *", select("vehicleType", formData.vehicleType, options.vehicleTypes, "Select type"))}
                            {field("vehicleMake", "Make",
                                <Input id="vehicleMake" value={formData.vehicleMake} onChange={(e) => set("vehicleMake", e.target.value)} placeholder="e.g. Toyota" disabled={isReadOnly || busy} />)}
                            {field("vehicleModel", "Model",
                                <Input id="vehicleModel" value={formData.vehicleModel} onChange={(e) => set("vehicleModel", e.target.value)} placeholder="e.g. Corolla" disabled={isReadOnly || busy} />)}
                            {field("modelYear", "Model Year",
                                <Input id="modelYear" type="number" value={formData.modelYear} onChange={(e) => setNumber("modelYear", e.target.value)} disabled={isReadOnly || busy} />)}
                            {field("color", "Colour",
                                <Input id="color" value={formData.color} onChange={(e) => set("color", e.target.value)} disabled={isReadOnly || busy} />)}
                            {field("chassisNo", "Chassis No",
                                <Input id="chassisNo" value={formData.chassisNo} onChange={(e) => set("chassisNo", e.target.value)} disabled={isReadOnly || busy} />)}
                            {field("engineNo", "Engine No",
                                <Input id="engineNo" value={formData.engineNo} onChange={(e) => set("engineNo", e.target.value)} disabled={isReadOnly || busy} />)}
                            {field("seatCapacity", "Seat Capacity",
                                <Input id="seatCapacity" type="number" min="0" value={formData.seatCapacity} onChange={(e) => setNumber("seatCapacity", e.target.value)} disabled={isReadOnly || busy} />)}
                            {field("vehicleUser", "Vehicle User",
                                <Input id="vehicleUser" value={formData.vehicleUser} onChange={(e) => set("vehicleUser", e.target.value)} placeholder="Policy Holder" disabled={isReadOnly || busy} />)}
                        </div>
                    </div>

                    <div className="form-section">
                        <h4>Cover</h4>
                        <div className="form-grid">
                            {field("coverType", "Cover Type *", select("coverType", formData.coverType, options.coverTypes, "Select cover"))}
                            {field("usage", "Usage *", select("usage", formData.usage, options.usageTypes, "Select usage"))}
                            {field("vehicleValue", "Vehicle Value (Sum Insured) *",
                                <Input id="vehicleValue" type="number" min="0" step="0.01" value={formData.vehicleValue} onChange={(e) => setNumber("vehicleValue", e.target.value)} disabled={isReadOnly || busy} />)}
                            {field("premiumRate", preview?.isFlat ? "Premium Rate (%) — flat premium applies" : "Premium Rate (%) *",
                                <Input id="premiumRate" type="number" min="0" max="100" step="0.01" value={formData.premiumRate} onChange={(e) => setNumber("premiumRate", e.target.value)} disabled={isReadOnly || busy || preview?.isFlat} />)}
                            {field("startDate", "Cover Start",
                                <Input id="startDate" type="date" value={formData.startDate} onChange={(e) => set("startDate", e.target.value)} disabled={isReadOnly || busy} />)}
                            {field("endDate", "Cover End",
                                <Input id="endDate" type="date" value={formData.endDate} onChange={(e) => set("endDate", e.target.value)} disabled={isReadOnly || busy} />)}
                            {field("state", "State",
                                <Input id="state" value={formData.state} onChange={(e) => set("state", e.target.value)} placeholder="e.g. Lagos" disabled={isReadOnly || busy} />)}
                            {field("location", "Location",
                                <Input id="location" value={formData.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Ikeja" disabled={isReadOnly || busy} />)}
                            {field("trackingCost", "Tracking Cost",
                                <Input id="trackingCost" type="number" min="0" step="0.01" value={formData.trackingCost} onChange={(e) => setNumber("trackingCost", e.target.value)} disabled={isReadOnly || busy} />)}
                            {field("rescueCost", "Rescue Cost",
                                <Input id="rescueCost" type="number" min="0" step="0.01" value={formData.rescueCost} onChange={(e) => setNumber("rescueCost", e.target.value)} disabled={isReadOnly || busy} />)}
                        </div>
                    </div>

                    {adjustmentBlock("discounts")}
                    {adjustmentBlock("loadings")}

                    <div className={`form-section premium-breakdown ${isPreviewing ? "is-updating" : ""}`}>
                        <h4>
                            Premium
                            {isPreviewing && <span className="updating-note"><Loader2 size={14} className="animate-spin" /> Calculating…</span>}
                        </h4>
                        {previewError ? (
                            <div className="preview-error">{previewError}</div>
                        ) : !preview ? (
                            <div className="muted-note">Select the vehicle type and cover, and enter the vehicle value to see the premium.</div>
                        ) : (
                            <div className="breakdown-rows">
                                <div><span>{preview.isFlat ? "Flat premium (third party)" : `Basic premium (${formatCurrency(Number(formData.vehicleValue))} × ${Number(formData.premiumRate) || 0}%)`}</span><span>{formatCurrency(preview.basicPremium)}</span></div>
                                <div><span>Discounts</span><span>−{formatCurrency(preview.totalDiscount)}</span></div>
                                <div><span>Loadings</span><span>+{formatCurrency(preview.totalLoading)}</span></div>
                                <div><span>Tracking + rescue</span><span>+{formatCurrency((Number(formData.trackingCost) || 0) + (Number(formData.rescueCost) || 0))}</span></div>
                                <div className="total"><span>Vehicle premium (annual)</span><span>{formatCurrency(preview.netPremium)}</span></div>
                                {preview.grossPremium < 0 && (
                                    <div className="preview-error">Discounts exceed the premium. A discount on Sum Insured takes that % of the whole vehicle value.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="vehicle-modal-footer">
                    <div className="footer-net">
                        <span className="footer-net-label">Vehicle premium (annual)</span>
                        <span className="footer-net-value">
                            {isPreviewing ? <><Loader2 size={16} className="animate-spin" /> Calculating…</> : formatCurrency(preview?.netPremium)}
                        </span>
                    </div>
                    <div className="footer-buttons">
                        <Button onClick={onClose} variant="outline" disabled={isSaving}>Cancel</Button>
                        {!isReadOnly && (
                            <Button onClick={handleSave} disabled={isSaving || isPreviewing}>
                                {isSaving ? <><Loader2 size={16} className="animate-spin mr-2" /> Saving...</> : "Save Vehicle"}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default AddPolicyVehicleModal
