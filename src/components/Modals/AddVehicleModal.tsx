//@ts-nocheck
//@ts-nocheck
// @ts-nocheck
"use client"

import { useEffect, useState, useRef } from "react"
import { useDispatch } from "react-redux"
import type { AppDispatch } from "../../features/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/new-button"
import { Input } from "../ui/new-input"
import { Label } from "../ui/label"
import { toast } from "../ui/use-toast"
import type { MotorVehicleUI, MotorAdjustment } from "../../types/motor-quotation"
import {
    calculateBasicPremium,
    applyDiscounts,
    applyLoadings,
    calculateFinalPremium,
} from "../../features/reducers/quoteReducers/motorQuotationSlice"

interface AddVehicleModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (vehicle: MotorVehicleUI) => void
    vehicle?: MotorVehicleUI
}

export const AddVehicleModal = ({ isOpen, onClose, onSave, vehicle }: AddVehicleModalProps) => {
    const dispatch = useDispatch<AppDispatch>()
    const [calculatingStep, setCalculatingStep] = useState<string | null>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    const initialForm = (): MotorVehicleUI => ({
        itemNo: vehicle?.itemNo ?? 1,
        vehicleRegNo: vehicle?.vehicleRegNo ?? "",
        vehicleUser: vehicle?.vehicleUser ?? "",
        vehicleType: vehicle?.vehicleType ?? "",
        vehicleMake: vehicle?.vehicleMake ?? "",
        vehicleModel: vehicle?.vehicleModel ?? "",
        chassisNo: vehicle?.chassisNo ?? "",
        engineNo: vehicle?.engineNo ?? "",
        color: vehicle?.color ?? "",
        modelYear: vehicle?.modelYear ?? new Date().getFullYear(),
        coverType: vehicle?.coverType ?? "Comprehensive",
        usage: vehicle?.usage ?? "Private",
        vehicleValue: vehicle?.vehicleValue ?? 0,
        premiumRate: vehicle?.premiumRate ?? 0,
        state: vehicle?.state ?? "",
        seatCapacity: vehicle?.seatCapacity ?? 0,
        waxCode: vehicle?.waxCode ?? "",
        location: vehicle?.location ?? "",
        startDate: vehicle?.startDate ?? new Date().toISOString().split("T")[0],
        endDate: vehicle?.endDate ?? new Date().toISOString().split("T")[0],
        trackingCost: vehicle?.trackingCost ?? 0,
        rescueCost: vehicle?.rescueCost ?? 0,
        discounts: vehicle?.discounts ?? [],
        loadings: vehicle?.loadings ?? [],
        _collapsed: false,
        _showDetails: false,
        uiId: vehicle?.uiId ?? `vehicle_${Date.now()}`,
    })

    const [formData, setFormData] = useState<MotorVehicleUI>(initialForm())
    const [calculatedPremium, setCalculatedPremium] = useState<{
        basicPremium?: number
        premiumAfterDiscounts?: number
        grossPremium?: number
        netPremium?: number
    }>({})

    useEffect(() => {
        if (vehicle) {
            setFormData(initialForm())
        }
    }, [vehicle])

    const handleInputChange = (field: keyof MotorVehicleUI, value: any) => {
        const numeric = ["vehicleValue", "premiumRate", "seatCapacity", "trackingCost", "rescueCost", "modelYear"]
        const parsed = numeric.includes(field as string) ? (value === "" ? 0 : Number(value)) : value
        setFormData((prev) => ({ ...prev, [field]: parsed }))
    }

    const handleAddDiscount = () => {
        const newDiscount: MotorAdjustment = {
            adjustmentName: "",
            adjustmentType: "Discount",
            rate: 0,
            appliedOn: "Premium",
            baseAmount: 0,
            amount: 0,
            sequenceOrder: formData.discounts.length + 1,
            formula: "",
        }
        setFormData((prev) => ({
            ...prev,
            discounts: [...prev.discounts, newDiscount],
        }))
    }

    const handleAddLoading = () => {
        const newLoading: MotorAdjustment = {
            adjustmentName: "",
            adjustmentType: "Loading",
            rate: 0,
            appliedOn: "SumInsured",
            baseAmount: 0,
            amount: 0,
            sequenceOrder: formData.loadings.length + 1,
            formula: "",
        }
        setFormData((prev) => ({
            ...prev,
            loadings: [...prev.loadings, newLoading],
        }))
    }

    const handleRemoveDiscount = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            discounts: prev.discounts.filter((_, i) => i !== index),
        }))
    }

    const handleRemoveLoading = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            loadings: prev.loadings.filter((_, i) => i !== index),
        }))
    }

    const handleAdjustmentChange = (
        type: "discount" | "loading",
        index: number,
        field: keyof MotorAdjustment,
        value: any,
    ) => {
        const numeric = ["rate", "baseAmount", "amount", "sequenceOrder"]
        const parsed = numeric.includes(field as string) ? (value === "" ? 0 : Number(value)) : value

        if (type === "discount") {
            const updated = [...formData.discounts]
            updated[index] = { ...updated[index], [field]: parsed }
            setFormData((prev) => ({ ...prev, discounts: updated }))
        } else {
            const updated = [...formData.loadings]
            updated[index] = { ...updated[index], [field]: parsed }
            setFormData((prev) => ({ ...prev, loadings: updated }))
        }
    }

    const handleCalculateStep1 = async () => {
        if (!formData.vehicleType || !formData.vehicleValue || !formData.premiumRate || !formData.coverType) {
            toast({
                description: "Please fill in vehicle type, value, rate, and cover type",
                variant: "warning",
                duration: 2000,
            })
            return
        }

        setCalculatingStep("step1")
        try {
            const result = await (
                dispatch(
                    calculateBasicPremium({
                        vehicleType: formData.vehicleType,
                        vehicleValue: formData.vehicleValue,
                        premiumRate: formData.premiumRate,
                        coverType: formData.coverType,
                        usage: formData.usage,
                    }),
                ) as any
            ).unwrap()

            setCalculatedPremium((prev) => ({
                ...prev,
                basicPremium: result.basicPremium,
            }))

            toast({
                description: `Basic Premium: ${formatCurrency(result.basicPremium)}`,
                variant: "success",
                duration: 2000,
            })
        } catch (err: any) {
            toast({
                description: "Failed to calculate basic premium",
                variant: "destructive",
                duration: 2000,
            })
        } finally {
            setCalculatingStep(null)
        }
    }

    const handleCalculateStep2 = async () => {
        if (!calculatedPremium.basicPremium) {
            toast({
                description: "Calculate basic premium first",
                variant: "warning",
                duration: 2000,
            })
            return
        }
    
        setCalculatingStep("step2")
        try {
            const discountResult = await (
                dispatch(
                    applyDiscounts({
                        basicPremium: calculatedPremium.basicPremium,
                        vehicleValue: formData.vehicleValue,
                        discounts: formData.discounts,
                    }),
                ) as any
            ).unwrap()
    
            setCalculatedPremium((prev) => ({
                ...prev,
                premiumAfterDiscounts: discountResult.premiumAfterDiscounts,
            }))
    
            toast({
                description: `Premium After Discounts: ${formatCurrency(discountResult.premiumAfterDiscounts)}`,
                variant: "success",
                duration: 2000,
            })
    
            setCalculatingStep("step3")
            const loadingResult = await (
                dispatch(
                    applyLoadings({
                        premiumAfterDiscounts: discountResult.premiumAfterDiscounts,
                        vehicleValue: formData.vehicleValue,
                        loadings: formData.loadings,
                    }),
                ) as any
            ).unwrap()
    
            setCalculatedPremium((prev) => ({
                ...prev,
                grossPremium: loadingResult.grossPremium,
            }))
    
            toast({
                description: `Gross Premium: ${formatCurrency(loadingResult.grossPremium)}`,
                variant: "success",
                duration: 2000,
            })
        } catch (err: any) {
            if (err?.status == 400) {
                toast({
                    description: "",
                    variant: "destructive",
                    duration: 2000,
                })
            } else {
                toast({
                    description: "Failed to apply discounts or loadings",
                    variant: "destructive",
                    duration: 2000,
                })
            }
            console.log(err)
        } finally {
            setCalculatingStep(null)
        }
    }

    const handleCalculateStep4 = async () => {
        if (!calculatedPremium.grossPremium) {
            toast({
                description: "Apply loadings first",
                variant: "warning",
                duration: 2000,
            })
            return
        }

        setCalculatingStep("step4")
        try {
            const result = await (
                dispatch(
                    calculateFinalPremium({
                        grossPremium: calculatedPremium.grossPremium,
                        trackingCost: formData.trackingCost,
                        rescueCost: formData.rescueCost,
                    }),
                ) as any
            ).unwrap()

            setCalculatedPremium((prev) => ({
                ...prev,
                netPremium: result.netPremium,
            }))

            toast({
                description: `Net Premium: ${formatCurrency(result.netPremium)}`,
                variant: "success",
                duration: 2000,
            })
        } catch (err: any) {
            toast({
                description: "Failed to calculate final premium",
                variant: "destructive",
                duration: 2000,
            })
        } finally {
            setCalculatingStep(null)
        }
    }

    const handleSave = () => {
        if (!formData.vehicleRegNo || !formData.vehicleType) {
            toast({
                description: "Please fill in vehicle registration and type",
                variant: "warning",
                duration: 2000,
            })
            return
        }

        onSave(formData)
        setFormData(initialForm())
        setCalculatedPremium({})
    }

    const formatCurrency = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined) return "N/A"
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
        }).format(amount)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent 
                className="add-vehicle-modal max-w-4xl p-0 overflow-hidden"
                style={{ 
                    maxHeight: "90vh",
                    height: "90vh",
                    display: "flex",
                    flexDirection: "column"
                }}
            >
                {/* Fixed Header */}
                <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
                    <DialogTitle>{vehicle ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
                </DialogHeader>

                {/* Scrollable content area */}
                <div 
                    ref={contentRef}
                    className="flex-1 overflow-y-auto px-6 py-4"
                    style={{ 
                        maxHeight: "calc(90vh - 140px)",
                        minHeight: "300px"
                    }}
                >
                    {/* Vehicle Information */}
                    <div className="form-section mb-6">
                        <h4 className="text-lg font-semibold mb-4 text-gray-700">Vehicle Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="form-field">
                                <Label htmlFor="vehicleRegNo" className="text-sm font-medium">Registration No *</Label>
                                <Input
                                    id="vehicleRegNo"
                                    value={formData.vehicleRegNo}
                                    onChange={(e) => handleInputChange("vehicleRegNo", e.target.value)}
                                    placeholder="e.g., ABC-123-XY"
                                    className="mt-1"
                                />
                            </div>

                            <div className="form-field">
                                <Label htmlFor="vehicleType" className="text-sm font-medium">Vehicle Type *</Label>
                                <select
                                    id="vehicleType"
                                    value={formData.vehicleType}
                                    onChange={(e) => handleInputChange("vehicleType", e.target.value)}
                                    className="form-select w-full mt-1 rounded-md border border-gray-300 px-3 py-2"
                                >
                                    <option value="">Select Type</option>
                                    <option value="Private Car">Private Car</option>
                                    <option value="Commercial Vehicle">Commercial Vehicle</option>
                                    <option value="Motorcycle">Motorcycle</option>
                                    <option value="Truck">Truck</option>
                                    <option value="Bus">Bus</option>
                                </select>
                            </div>

                            <div className="form-field">
                                <Label htmlFor="vehicleMake" className="text-sm font-medium">Make</Label>
                                <Input
                                    id="vehicleMake"
                                    value={formData.vehicleMake}
                                    onChange={(e) => handleInputChange("vehicleMake", e.target.value)}
                                    placeholder="e.g., Toyota"
                                    className="mt-1"
                                />
                            </div>

                            <div className="form-field">
                                <Label htmlFor="vehicleModel" className="text-sm font-medium">Model</Label>
                                <Input
                                    id="vehicleModel"
                                    value={formData.vehicleModel}
                                    onChange={(e) => handleInputChange("vehicleModel", e.target.value)}
                                    placeholder="e.g., Camry"
                                    className="mt-1"
                                />
                            </div>

                            <div className="form-field">
                                <Label htmlFor="modelYear" className="text-sm font-medium">Model Year</Label>
                                <Input
                                    id="modelYear"
                                    type="number"
                                    value={formData.modelYear}
                                    onChange={(e) => handleInputChange("modelYear", e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div className="form-field">
                                <Label htmlFor="color" className="text-sm font-medium">Color</Label>
                                <Input
                                    id="color"
                                    value={formData.color}
                                    onChange={(e) => handleInputChange("color", e.target.value)}
                                    placeholder="e.g., Silver"
                                    className="mt-1"
                                />
                            </div>

                            <div className="form-field">
                                <Label htmlFor="chassisNo" className="text-sm font-medium">Chassis No</Label>
                                <Input
                                    id="chassisNo"
                                    value={formData.chassisNo}
                                    onChange={(e) => handleInputChange("chassisNo", e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div className="form-field">
                                <Label htmlFor="engineNo" className="text-sm font-medium">Engine No</Label>
                                <Input
                                    id="engineNo"
                                    value={formData.engineNo}
                                    onChange={(e) => handleInputChange("engineNo", e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Coverage Information */}
                    <div className="form-section mb-6">
                        <h4 className="text-lg font-semibold mb-4 text-gray-700">Coverage Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="form-field">
                                <Label htmlFor="coverType" className="text-sm font-medium">Cover Type *</Label>
                                <select
                                    id="coverType"
                                    value={formData.coverType}
                                    onChange={(e) => handleInputChange("coverType", e.target.value)}
                                    className="form-select w-full mt-1 rounded-md border border-gray-300 px-3 py-2"
                                >
                                    <option value="Comprehensive">Comprehensive</option>
                                    <option value="Third Party">Third Party</option>
                                    <option value="Third Party Fire & Theft">Third Party Fire & Theft</option>
                                </select>
                            </div>

                            <div className="form-field">
                                <Label htmlFor="usage" className="text-sm font-medium">Usage *</Label>
                                <select
                                    id="usage"
                                    value={formData.usage}
                                    onChange={(e) => handleInputChange("usage", e.target.value)}
                                    className="form-select w-full mt-1 rounded-md border border-gray-300 px-3 py-2"
                                >
                                    <option value="Private">Private</option>
                                    <option value="Commercial">Commercial</option>
                                    <option value="Hire">Hire</option>
                                </select>
                            </div>

                            <div className="form-field">
                                <Label htmlFor="vehicleValue" className="text-sm font-medium">Vehicle Value *</Label>
                                <Input
                                    id="vehicleValue"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.vehicleValue}
                                    onChange={(e) => handleInputChange("vehicleValue", e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div className="form-field">
                                <Label htmlFor="premiumRate" className="text-sm font-medium">Premium Rate (%) *</Label>
                                <Input
                                    id="premiumRate"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={formData.premiumRate}
                                    onChange={(e) => handleInputChange("premiumRate", e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div className="form-field">
                                <Label htmlFor="seatCapacity" className="text-sm font-medium">Seat Capacity</Label>
                                <Input
                                    id="seatCapacity"
                                    type="number"
                                    min="0"
                                    value={formData.seatCapacity}
                                    onChange={(e) => handleInputChange("seatCapacity", e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div className="form-field">
                                <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                                <Input
                                    id="location"
                                    value={formData.location}
                                    onChange={(e) => handleInputChange("location", e.target.value)}
                                    placeholder="e.g., Lagos"
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        
                        {/* Calculation Section */}
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h5 className="text-sm font-medium text-gray-700">Calculation Results</h5>
                                    {calculatedPremium.basicPremium && (
                                        <div className="result-row mt-1">
                                            <span className="text-sm text-gray-600">Basic Premium:</span>
                                            <span className="text-sm font-semibold text-gray-900 ml-2">
                                                {formatCurrency(calculatedPremium.basicPremium)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <Button 
                                    onClick={handleCalculateStep1} 
                                    disabled={calculatingStep !== null} 
                                    size="sm"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    {calculatingStep === "step1" ? "Calculating..." : "Calculate Basic Premium"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Additional Costs */}
                    <div className="form-section mb-6">
                        <h4 className="text-lg font-semibold mb-4 text-gray-700">Additional Costs</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-field">
                                <Label htmlFor="trackingCost" className="text-sm font-medium">Tracking Cost</Label>
                                <Input
                                    id="trackingCost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.trackingCost}
                                    onChange={(e) => handleInputChange("trackingCost", e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div className="form-field">
                                <Label htmlFor="rescueCost" className="text-sm font-medium">Rescue Cost</Label>
                                <Input
                                    id="rescueCost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.rescueCost}
                                    onChange={(e) => handleInputChange("rescueCost", e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Discounts */}
                    <div className="form-section mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold text-gray-700">Discounts ({formData.discounts.length})</h4>
                            <Button onClick={handleAddDiscount} size="sm" variant="outline" className="border-indigo-300 text-indigo-600 hover:bg-indigo-50">
                                + Add Discount
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {formData.discounts.map((discount, index) => (
                                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="form-field">
                                            <Label className="text-sm font-medium">Name</Label>
                                            <Input
                                                value={discount.adjustmentName}
                                                onChange={(e) => handleAdjustmentChange("discount", index, "adjustmentName", e.target.value)}
                                                placeholder="e.g., NCB Discount"
                                                className="mt-1"
                                            />
                                        </div>

                                        <div className="form-field">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-sm font-medium">Rate (%)</Label>
                                                <span className="text-xs text-gray-500">
                                                    Amount: {calculatedPremium.basicPremium ? formatCurrency(calculatedPremium.basicPremium * (discount.rate / 100)) : "N/A"}
                                                </span>
                                            </div>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={discount.rate}
                                                onChange={(e) => handleAdjustmentChange("discount", index, "rate", e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>

                                        <div className="form-field flex items-end gap-2">
                                            <div className="flex-1">
                                                <Label className="text-sm font-medium">Applied On</Label>
                                                <select
                                                    value={discount.appliedOn}
                                                    onChange={(e) => handleAdjustmentChange("discount", index, "appliedOn", e.target.value)}
                                                    className="form-select w-full mt-1 rounded-md border border-gray-300 px-3 py-2"
                                                >
                                                    <option value="Premium">Premium</option>
                                                    <option value="SumInsured">Sum Insured</option>
                                                </select>
                                            </div>
                                            <Button
                                                onClick={() => handleRemoveDiscount(index)}
                                                size="sm"
                                                variant="outline"
                                                className="border-red-300 text-red-600 hover:bg-red-50 h-[38px]"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {formData.discounts.length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-2">No discounts added</p>
                            )}
                        </div>
                    </div>

                    {/* Loadings */}
                    <div className="form-section mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold text-gray-700">Loadings ({formData.loadings.length})</h4>
                            <Button onClick={handleAddLoading} size="sm" variant="outline" className="border-indigo-300 text-indigo-600 hover:bg-indigo-50">
                                + Add Loading
                            </Button>
                        </div>
                        <div className="space-y-3">
                            {formData.loadings.map((loading, index) => (
                                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="form-field">
                                            <Label className="text-sm font-medium">Name</Label>
                                            <Input
                                                value={loading.adjustmentName}
                                                onChange={(e) => handleAdjustmentChange("loading", index, "adjustmentName", e.target.value)}
                                                placeholder="e.g., Inexperienced Driver"
                                                className="mt-1"
                                            />
                                        </div>

                                        <div className="form-field">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-sm font-medium">Rate (%)</Label>
                                                <span className="text-xs text-gray-500">
                                                    Amount: {calculatedPremium.basicPremium ? formatCurrency(calculatedPremium.basicPremium * (loading.rate / 100)) : "N/A"}
                                                </span>
                                            </div>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={loading.rate}
                                                onChange={(e) => handleAdjustmentChange("loading", index, "rate", e.target.value)}
                                                className="mt-1"
                                            />
                                        </div>

                                        <div className="form-field flex items-end gap-2">
                                            <div className="flex-1">
                                                <Label className="text-sm font-medium">Applied On</Label>
                                                <select
                                                    value={loading.appliedOn}
                                                    onChange={(e) => handleAdjustmentChange("loading", index, "appliedOn", e.target.value)}
                                                    className="form-select w-full mt-1 rounded-md border border-gray-300 px-3 py-2"
                                                >
                                                    <option value="SumInsured">Sum Insured</option>
                                                    <option value="Premium">Premium</option>
                                                </select>
                                            </div>
                                            <Button
                                                onClick={() => handleRemoveLoading(index)}
                                                size="sm"
                                                variant="outline"
                                                className="border-red-300 text-red-600 hover:bg-red-50 h-[38px]"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {formData.loadings.length === 0 && (
                                <p className="text-sm text-gray-400 text-center py-2">No loadings added</p>
                            )}
                        </div>
                    </div>

                    {/* Apply Discount & Loadings Button */}
                    <div className="mb-4">
                        <Button
                            onClick={async () => {
                                await handleCalculateStep2()
                            }}
                            disabled={calculatingStep !== null || !calculatedPremium.basicPremium || calculatedPremium.grossPremium}
                            variant="outline"
                            className="w-full h-10 border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                        >
                            {calculatedPremium.grossPremium ? (
                                <>Gross Premium: {formatCurrency(calculatedPremium.grossPremium)}</>
                            ) : (
                                <>{(calculatingStep === "step3" || calculatingStep === "step2") ? "Calculating..." : "Apply Discount & Loadings"}</>
                            )}
                        </Button>
                    </div>
                    
                    {/* Add extra bottom padding for better scrolling */}
                    <div className="h-4" />
                </div>

                {/* Fixed Footer */}
                <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                    <Button 
                        disabled={calculatingStep !== null || !calculatedPremium.grossPremium} 
                        loading={calculatingStep === "step4"} 
                        onClick={handleSave} 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
                    >
                        Save Vehicle
                    </Button>
                    <Button onClick={onClose} variant="outline" className="border-gray-300">
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default AddVehicleModal