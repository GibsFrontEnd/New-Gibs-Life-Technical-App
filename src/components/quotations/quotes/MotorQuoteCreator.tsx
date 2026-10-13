// //@ts-nocheck
// //@ts-nocheck
// // @ts-nocheck
// "use client"

// import { useEffect, useState } from "react"
// import { useDispatch, useSelector } from "react-redux"
// import type { AppDispatch, RootState } from "../../../features/store"
// import { Button } from "../../../components/ui/new-button"
// import Input from "../../../components/ui/Input"
// import { Label } from "../../../components/ui/label"
// import { AddVehicleModal } from "../../../components/Modals/AddVehicleModal"
// import { toast } from "../../../components/ui/use-toast"
// import type { MotorVehicleUI, MotorCalculationRequest } from "../../../types/motor-quotation"
// import {
//     calculateMotorComplete,
//     recalculateMotorComplete,
//     getMotorCalculationBreakdown,
//     addVehicle,
//     updateVehicle,
//     removeVehicle,
// } from "../../../features/reducers/quoteReducers/motorQuotationSlice"
// import "./QuoteCreator.css"
// import { useNavigate, useParams } from "react-router-dom"
// import { ChevronDown } from "lucide-react"
// import StepDetails from "./StepDetails"

// export default function MotorQuoteCreator() {
//     const { proposalNo } = useParams<{ proposalNo: string }>()
//     const navigate = useNavigate()
//     const dispatch = useDispatch<AppDispatch>()

//     const { vehicles, currentCalculation, calculationBreakdown, hasCalculated, loading, error, success } = useSelector(
//         (state: RootState) => state.motorQuotations,
//     )
//     const [adjCollapse, setAdjCollapse] = useState(true)
//     const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false)
//     const [showAddVehicleModal, setShowAddVehicleModal] = useState(false)
//     const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null)
//     const [adjustments, setAdjustments] = useState({
//         otherDiscountRate: 0,
//         otherLoadingRate: 0,
//     })
//     const [coverDays, setCoverDays] = useState(365)
//     const [proportionRate, setProportionRate] = useState(100)
//     const [exchangeRate, setExchangeRate] = useState(1)
//     const [currency, setCurrency] = useState("NGN")

//     useEffect(() => {
//         if (proposalNo) {
//             dispatch(getMotorCalculationBreakdown(proposalNo))
//         }
//     }, [dispatch, proposalNo])

//     const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

//     const toggleRow = (itemNo: number) => {
//         const newExpanded = new Set(expandedRows)
//         if (newExpanded.has(itemNo)) {
//             newExpanded.delete(itemNo)
//         } else {
//             newExpanded.add(itemNo)
//         }
//         setExpandedRows(newExpanded)
//     }

//     const handleAddVehicle = () => {
//         setEditingVehicleId(null)
//         setShowAddVehicleModal(true)
//     }

//     const handleEditVehicle = (vehicleId: string) => {
//         setEditingVehicleId(vehicleId)
//         setShowAddVehicleModal(true)
//     }

//     const handleSaveVehicle = (vehicle: MotorVehicleUI) => {
//         if (editingVehicleId) {
//             dispatch(updateVehicle(vehicle))
//         } else {
//             dispatch(addVehicle(vehicle))
//         }
//         // if (proposalNo) {
//         //     dispatch(getMotorCalculationBreakdown(proposalNo))
//         // }
//         setShowAddVehicleModal(false)
//         setEditingVehicleId(null)
//         toast({
//             description: editingVehicleId ? "Vehicle updated" : "Vehicle added",
//             variant: "success",
//             duration: 2000,
//         })
//     }

//     const handleDeleteVehicle = (vehicleId: string) => {
//         if (window.confirm("Are you sure you want to delete this vehicle?")) {
//             dispatch(removeVehicle(vehicleId))
//             toast({
//                 description: "Vehicle deleted",
//                 variant: "success",
//                 duration: 2000,
//             })
//         }
//     }

//     const handleCalculate = async () => {
//         if (vehicles.length === 0) {
//             toast({
//                 description: "Please add at least one vehicle",
//                 variant: "warning",
//                 duration: 2000,
//             })
//             return
//         }

