//@ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch, RootState } from "../../../features/store"
import { Button } from "../../ui/new-button"
import Input from "../../ui/Input"
import { Label } from "../../ui/label"
import { AddPolicyVehicleModal } from "../../Modals/AddPolicyVehicleModal"
import { UploadMotorVehiclesModal } from "../../Modals/UploadMotorVehiclesModal"
import { toast } from "sonner"
import {
    getPolicyByNumber,
    getMotorCalculations,
    getMotorCalculationBreakdownByDetailID,
    getMotorAdjustmentTypes,
    createAdditionalMotorCalculation,
    updateMotorCalculation,
    convertMotorCalculationToVehicles,
    setMotorVehicles,
    setCurrentMotorCalculation,
} from "../../../features/reducers/underwriteReducers/underwritingSlice"
import "./PolicyCalculator.css"
import { inclusiveCoverDays } from "../../../utils/cover-days"
import { realCertificateNo, toVehicleInput } from "../../../utils/motor-vehicle"
import { apiErrorMessage } from "../../../utils/api-error"
import { formatMoney, formulaInCurrency, isForeignCurrency } from "../../../utils/currency"
import { useNavigate, useParams } from "react-router-dom"
import { ChevronDown, Loader2, ArrowLeft, Printer, UploadCloud } from "lucide-react"

const vehicleKey = (vehicle: any, index: number) =>
    String(vehicle.uiId || realCertificateNo(vehicle) || vehicle.vehicleRegNo || `veh-${index}`)

const errorMessage = (err: any) => apiErrorMessage(err)

