//@ts-nocheck
//@ts-nocheck
"use client"
import { CalculatedMotorVehicle } from "@/types/motor-quotation"
import { Card } from "../../ui/card"

interface Props {
    calculation: CalculatedMotorVehicle
}

export default function StepDetails({ calculation }: Props) {
    const steps = [
        calculation.step1_BasicPremium,
        calculation.step2_AfterDiscounts,
        calculation.step3_AfterLoadings,
        calculation.step4_FinalPremium,
    ]

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2,
        }).format(value)
    }

    const getAdjustmentColor = (type: string) => {
        switch (type) {
            case "DISCOUNT":
                return "text-green-600 dark:text-green-400"
            case "LOADING":
                return "text-orange-600 dark:text-orange-400"
            case "COST":
                return "text-blue-600 dark:text-blue-400"
            default:
                return "text-foreground"
        }
    }

    return (
        <div className="space-y-6">
            {steps.map((step, index) => (
                <Card key={index} className="p-6 bg-card border border-border">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-foreground mb-2">{step?.stepName}</h3>
                        <p className="text-sm text-muted-foreground font-mono">{step?.formula}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-muted/50 p-3 rounded-md">
                            <p className="text-xs text-muted-foreground mb-1">Starting Amount</p>
                            <p className="text-sm font-semibold text-foreground">{formatCurrency(step?.startingAmount || 0)}</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-md">
                            <p className="text-xs text-muted-foreground mb-1">Total Adjustment</p>
                            <p
                                className={`text-sm font-semibold ${(step?.totalAdjustment ?? 0) >= 0 ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"}`}
                            >
                                {(step?.totalAdjustment ?? 0) >= 0 ? "+" : ""}
                                {formatCurrency(step?.totalAdjustment ?? 0)}
                            </p>
                        </div>
                        <div className="bg-primary/10 p-3 rounded-md border border-primary/20">
                            <p className="text-xs text-muted-foreground mb-1">Resulting Amount</p>
                            <p className="text-sm font-semibold text-foreground">{formatCurrency(step?.resultingAmount || 0)}</p>
                        </div>
                    </div>

                    {(step?.adjustments ?? []).length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-foreground mb-3">Adjustments</h4>
                            <div className="space-y-2">
                                {(step?.adjustments ?? []).map((adjustment, adjIndex) => (
                                    <div
                                        key={adjIndex}
                                        className="flex items-start justify-between p-3 bg-muted/30 rounded-md border border-border/50"
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-foreground">{adjustment.name}</p>
                                            <p className={`text-xs font-mono ${getAdjustmentColor(adjustment.type)}`}>
                                                {adjustment.type}
                                                {adjustment.rate > 0 && ` • ${adjustment.rate}%`}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">{adjustment.formula}</p>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className={`text-sm font-semibold ${getAdjustmentColor(adjustment.type)}`}>
                                                {adjustment.amount >= 0 ? "+" : ""}
                                                {formatCurrency(adjustment.amount)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>
            ))}
        </div>
    )
}