//         const calculationRequest: MotorCalculationRequest = {
//             proposalNo: proposalNo || "",
//             vehicles: vehicles.map(({ _collapsed, _showDetails, uiId, ...v }) => v),
//             otherDiscountRate: adjustments.otherDiscountRate,
//             otherLoadingRate: adjustments.otherLoadingRate,
//             proportionRate,
//             exchangeRate,
//             currency,
//             coverDays,
//             calculatedBy: "SYSTEM",
//         }

//         try {
//             if (!hasCalculated) {
//                 await dispatch(
//                     recalculateMotorComplete({
//                         proposalNo: proposalNo || "",
//                         calculationData: calculationRequest,
//                     }) as any,
//                 ).unwrap()
//             } else {
//                 await dispatch(
//                     calculateMotorComplete({
//                         proposalNo: proposalNo || "",
//                         calculationData: calculationRequest,
//                     }) as any,
//                 ).unwrap()
//             }

//             // Refresh breakdown
//             if (proposalNo) {
//                 await dispatch(getMotorCalculationBreakdown(proposalNo) as any)
//             }

//             toast({
//                 description: "Calculation completed successfully",
//                 variant: "success",
//                 duration: 2000,
//             })
//         } catch (err: any) {
//             toast({
//                 description: "Calculation failed",
//                 variant: "destructive",
//                 duration: 2000,
//             })
//         }
//     }

//     const handleCancel = () => {
//         navigate("/quotations")
//     }

//     const formatCurrency = (amount: number | null | undefined) => {
//         if (amount === null || amount === undefined) return "N/A"
//         return new Intl.NumberFormat("en-NG", {
//             style: "currency",
//             currency: "NGN",
//         }).format(amount)
//     }

//     const getDisplayVehicles = () => {
//         return vehicles
//     }

//     const displayVehicles = getDisplayVehicles()

//     return (
//         <div className="p-2 max-w-6xl mx-auto mb-10">
//             <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-gray-200">
//                 <div>
//                     <h1 className="text-3xl font-bold mb-2 text-gray-900">Motor Quote Creator</h1>
//                     <p className="text-gray-600 text-sm">Proposal: {proposalNo || "New"}</p>
//                 </div>
//                 <div className="flex gap-3">
//                     <Button onClick={handleCancel} variant="outline">
//                         Back to Proposals
//                     </Button>
//                     <Button onClick={handleCalculate} disabled={loading?.calculate || vehicles.length === 0}>
//                         {loading?.calculate ? "Calculating..." : !hasCalculated ? "Recalculate" : "Calculate"}
//                     </Button>
//                 </div>
//             </div>

//             {error?.calculate && (
//                 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error.calculate}</div>
//             )}
//             {success?.calculate && (
//                 <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
//                     Calculation completed successfully!
//                 </div>
//             )}

//             <div className="flex flex-col gap-6">
//                 {/* Vehicles Panel */}
//                 <div className="bg-white border border-gray-200 rounded-lg p-6">
//                     <div className="flex justify-between items-center mb-6">
//                         <h3 className="text-xl font-semibold text-gray-900">Vehicles ({displayVehicles.length})</h3>
//                         <Button onClick={handleAddVehicle} size="sm">
//                             Add Vehicle
//                         </Button>
//                     </div>