export default function MotorPolicyCalculator() {
    const { policyNo: encodedPolicyNo, detailID: urlDetailID } = useParams<{ policyNo: string; detailID?: string }>()
    const policyNo = encodedPolicyNo ? decodeURIComponent(encodedPolicyNo) : ""
    const navigate = useNavigate()
    const dispatch = useDispatch<AppDispatch>()

    const {
        currentPolicy,
        motorVehicles: vehicles,
        motorCalculationBreakdown: calculationBreakdown,
    } = useSelector((state: RootState) => state.underwritings)

    const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false)
    const [showVehicleModal, setShowVehicleModal] = useState(false)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [editingKey, setEditingKey] = useState<string | null>(null)
    const [adjustments, setAdjustments] = useState({ otherDiscountRate: 0, otherLoadingRate: 0 })
    const [savedAdjustments, setSavedAdjustments] = useState({ otherDiscountRate: 0, otherLoadingRate: 0 })
    const [coverDays, setCoverDays] = useState(365)
    const [proportionRate, setProportionRate] = useState(100)
    const [exchangeRate, setExchangeRate] = useState(1)
    const [currency, setCurrency] = useState("NGN")
    // Amounts are in the policy's currency
    const formatCurrency = (amount: number | null | undefined) => formatMoney(amount, currency)
    const [remarks, setRemarks] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [busyKey, setBusyKey] = useState<string | null>(null)
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
    const [selectedKey, setSelectedKey] = useState<string | null>(null)
    const [isPrinting, setIsPrinting] = useState(false)

    const displayVehicles: any[] = vehicles || []
    const policyMatches = !!currentPolicy && (currentPolicy.proposalNo === policyNo || currentPolicy.policyNo === policyNo)
    const policyStartDate = policyMatches ? String(currentPolicy.startDate || "").split("T")[0] : ""
    const policyEndDate = policyMatches ? String(currentPolicy.endDate || "").split("T")[0] : ""
    const adjustmentsChanged =
        Number(adjustments.otherDiscountRate) !== Number(savedAdjustments.otherDiscountRate) ||
        Number(adjustments.otherLoadingRate) !== Number(savedAdjustments.otherLoadingRate)
    const breakdownMatches = !!calculationBreakdown && (!calculationBreakdown.proposalNo || calculationBreakdown.proposalNo === policyNo)

    // ===== loading =====

    useEffect(() => {
        dispatch(getMotorAdjustmentTypes() as any)
    }, [dispatch])

    // This page can be opened directly: make sure the policy (dates, share, currency) is loaded
    useEffect(() => {
        if (policyNo && !policyMatches) dispatch(getPolicyByNumber(policyNo))
    }, [dispatch, policyNo, policyMatches])

    // Terms come from the policy (saved calculations re-read theirs below)
    useEffect(() => {
        if (!policyMatches) return
        const days = inclusiveCoverDays(currentPolicy.startDate, currentPolicy.endDate)
        if (days) setCoverDays(days)
        setProportionRate(Number(currentPolicy.proportionRate) || 100)
        setExchangeRate(Number(currentPolicy.exRate) || 1)
        setCurrency(currentPolicy.exCurrency || "NGN")
    }, [policyMatches, currentPolicy?.startDate, currentPolicy?.endDate, currentPolicy?.proportionRate, currentPolicy?.exRate, currentPolicy?.exCurrency])

    const loadCalculation = async (detailID: string) => {
        const result = await dispatch(getMotorCalculationBreakdownByDetailID({ proposalNo: policyNo, detailID })).unwrap()
        dispatch(setMotorVehicles(convertMotorCalculationToVehicles(result as any)))
        dispatch(setCurrentMotorCalculation(result))
        if (result?.inputs) {
            const saved = {
                otherDiscountRate: Number(result.inputs.otherDiscountRate) || 0,
                otherLoadingRate: Number(result.inputs.otherLoadingRate) || 0,
            }
            setAdjustments(saved)
            setSavedAdjustments(saved)
            if (result.inputs.remarks) setRemarks(result.inputs.remarks)
        }
        return result
    }

    useEffect(() => {
        if (!policyNo) return
        let cancelled = false
        setIsLoading(true)
        // Never show another calculation's vehicles while this one loads
        dispatch(setMotorVehicles([]))
        dispatch(setCurrentMotorCalculation(null))
        setSelectedKey(null)
        setExpandedRows(new Set())
        ;(async () => {
            try {
                dispatch(getMotorCalculations(policyNo))
                if (urlDetailID) await loadCalculation(urlDetailID)
                else {
                    setAdjustments({ otherDiscountRate: 0, otherLoadingRate: 0 })
                    setSavedAdjustments({ otherDiscountRate: 0, otherLoadingRate: 0 })
                    setRemarks("")
                }
            } catch (err: any) {
                if (!cancelled) toast.error(`Could not load the calculation: ${errorMessage(err)}`)
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        })()
        return () => { cancelled = true }
    }, [policyNo, urlDetailID])

    // ===== saving =====

    /**
     * Saves the full vehicle list: updates this calculation (PUT, keyed by its detailID) or,
     * on a new calculation, creates it and opens it. Every vehicle keeps its certificate number.
     * Returns true when saved.
     */
    const persistVehicles = async (vehicleList: any[]): Promise<boolean> => {
        if (vehicleList.length === 0) {
            toast.warning("Add at least one vehicle")
            return false
        }
        const payload = {
            proposalNo: policyNo,
            vehicles: vehicleList.map((v, i) => toVehicleInput(v, i, { startDate: policyStartDate, endDate: policyEndDate })),
            otherDiscountRate: Number(adjustments.otherDiscountRate) || 0,
            otherLoadingRate: Number(adjustments.otherLoadingRate) || 0,
            proportionRate: proportionRate || 100,
            exchangeRate: exchangeRate || 1,
            currency: currency || "NGN",
            coverDays: coverDays || 365,
            calculatedBy: "SYSTEM",
            recalculatedBy: "SYSTEM",
            remarks: remarks || "Motor policy calculation",
        }

        setIsSaving(true)
        try {
            if (urlDetailID) {
                await dispatch(updateMotorCalculation({
                    detailID: urlDetailID,
                    calculationData: { ...payload, detailID: String(urlDetailID) },
                })).unwrap()
                await loadCalculation(urlDetailID)
                dispatch(getMotorCalculations(policyNo))
                dispatch(getPolicyByNumber(policyNo))
                toast.success("Calculation saved")
            } else {
                const result = await dispatch(createAdditionalMotorCalculation({
                    proposalNo: policyNo,
                    calculationData: payload,
                })).unwrap()
                toast.success("Calculation created")
                dispatch(getPolicyByNumber(policyNo))
                if (result?.detailID) {
                    navigate(`/underwriting/edit/${encodeURIComponent(policyNo)}/motor/${result.detailID}`, { replace: true })
                } else {
                    dispatch(getMotorCalculations(policyNo))
                }
            }
            return true
        } catch (err: any) {
            toast.error(`Could not save: ${errorMessage(err)}`)
            return false
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveVehicle = async (vehicle: any): Promise<boolean> => {
        const index = editingKey ? displayVehicles.findIndex((v, i) => vehicleKey(v, i) === editingKey) : -1
        const nextVehicles = index >= 0
            ? displayVehicles.map((v, i) => (i === index ? { ...vehicle, certificateNo: realCertificateNo(v) || vehicle.certificateNo } : v))
            : [...displayVehicles, vehicle]
        const saved = await persistVehicles(nextVehicles)
        if (saved) {
            setShowVehicleModal(false)
            setEditingKey(null)
        }
        return saved
    }

    const handleDeleteVehicle = async (key: string) => {
        const target = displayVehicles.find((v, i) => vehicleKey(v, i) === key)
        if (!target || !window.confirm(`Remove vehicle ${target.vehicleRegNo || ""}?`)) return
        const remaining = displayVehicles.filter((v, i) => vehicleKey(v, i) !== key)
        if (urlDetailID) {
            if (remaining.length === 0) {
                toast.warning("A calculation needs at least one vehicle. Add the replacement vehicle first, then remove this one.")
                return
            }
            setBusyKey(key)
            try {
                await persistVehicles(remaining)
            } finally {
                setBusyKey(null)
            }
        } else {
            dispatch(setMotorVehicles(remaining))
        }
        if (selectedKey === key) setSelectedKey(null)
    }

    // ===== certificate =====

    const selectedVehicle = displayVehicles.find((v, i) => vehicleKey(v, i) === selectedKey) || null

    const handlePrintCertificate = async () => {
        const certNo = realCertificateNo(selectedVehicle)
        if (!selectedVehicle) {
            toast.error("Select a vehicle using the checkbox")
            return
        }
        if (!certNo) {
            toast.error("This vehicle has no certificate number yet. Save the calculation first.")
            return
        }
        setIsPrinting(true)
        const toastId = toast.loading(`Generating certificate ${certNo}...`)
        const url = `https://goxireportsapi.newgibsonline.com/api/word-templates/tricycle-certificate?certificateNo=${encodeURIComponent(certNo)}`
        try {
            const response = await fetch(url)
            if (!response.ok) throw new Error(`Failed to generate certificate (HTTP ${response.status})`)
            const blobUrl = window.URL.createObjectURL(await response.blob())
            const link = document.createElement("a")
            link.href = blobUrl
            link.download = `Certificate-${certNo}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(blobUrl)
            toast.success("Certificate downloaded", { id: toastId })
        } catch (err: any) {
            window.open(url, "_blank")
            toast.success("Opened the certificate in a new tab", { id: toastId })
        } finally {
            setIsPrinting(false)
        }
    }

    const toggleRow = (key: string) =>
        setExpandedRows((prev) => {
            const next = new Set(prev)
            next.has(key) ? next.delete(key) : next.add(key)
            return next
        })

    const handleBackToList = () => navigate(`/underwriting/edit/${encodeURIComponent(policyNo)}/calculator`)

    const editingVehicle = editingKey ? displayVehicles.find((v, i) => vehicleKey(v, i) === editingKey) : undefined
    // Only a saved calculation has results (the store can still hold a previously opened one)
    const results = urlDetailID && breakdownMatches ? calculationBreakdown?.finalResults : null
    const proposalAdj = urlDetailID && breakdownMatches ? calculationBreakdown?.proposalAdjustments : null

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24 w-full">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                    <p className="text-gray-500 font-medium">Loading motor calculation...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-2 max-w-6xl mx-auto mb-10">
            <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-gray-200 gap-4 flex-wrap">
                <div>
                    <Button onClick={handleBackToList} variant="ghost" size="sm" className="mb-2">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Calculations
                    </Button>
                    <h1 className="text-3xl font-bold mb-2 text-gray-900">Motor Policy Calculator</h1>
                    <p className="text-gray-600 text-sm">
                        Policy: {policyNo}{urlDetailID ? ` · Calculation ${urlDetailID}` : " · New calculation"}
                    </p>
                </div>
                <Button
                    onClick={() => persistVehicles(displayVehicles)}
                    disabled={isSaving || displayVehicles.length === 0}
                >
                    {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : urlDetailID ? "Save Calculation" : "Create Calculation"}
                </Button>
            </div>

            <div className="flex flex-col gap-6">
                {/* Vehicles */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
                        <h3 className="text-xl font-semibold text-gray-900">Vehicles ({displayVehicles.length})</h3>
                        <div className="flex items-center gap-3 flex-wrap">
                            <Button onClick={() => setShowUploadModal(true)} variant="outline" size="sm"
                                className="flex items-center gap-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50" disabled={isSaving}>
                                <UploadCloud className="w-4 h-4" /> Upload Vehicles
                            </Button>
                            <Button onClick={handlePrintCertificate} disabled={!selectedKey || isPrinting} variant="outline" size="sm"
                                className="flex items-center gap-2 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50">
                                {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                                Print Certificate
                            </Button>
                            <Button onClick={() => { setEditingKey(null); setShowVehicleModal(true) }} size="sm" disabled={isSaving}>
                                Add Vehicle
                            </Button>
                        </div>
                    </div>

                    {displayVehicles.length === 0 ? (
                        <div className="text-center py-10 px-5 border-2 border-dashed border-gray-300 rounded-lg text-gray-600">
                            <p>No vehicles yet. Click "Add Vehicle" to begin.</p>
                            {!urlDetailID && <p className="text-sm text-gray-400 mt-2">Saving the first vehicle creates the calculation.</p>}
                        </div>
                    ) : (
                        <div className="pc-sections-table-wrap">
                            <table className="pc-sections-table">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>#</th>
                                        <th>Registration</th>
                                        <th>Cert No</th>
                                        <th>Type / Cover</th>
                                        <th className="pc-num">Value</th>
                                        <th className="pc-num">Adjustments</th>
                                        <th className="pc-num">Premium (annual)</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayVehicles.map((vehicle, index) => {
                                        const key = vehicleKey(vehicle, index)
                                        const cert = realCertificateNo(vehicle)
                                        const discount = Number(vehicle.step2_AfterDiscounts?.totalAdjustment ?? 0)
                                        const loading = Number(vehicle.step3_AfterLoadings?.totalAdjustment ?? 0)
                                        const premium = vehicle.step4_FinalPremium?.resultingAmount
                                        return (
                                            <tr key={key} className={selectedKey === key ? "bg-blue-50/70" : ""}>
                                                <td>
                                                    <input type="checkbox" className="w-4 h-4 cursor-pointer" checked={selectedKey === key}
                                                        onChange={() => setSelectedKey((p) => (p === key ? null : key))} />
                                                </td>
                                                <td>{index + 1}</td>
                                                <td className="font-medium">{vehicle.vehicleRegNo}</td>
                                                <td className="font-mono text-xs">{cert || <span className="text-gray-400 italic">on save</span>}</td>
                                                <td>
                                                    <div>{vehicle.vehicleType}</div>
                                                    <small className="text-gray-500">{vehicle.coverType}{vehicle.usage ? ` · ${vehicle.usage}` : ""}</small>
                                                </td>
                                                <td className="pc-num">{formatCurrency(vehicle.vehicleValue)}</td>
                                                <td className="pc-num">
                                                    {loading || discount ? (
                                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                                            {loading ? <span>+{formatCurrency(loading)}</span> : null}
                                                            {discount ? <span>−{formatCurrency(Math.abs(discount))}</span> : null}
                                                        </div>
                                                    ) : "—"}
                                                </td>
                                                <td className="pc-num"><strong>{premium != null ? formatCurrency(premium) : "—"}</strong></td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="outline" disabled={isSaving}
                                                            onClick={() => { setEditingKey(key); setShowVehicleModal(true) }}>
                                                            Edit
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50"
                                                            disabled={isSaving} onClick={() => handleDeleteVehicle(key)}>
                                                            {busyKey === key ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Policy-level adjustments and terms */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Policy Adjustments &amp; Terms</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col gap-4">
                            <p className="text-sm text-gray-500">Applied to the vehicles' total: the discount first, then the loading.</p>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="otherDiscountRate">Other Discount (%)</Label>
                                <Input id="otherDiscountRate" type="number" min="0" max="100" step="0.01"
                                    value={adjustments.otherDiscountRate}
                                    onChange={(e) => setAdjustments((p) => ({ ...p, otherDiscountRate: e.target.value === "" ? "" : Number(e.target.value) }))} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="otherLoadingRate">Other Loading (%)</Label>
                                <Input id="otherLoadingRate" type="number" min="0" step="0.01"
                                    value={adjustments.otherLoadingRate}
                                    onChange={(e) => setAdjustments((p) => ({ ...p, otherLoadingRate: e.target.value === "" ? "" : Number(e.target.value) }))} />
                            </div>
                            {adjustmentsChanged && displayVehicles.length > 0 && (
                                <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                                    Changed — click "{urlDetailID ? "Save Calculation" : "Create Calculation"}" to apply.
                                </div>
                            )}
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <p className="text-sm text-gray-500 mb-3">From the policy.</p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><Label>Cover Days</Label><div className="font-medium">{coverDays}{coverDays >= 365 ? " (full annual premium)" : " (pro-rated)"}</div></div>
                                <div><Label>Our Share</Label><div className="font-medium">{proportionRate}%</div></div>
                                <div><Label>Currency</Label><div className="font-medium">{currency}</div></div>
                                <div><Label>Exchange Rate</Label><div className="font-medium">{exchangeRate}</div></div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <Input id="remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Remarks for this calculation" />
                    </div>
                </div>

                {/* Results (saved calculation) */}
                {results && (
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex w-full justify-between mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">Calculation Results</h3>
                            <Button onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)} variant="outline" size="sm">
                                {showDetailedBreakdown ? "Hide Vehicle Breakdown" : "Show Vehicle Breakdown"}
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div><Label>Total Sum Insured (100%)</Label><div className="text-lg font-bold">{formatCurrency(results.totalVehicleValue)}</div></div>
                            <div><Label>Vehicles Premium (annual)</Label><div className="text-lg font-bold">{formatCurrency(results.totalNetPremium)}</div></div>
                            <div>
                                <Label>After Policy Adjustments</Label>
                                <div className="text-lg font-bold">{formatCurrency(results.netPremiumAfterProposalAdjustments)}</div>
                                {proposalAdj && (Number(proposalAdj.otherDiscountAmount) > 0 || Number(proposalAdj.otherLoadingAmount) > 0) && (
                                    <small className="text-gray-500">
                                        −{formatCurrency(proposalAdj.otherDiscountAmount)} discount, +{formatCurrency(proposalAdj.otherLoadingAmount)} loading
                                    </small>
                                )}
                            </div>
                            <div><Label>Our Share of Sum Insured</Label><div className="text-lg font-bold">{formatCurrency(results.shareSumInsured)}</div></div>
                            <div>
                                <Label>Premium Due (our share{coverDays < 365 ? ", pro-rated" : ""})</Label>
                                <div className="text-lg font-bold text-indigo-700">{formatCurrency(results.finalPremiumDue ?? results.sharePremium)}</div>
                            </div>
                            {isForeignCurrency(currency) && (
                                <div>
                                    <Label>Premium in Naira (× {exchangeRate})</Label>
                                    <div className="text-lg font-bold">{formatMoney(results.foreignPremium)}</div>
                                </div>
                            )}
                        </div>

                        {showDetailedBreakdown && calculationBreakdown?.vehicleCalculations?.length > 0 && (
                            <div className="mt-6 overflow-x-auto rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            <th className="px-4 py-3 w-10"></th>
                                            <th className="px-4 py-3 text-left">Reg No</th>
                                            <th className="px-4 py-3 text-right">Basic</th>
                                            <th className="px-4 py-3 text-right">Discounts</th>
                                            <th className="px-4 py-3 text-right">Loadings</th>
                                            <th className="px-4 py-3 text-right">Costs</th>
                                            <th className="px-4 py-3 text-right">Premium</th>
                                        </tr>
                                    </thead>
                                    {calculationBreakdown.vehicleCalculations.map((v: any, i: number) => {
                                        const key = vehicleKey(v, i)
                                        const steps = [v.step2_AfterDiscounts, v.step3_AfterLoadings, v.step4_FinalPremium]
                                        return (
                                            <tbody key={key}>
                                                <tr className="border-b hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <Button variant="ghost" size="sm" onClick={() => toggleRow(key)} className="h-8 w-8 p-0">
                                                            <ChevronDown className={`h-4 w-4 transition-transform ${expandedRows.has(key) ? "rotate-180" : ""}`} />
                                                        </Button>
                                                    </td>
                                                    <td className="px-4 py-3">{v.vehicleRegNo}</td>
                                                    <td className="px-4 py-3 text-right">{formatCurrency(v.step1_BasicPremium?.resultingAmount)}</td>
                                                    <td className="px-4 py-3 text-right">{formatCurrency(Math.abs(Number(v.step2_AfterDiscounts?.totalAdjustment) || 0))}</td>
                                                    <td className="px-4 py-3 text-right">{formatCurrency(v.step3_AfterLoadings?.totalAdjustment)}</td>
                                                    <td className="px-4 py-3 text-right">{formatCurrency(v.step4_FinalPremium?.totalAdjustment)}</td>
                                                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(v.step4_FinalPremium?.resultingAmount)}</td>
                                                </tr>
                                                {expandedRows.has(key) && (
                                                    <tr className="border-b bg-gray-50/60">
                                                        <td></td>
                                                        <td colSpan={6} className="px-4 py-3 text-xs text-gray-600">
                                                            <div>{v.step1_BasicPremium?.formula}</div>
                                                            {steps.flatMap((s: any) => s?.adjustments || []).map((a: any, j: number) => (
                                                                <div key={j}>{a.name}: {formulaInCurrency(a.formula, currency) || formatCurrency(a.amount)}</div>
                                                            ))}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        )
                                    })}
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showVehicleModal && (
                <AddPolicyVehicleModal
                    isOpen={showVehicleModal}
                    onClose={() => { setShowVehicleModal(false); setEditingKey(null) }}
                    onSave={handleSaveVehicle}
                    vehicle={editingVehicle}
                    currency={currency}
                    defaultStartDate={policyStartDate}
                    defaultEndDate={policyEndDate}
                    nextItemNo={displayVehicles.length + 1}
                />
            )}

            {showUploadModal && (
                <UploadMotorVehiclesModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    existingCount={displayVehicles.length}
                    // Saved with the rest of THIS calculation (not the API's upload endpoint, which
                    // targets the policy's first calculation / clears all of the policy's motor data)
                    onImport={(imported, mode) =>
                        persistVehicles(mode === "replace" ? imported : [...displayVehicles, ...imported])}
                />
            )}
        </div>
    )
}
