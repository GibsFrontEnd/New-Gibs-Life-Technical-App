// Motor vehicles: options, and converting between what the screens hold and what the API takes.

export const BASIS_PREMIUM = "Premium"
export const BASIS_SUM_INSURED = "SumInsured"

export interface MotorAdjustmentInput {
  adjustmentName: string
  rate: number | ""
  appliedOn: string
  sequenceOrder?: number
}

/**
 * Values as held in TPD_Premium — the third-party flat premium is looked up by an exact
 * match on these, so the screens must offer the same spellings. Used until/unless the API's
 * motor/vehicle-options endpoint answers.
 */
export const FALLBACK_VEHICLE_OPTIONS = {
  vehicleTypes: [
    "AMBULANCE", "BUS", "COUPE", "GEN. CARTAGE/TRUNK TRUCKS", "JEEP", "MID TRUCKS", "MOTORCYCLE",
    "OTHERS", "PICK UP/MINI TRUCK", "SALOON CAR", "TRACTORS", "TRICYCLE", "VAN", "WAGON-MINI BUS",
  ],
  usageTypes: ["PRIVATE", "COMMERCIAL", "PLEASURE & BUSINESS"],
  coverTypes: ["COMPREHENSIVE", "THIRD PARTY ONLY", "THIRD PARTY FIRE & THEFT"],
}

const toNumber = (v: any) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** Certificate numbers issued at save time; '/CERT/' ones are calculation previews only. */
export const realCertificateNo = (v: any): string => {
  const cert = String(v?.certificateNo ?? v?.certNo ?? "").trim()
  return cert && !cert.includes("/CERT/") ? cert : ""
}

const toBasis = (v: any) =>
  v === 0 || String(v ?? "").toLowerCase() === "suminsured" ? BASIS_SUM_INSURED : BASIS_PREMIUM

/**
 * Editable discount/loading rows from whatever the vehicle carries: its own input lists, or —
 * for vehicles loaded from an older API build — the applied amounts in the calculation steps.
 * Those don't say which basis was used, so it is inferred: an amount equal to rate% of the
 * vehicle value was "on Sum Insured".
 */
export const readVehicleAdjustments = (vehicle: any) => {
  const value = toNumber(vehicle?.vehicleValue)
  const fromList = (own: any, applied: any): MotorAdjustmentInput[] => {
    // An input list, even an empty one, is authoritative (the user may have removed every
    // row); the applied amounts are only a fallback for vehicles that never had one.
    const source = Array.isArray(own) ? own : Array.isArray(applied) ? applied : []
    return source
      .map((a: any, i: number) => {
        const rate = toNumber(a.rate)
        let appliedOn = a.appliedOn != null && a.appliedOn !== "" ? toBasis(a.appliedOn) : null
        if (!appliedOn) {
          const amount = toNumber(a.amount)
          appliedOn = value > 0 && Math.abs(amount - (value * rate) / 100) < 0.01 ? BASIS_SUM_INSURED : BASIS_PREMIUM
        }
        return {
          adjustmentName: String(a.adjustmentName ?? a.name ?? "").trim(),
          rate,
          appliedOn,
          sequenceOrder: toNumber(a.sequenceOrder) || i + 1,
        }
      })
      .filter((a: MotorAdjustmentInput) => a.adjustmentName)
  }
  return {
    discounts: fromList(vehicle?.discounts, vehicle?.step2_AfterDiscounts?.adjustments ?? vehicle?.step2_Discounts?.discountsApplied),
    loadings: fromList(vehicle?.loadings, vehicle?.step3_AfterLoadings?.adjustments ?? vehicle?.step3_Loadings?.loadingsApplied),
  }
}

/** Complete rows only (name + rate > 0), numbered in order, in the API's shape. */
export const toAdjustmentInput = (list: MotorAdjustmentInput[] | undefined) =>
  (list || [])
    .filter((a) => String(a.adjustmentName || "").trim() && toNumber(a.rate) > 0)
    .map((a, i) => ({
      adjustmentName: String(a.adjustmentName).trim(),
      rate: toNumber(a.rate),
      appliedOn: toBasis(a.appliedOn),
      sequenceOrder: i + 1,
    }))

const dateOnly = (v: any) => (v ? String(v).split("T")[0] : "")

/**
 * A vehicle as the motor calculate/save endpoints take it (MotorRiskItemInputDto). Saved
 * vehicles keep their certificate number so a recalculation doesn't issue new ones.
 */
export const toVehicleInput = (
  vehicle: any,
  index: number,
  defaults: { startDate?: string; endDate?: string } = {},
) => {
  const { discounts, loadings } = readVehicleAdjustments(vehicle)
  return {
    itemNo: index + 1,
    certificateNo: realCertificateNo(vehicle) || undefined,
    vehicleRegNo: String(vehicle.vehicleRegNo ?? "").trim(),
    vehicleUser: String(vehicle.vehicleUser ?? "").trim() || "Policy Holder",
    vehicleType: vehicle.vehicleType ?? "",
    vehicleMake: vehicle.vehicleMake ?? "",
    vehicleModel: vehicle.vehicleModel ?? "",
    chassisNo: vehicle.chassisNo ?? "",
    engineNo: vehicle.engineNo ?? "",
    color: vehicle.color ?? "",
    modelYear: toNumber(vehicle.modelYear) || new Date().getFullYear(),
    coverType: vehicle.coverType ?? "",
    usage: vehicle.usage ?? "",
    vehicleValue: toNumber(vehicle.vehicleValue),
    premiumRate: toNumber(vehicle.premiumRate),
    state: vehicle.state ?? "",
    seatCapacity: toNumber(vehicle.seatCapacity),
    waxCode: vehicle.waxCode ?? "",
    location: vehicle.location ?? "",
    startDate: dateOnly(vehicle.startDate) || defaults.startDate || undefined,
    endDate: dateOnly(vehicle.endDate) || defaults.endDate || undefined,
    trackingCost: toNumber(vehicle.trackingCost),
    rescueCost: toNumber(vehicle.rescueCost),
    discounts: toAdjustmentInput(discounts),
    loadings: toAdjustmentInput(loadings),
  }
}