//                     {displayVehicles.length === 0 ? (
//                         <div className="text-center py-10 px-5 border-2 border-dashed border-gray-300 rounded-lg text-gray-600">
//                             <p>No vehicles added yet. Click "Add Vehicle" to begin.</p>
//                         </div>
//                     ) : (
//                         <div className="overflow-x-auto">
//                             <table className="w-full border-collapse text-sm bg-white">
//                                 <thead>
//                                     <tr className="bg-gray-100 border-b-2 border-gray-300">
//                                         <th className="px-3 py-3 text-left font-semibold text-gray-900">#</th>
//                                         <th className="px-3 py-3 text-left font-semibold text-gray-900">Registration</th>
//                                         <th className="px-3 py-3 text-left font-semibold text-gray-900">Vehicle Type</th>
//                                         <th className="px-3 py-3 text-left font-semibold text-gray-900">Cover Type</th>
//                                         <th className="px-3 py-3 text-left font-semibold text-gray-900">Value</th>
//                                         <th className="px-3 py-3 text-left font-semibold text-gray-900">Premium</th>
//                                         <th className="px-3 py-3 text-left font-semibold text-gray-900">Actions</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {displayVehicles.map((vehicle, index) => (
//                                         <tr key={vehicle.uiId || vehicle.itemNo} className="border-b border-gray-200 hover:bg-gray-50">
//                                             <td className="px-3 py-3 text-gray-900">{index + 1}</td>
//                                             <td className="px-3 py-3 text-gray-900">{vehicle.vehicleRegNo}</td>
//                                             <td className="px-3 py-3 text-gray-900">{vehicle.vehicleType}</td>
//                                             <td className="px-3 py-3 text-gray-900">{vehicle.coverType}</td>
//                                             <td className="px-3 py-3 text-gray-900">{formatCurrency(vehicle.vehicleValue)}</td>
//                                             <td className="px-3 py-3 text-gray-900">
//                                                 {hasCalculated && vehicle.step4_FinalPremium?.resultingAmount
//                                                     ? formatCurrency(vehicle.step4_FinalPremium?.resultingAmount)
//                                                     : hasCalculated
//                                                         ? "—"
//                                                         : "Pending"}
//                                             </td>
//                                             <td className="px-3 py-3">
//                                                 <div className="flex gap-2">
//                                                     <Button onClick={() => handleEditVehicle(vehicle.uiId || "")} size="sm" variant="outline">
//                                                         Edit
//                                                     </Button>
//                                                     <Button
//                                                         onClick={() => handleDeleteVehicle(vehicle.uiId || "")}
//                                                         size="sm"
//                                                         variant="outline"
//                                                         className="text-red-600 border-red-600"
//                                                     >
//                                                         Delete
//                                                     </Button>
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                     )}
//                 </div>

//                 {/* Adjustments Panel */}
//                 <div className="bg-white border border-gray-200 rounded-lg p-6">
//                     <h3 className="flex justify-between items-center text-xl font-semibold text-gray-900 mb-6">
//                         <span>Proposal Adjustments</span>
//                         <button
//                             className="text-blue-600 hover:text-blue-800 text-sm font-medium"
//                             onClick={() => setAdjCollapse(!adjCollapse)}
//                             aria-label={adjCollapse ? "Expand item" : "Collapse item"}
//                         >
//                             {adjCollapse ? "Expand ▾" : "Collapse ▴"}
//                         </button>
//                     </h3>

//                     {!adjCollapse && (
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                             <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
//                                 <h4 className="font-semibold text-gray-900 mb-4">Discounts & Loadings</h4>

//                                 <div className="flex flex-col gap-4 mb-4">
//                                     <div className="flex flex-col gap-2">
//                                         <Label htmlFor="otherDiscountRate">Other Discount Rate (%)</Label>
//                                         <Input
//                                             id="otherDiscountRate"
//                                             type="number"
//                                             min="0"
//                                             max="100"
//                                             step="0.01"
//                                             value={adjustments.otherDiscountRate}
//                                             onChange={(e) =>
//                                                 setAdjustments((prev) => ({
//                                                     ...prev,
//                                                     otherDiscountRate: Number(e.target.value),
//                                                 }))
//                                             }
//                                         />
//                                     </div>

//                                     <div className="flex flex-col gap-2">
//                                         <Label htmlFor="otherLoadingRate">Other Loading Rate (%)</Label>
//                                         <Input
//                                             id="otherLoadingRate"
//                                             type="number"
//                                             min="0"
//                                             max="100"
//                                             step="0.01"
//                                             value={adjustments.otherLoadingRate}
//                                             onChange={(e) =>
//                                                 setAdjustments((prev) => ({
//                                                     ...prev,
//                                                     otherLoadingRate: Number(e.target.value),
//                                                 }))
//                                             }
//                                         />
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
//                                 <h4 className="font-semibold text-gray-900 mb-4">Coverage Details</h4>

