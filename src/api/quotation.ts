import apiCall from "@/utils/api-call";

export interface RateOption {
  premiumRate: number;
}

export const getRates = async (
  age: number,
  duration: number,
  rateCode: string,
  productCode: string,
  remark: string = "PREMIUM"
): Promise<RateOption> => {
  try {
    const RATES_ENDPOINT = "/Quotation/get-premium-rate";

    let response;
    try {
      response = await apiCall.get<RateOption>(
        `${RATES_ENDPOINT}?age=${age}&duration=${duration}&rateCode=${rateCode}&productCode=${productCode}&remark=${encodeURIComponent(remark)}`
      );
    } catch (err) {
      console.error("API call failed:", err);
      throw new Error("Unable to fetch rates from server.");
    }

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Failed to fetch rates: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching rates:", error);
    throw error;
  }
};