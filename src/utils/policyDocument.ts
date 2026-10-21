import { SERVER_URL } from "./constants";

/** Downloads the filled policy document (.docx) for a policy. Throws an Error with the server's message on failure. */
export const downloadPolicyDocument = async (policyNo: string) => {
  const res = await fetch(`${SERVER_URL}/PolicyDocument?policyNo=${encodeURIComponent(policyNo)}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = "";
    try {
      message = JSON.parse(text).message || "";
    } catch {
      message = text && text.length < 200 ? text : "";
    }
    throw new Error(message || `Couldn't generate the policy document (${res.status})`);
  }
  const cd = res.headers.get("content-disposition");
  const m = cd && /filename\*?=(?:UTF-8'')?"?([^;"]+)"?/i.exec(cd);
  const filename = m?.[1] ? decodeURIComponent(m[1]) : `${policyNo.replace(/\//g, "-")}.docx`;

  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