//                                 <div className="flex flex-col gap-4">
//                                     <div className="flex flex-col gap-2">
//                                         <Label htmlFor="coverDays">Cover Days</Label>
//                                         <Input
//                                             id="coverDays"
//                                             type="number"
//                                             disabled
//                                             min="0"
//                                             value={coverDays}
//                                             onChange={(e) => setCoverDays(Number(e.target.value))}
//                                         />
//                                     </div>

//                                     <div className="flex flex-col gap-2">
//                                         <Label htmlFor="proportionRate">Proportion Rate (%)</Label>
//                                         <Input
//                                             id="proportionRate"
//                                             type="number"
//                                             min="0"
//                                             disabled
//                                             max="100"
//                                             step="0.01"
//                                             value={proportionRate}
//                                             onChange={(e) => setProportionRate(Number(e.target.value))}
//                                         />
//                                     </div>

//                                     <div className="flex flex-col gap-2">
//                                         <Label htmlFor="exchangeRate">Exchange Rate</Label>
//                                         <Input
//                                             id="exchangeRate"
//                                             type="number"
//                                             min="0"
//                                             step="0.01"
//                                             value={exchangeRate}
//                                             onChange={(e) => setExchangeRate(Number(e.target.value))}
//                                         />
//                                     </div>

//                                     <div className="flex flex-col gap-2">
//                                         <Label htmlFor="currency">Currency</Label>
//                                         <Input
//                                             id="currency"
//                                             value={currency}
//                                             onChange={(e) => setCurrency(e.target.value)}
//                                             placeholder="e.g., NGN"
//                                         />
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     )}
//                 </div>

//                 {/* Calculation Results */}
//                 {hasCalculated && calculationBreakdown && (
//                     <div className="bg-white border border-gray-200 rounded-lg p-6">
//                         <div className="flex w-full justify-between">
//                             <h3 className="text-xl font-semibold text-gray-900 mb-6">Calculation Results</h3>
//                             {calculationBreakdown && (
//                                 <Button onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)} variant="outline" size="sm">
//                                     {showDetailedBreakdown ? "Show Summary" : "Show Detailed Breakdown"}
//                                 </Button>
//                             )}
//                         </div>

//                         {!showDetailedBreakdown ? (
//                             <>
//                                 <div className="qc-results-grid">
//                                     {/* <div className="qc-result-item">
//                                         <Label>Total Sum Insured</Label>
//                                         <div className="qc-result-value">{formatCurrency(calculationBreakdown.finalResults.)}</div>
//                                     </div> */}
//                                     <div className="qc-result-item">
//                                         <Label>Total Premium</Label>
//                                         <div className="qc-result-value">{formatCurrency(calculationBreakdown.finalResults.totalNetPremium)}</div>
//                                     </div>
//                                     <div className="qc-result-item">
//                                         <Label>Net Premium</Label>
//                                         <div className="qc-result-value">{formatCurrency(calculationBreakdown.finalResults.netPremiumAfterProposalAdjustments)}</div>
//                                     </div>
//                                     <div className="qc-result-item">
//                                         <Label>Pro-Rata Premium</Label>
//                                         <div className="qc-result-value">{formatCurrency(calculationBreakdown.finalResults.proRataPremium)}</div>
//                                     </div>
//                                     <div className="qc-result-item">
//                                         <Label>Share Sum Insured</Label>
//                                         <div className="qc-result-value">{formatCurrency(calculationBreakdown.finalResults.shareSumInsured)}</div>
//                                     </div>
//                                     <div className="qc-result-item">
//                                         <Label>Share Premium</Label>
//                                         <div className="qc-result-value">{formatCurrency(calculationBreakdown.finalResults.sharePremium)}</div>
//                                     </div>
//                                 </div>
//                                 {/* {currentCalculation.validationErrors && currentCalculation.validationErrors.length > 0 && (
//                                     <div className="qc-validation-errors">
//                                         <h4>Validation Issues:</h4>
//                                         <ul>
//                                             {currentCalculation.validationErrors.map((err: any, idx: number) => (
//                                                 <li key={idx}>{err}</li>
//                                             ))}
//                                         </ul>
//                                     </div>
//                                 )} */}
//                             </>
//                         ) : (
//                             calculationBreakdown && (
//                                 <div className="qc-detailed-breakdown">
//                                     {/* Calculation Metadata */}
//                                     <div className="qc-breakdown-section">
//                                         <h4>Calculation Information</h4>
//                                         <div className="qc-info-grid">
//                                             <div className="qc-info-item">
//                                                 <Label>Calculated On</Label>
//                                                 <div className="qc-info-value">
//                                                     {calculationBreakdown.calculatedOn ? new Date(calculationBreakdown.calculatedOn).toLocaleString() : "N/A"}
//                                                 </div>
//                                             </div>
//                                             <div className="qc-info-item">
//                                                 <Label>Calculated By</Label>
//                                                 <div className="qc-info-value">{calculationBreakdown.calculatedBy || "N/A"}</div>
//                                             </div>
//                                             {/* <div className="qc-info-item">
//                                                 <Label>Type</Label>
//                                                 <div className="qc-info-value">{calculationBreakdown.calculationType || "N/A"}</div>
//                                             </div> */}
//                                         </div>
//                                     </div>

