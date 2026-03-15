import type { GenericResponse } from "../types/agent";
import { SERVER_URL } from "../utils/constants";

export interface RegisterPayload {
  unitID: string; // Optional, can be null
  agent: string;
  address: string;
  area: string;
  city: string;
  state: string;
  phone1: string;
  phone2?: string | null;
  faxNo?: string | null;
  email: string;
  insPerson: string | null; // Optional, can be null
  finPerson: string | null; // Optional, can be null
  balance: number;
  creditLimit: number;
  comRate: number;
  remark?: string | null;
  accountNo: string;
  bankname: string;
  tag?: "approved" | "declined" | "pending";
  password: string;
  // attachments could be FileList or array of FormData entries
  attachments: File[];
}

const BASE_URL = SERVER_URL;

export async function registerAgent(
  payload: RegisterPayload
): Promise<GenericResponse> {
  const formData = new FormData();

  const appendField = (
    key: string,
    value: string | number | null | undefined
  ) => {
    const normalized =
      value === null || value === undefined
        ? ""
        : typeof value === "number"
        ? String(value)
        : value;
    formData.append(key, normalized);
  };

  appendField("UnitId", payload.unitID || "1");
  appendField("AgentName", payload.agent);
  appendField("Address", payload.address);
  appendField("Area", payload.area);
  appendField("City", payload.city);
  appendField("State", payload.state);
  appendField("Phone1", payload.phone1);
  appendField("Phone2", payload.phone2 ?? "");
  appendField("FaxNo", payload.faxNo ?? "");
  appendField("Email", payload.email);
  appendField("InsPerson", payload.insPerson ?? "");
  appendField("FinPerson", payload.finPerson ?? "");
  appendField("Balance", payload.balance ?? 0);
  appendField("CreditLimit", payload.creditLimit ?? 0);
  appendField("ComRate", payload.comRate ?? 0);
  appendField("Remark", payload.remark ?? "");
  appendField("AccountNo", payload.accountNo);
  appendField("BankName", payload.bankname);
  appendField("Tag", payload.tag ?? "pending");
  appendField("Password", payload.password);

  if (payload.attachments?.length) {
    payload.attachments.forEach((file) => {
      formData.append("Files", file);
    });
  }

  const resp = await fetch(`${BASE_URL}/v1/Agents/create`, {
    method: "POST",
    body: formData,
  });

  if (!resp.ok) {
    let message = "Registration failed";
    try {
      const errorBody = await resp.json();
      message = errorBody?.message || message;
    } catch (err) {
      try {
        message = await resp.text();
      } catch {}
    }
    throw new Error(message || "Registration failed");
  }

  return resp.json();
}

export async function deleteAgentAccount(
  token: string,
  agentID: string
): Promise<void> {
  const resp = await fetch(`${BASE_URL}/api/v1/Agents/${agentID}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!resp.ok) {
    let msg = "Account deletion failed";
    try {
      const json = await resp.json();
      msg = (json as any).message ?? msg;
    } catch {}
    throw new Error(msg);
  }
}

export async function changeAgentPassword(
  token: string,
  email: string,
  password: string
): Promise<void> {
  const resp = await fetch(`${BASE_URL}/api/v1/Agents/update-password`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!resp.ok) {
    let msg = "Password update failed";
    try {
      const json = await resp.json();
      msg = (json as any).message ?? msg;
    } catch {}
    throw new Error(msg);
  }
}