//                                     {/* Show inputs if present */}
//                                     {calculationBreakdown.inputs && (
//                                         <div className="qc-breakdown-section">
//                                             <h4>Calculation Inputs</h4>
//                                             <div className="qc-info-grid !grid-cols-5">
//                                                 <div className="qc-info-item">
//                                                     <Label>Proportion Rate</Label>
//                                                     <div className="qc-info-value">{calculationBreakdown.inputs.proportionRate ?? "N/A"}%</div>
//                                                 </div>
//                                                 <div className="qc-info-item">
//                                                     <Label>Exchange Rate</Label>
//                                                     <div className="qc-info-value">{calculationBreakdown.inputs.exchangeRate ?? "N/A"}</div>
//                                                 </div>
//                                                 <div className="qc-info-item">
//                                                     <Label>Currency</Label>
//                                                     <div className="qc-info-value">{calculationBreakdown.inputs.currency ?? "N/A"}</div>
//                                                 </div>
//                                                 <div className="qc-info-item">
//                                                     <Label>Cover Days</Label>
//                                                     <div className="qc-info-value">{calculationBreakdown.inputs.coverDays ?? "N/A"}</div>
//                                                 </div>
//                                                 <div className="qc-info-item">
//                                                     <Label>Vehicle Count</Label>
//                                                     <div className="qc-info-value">{calculationBreakdown.inputs.vehicleCount ?? "N/A"}</div>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     )}


//                                     <div className="overflow-x-auto rounded-lg border border-border">
//                                         <table className="w-full">
//                                             <thead>
//                                                 <tr className="border-b border-border bg-muted">
//                                                     <th className="px-6 py-3 text-left text-sm font-semibold text-foreground w-12"></th>
//                                                     {/* <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Item</th> */}
//                                                     <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Reg No</th>
//                                                     {/* <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Certificate No</th> */}
//                                                     <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Vehicle Type</th>
//                                                     <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Cover Type</th>
//                                                     <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Vehicle Value</th>
//                                                     <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Premium Rate</th>
//                                                     <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Final Premium</th>
//                                                 </tr>
//                                             </thead>
//                                             {/* <tbody> */}
//                                             {calculationBreakdown.vehicleCalculations.map((calculation) => (
//                                                 <tbody key={calculation.itemNo}>
//                                                     <tr className="border-b border-border hover:bg-muted/50 transition-colors">
//                                                         <td className="px-6 py-4">
//                                                             <Button
//                                                                 variant="ghost"
//                                                                 size="sm"
//                                                                 onClick={() => toggleRow(calculation.itemNo)}
//                                                                 className="h-8 w-8 p-0"
//                                                             >
//                                                                 <ChevronDown
//                                                                     className={`h-4 w-4 transition-transform ${expandedRows.has(calculation.itemNo) ? "rotate-180" : ""
//                                                                         }`}
//                                                                 />
//                                                             </Button>
//                                                         </td>
//                                                         {/* <td className="px-6 py-4 text-sm text-foreground">{calculation.itemNo}</td> */}
//                                                         <td className="px-6 py-4 text-sm text-foreground">{calculation.vehicleRegNo}</td>
//                                                         {/* <td className="px-6 py-4 text-sm text-foreground font-mono">{calculation.certificateNo}</td> */}
//                                                         <td className="px-6 py-4 text-sm text-foreground">{calculation.vehicleType}</td>
//                                                         <td className="px-6 py-4 text-sm text-foreground">{calculation.coverType}</td>
//                                                         <td className="px-6 py-4 text-sm text-foreground text-right">
//                                                             {formatCurrency(calculation.vehicleValue)}
//                                                         </td>
//                                                         <td className="px-6 py-4 text-sm text-foreground text-right">{calculation.premiumRate}%</td>
//                                                         <td className="px-6 py-4 text-sm font-semibold text-foreground text-right">
//                                                             {formatCurrency(calculation.step4_FinalPremium?.resultingAmount)}
//                                                         </td>
//                                                     </tr>
//                                                     {expandedRows.has(calculation.itemNo) && (
//                                                         <tr className="border-b border-border bg-muted/30">
//                                                             <td colSpan={9} className="px-6 py-4">
//                                                                 <StepDetails calculation={calculation} />
//                                                             </td>
//                                                         </tr>
//                                                     )}
//                                                 </tbody>
//                                             ))}
//                                             {/* </tbody> */}
//                                         </table>
//                                     </div>

//                                     {/* Final Results Summary */}
//                                     {calculationBreakdown.finalResults && (
//                                         <div className="qc-breakdown-section qc-final-results">
//                                             <h4>Final Results Summary</h4>
//                                             <div className="qc-results-grid">
//                                                 {/* <div className="qc-result-item">
//                                                     <Label>Total Sum Insured</Label>
//                                                     <div className="qc-result-value">
//                                                         {formatCurrency(calculationBreakdown.finalResults.)}
//                                                     </div>
//                                                 </div> */}
//                                                 <div className="qc-result-item">
//                                                     <Label>Total Premium</Label>
//                                                     <div className="qc-result-value">{formatCurrency(calculationBreakdown.finalResults.sharePremium)}</div>
//                                                 </div>
//                                                 <div className="qc-result-item">
//                                                     <Label>Net Premium</Label>
//                                                     <div className="qc-result-value">{formatCurrency(calculationBreakdown.finalResults.totalNetPremium)}</div>
//                                                 </div>
//                                                 <div className="qc-result-item">
//                                                     <Label>Pro-Rata Premium</Label>
//                                                     <div className="qc-result-value">{formatCurrency(calculationBreakdown.finalResults.proRataPremium)}</div>
//                                                 </div>
//                                                 <div className="qc-result-item">
//                                                     <Label>Share Sum Insured</Label>
//                                                     <div className="qc-result-value">
//                                                         {formatCurrency(calculationBreakdown.finalResults.shareSumInsured)}
//                                                     </div>
//                                                 </div>
//                                                 <div className="qc-result-item">
//                                                     <Label>Share Premium</Label>
//                                                     <div className="qc-result-value">{formatCurrency(calculationBreakdown.finalResults.sharePremium)}</div>
//                                                 </div>
//                                                 <div className="qc-result-item">
//                                                     <Label>Foreign Sum Insured</Label>
//                                                     <div className="qc-result-value">
//                                                         {formatCurrency(calculationBreakdown.finalResults.foreignSumInsured)}{" "}
//                                                         {calculationBreakdown.finalResults.foreignCurrency}
//                                                     </div>
//                                                 </div>
//                                                 <div className="qc-result-item">
//                                                     <Label>Foreign Premium</Label>
//                                                     <div className="qc-result-value">
//                                                         {formatCurrency(calculationBreakdown.finalResults.foreignPremium)}{" "}
//                                                         {calculationBreakdown.finalResults.foreignCurrency}
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     )}
//                                 </div>
//                             )
//                         )}
//                     </div>
//                 )}
//             </div>

//             {showAddVehicleModal && (
//                 <AddVehicleModal
//                     isOpen={showAddVehicleModal}
//                     onClose={() => {
//                         setShowAddVehicleModal(false)
//                         setEditingVehicleId(null)
//                     }}
//                     onSave={handleSaveVehicle}
//                     vehicle={editingVehicleId ? vehicles.find((v) => v.uiId === editingVehicleId) : undefined}
//                 />
//             )}
//         </div>
//     )
// }
