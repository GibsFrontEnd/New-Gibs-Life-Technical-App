// Beneficiaries of an individual-life policy (legacy: endorse_cover_edit / endorse_beneficiaries_edit).
// Rules enforced by the API: type PRIMARY or CONTINGENT; each share 0-100; shares of one type add up to at most 100.
import { useCallback, useEffect, useState } from "react";
import { Trash2, Plus, Users } from "lucide-react";
import apiCall from "../../utils/api-call";
import { useToast } from "../UI/use-toast";

const RELATIONS = [
  "FATHER", "MOTHER", "SON", "DAUGHTER", "BROTHER", "SISTER", "COUSIN", "UNCLE", "NEPHEW", "NIECE", "WIFE",
  "HUSBAND", "FATHER-IN-LAW", "MOTHER-IN-LAW", "FRIENDS", "RELATION",
];

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#155dfd]/30 focus:border-[#155dfd]";

const ageFrom = (dob: string) => {
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "";
  const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  if (t < new Date(t.getFullYear(), d.getMonth(), d.getDate())) a--;
  return String(Math.max(a, 0));
};

const empty = {
  surname: "", otherNames: "", sex: "", dob: "", relation: "", type: "PRIMARY", percentage: "", address: "",
};

const BeneficiariesPanel = ({ policyNo }: { policyNo: string }) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    try {
      const res = await apiCall.get("/Beneficiaries/by-policy", { params: { policyNo } });
      setRows(res.data ?? []);
    } catch {
      setRows([]);
    }
  }, [policyNo]);
  useEffect(() => { load(); }, [load]);

  const fail = (description: string) => toast({ title: "Error", description, variant: "destructive" });

  const total = (type: string) =>
    rows.filter((r) => r.type === type).reduce((s, r) => s + Number(r.percentage || 0), 0);

  const add = async () => {
    const need: [string, string][] = [
      [form.surname, "Surname"], [form.otherNames, "Other names"], [form.sex, "Sex"], [form.dob, "Date of birth"],
      [form.relation, "Relationship"], [form.percentage, "Percentage"], [form.address, "Address"],
    ];
    const missing = need.find(([v]) => !String(v).trim());
    if (missing) return fail(`${missing[1]} is required`);

    const fd = new FormData();
    fd.append("Surname", form.surname.trim());
    fd.append("OtherNames", form.otherNames.trim());
    fd.append("Sex", form.sex);
    fd.append("DOB", form.dob);
    fd.append("Age", ageFrom(form.dob));
    fd.append("Relation", form.relation);
    fd.append("Type", form.type);
    fd.append("Percentage", form.percentage);
    fd.append("Address", form.address.trim());
    fd.append("PolicyNo", policyNo);
    fd.append("TransFlag", "Y");

    setBusy(true);
    try {
      await apiCall.post("/Beneficiaries", fd);
      toast({ title: "Success", description: "Beneficiary added.", variant: "success" });
      setForm(empty);
      await load();
    } catch (e: any) {
      fail(e?.response?.data?.message || e?.message || "Could not add the beneficiary");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("Remove this beneficiary?")) return;
    try {
      await apiCall.delete(`/Beneficiaries/${id}`);
      await load();
    } catch (e: any) {
      fail(e?.response?.data?.message || e?.message || "Could not remove the beneficiary");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users size={18} className="text-[#155dfd]" />
        <h2 className="text-lg font-semibold text-gray-800">Beneficiaries — {policyNo}</h2>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-3 py-2">Name</th><th className="text-left px-3 py-2">Relationship</th>
              <th className="text-left px-3 py-2">Type</th><th className="text-right px-3 py-2">Share</th>
              <th className="text-left px-3 py-2">Age</th><th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-4 text-gray-500">No beneficiaries yet.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.transID} className="border-t border-gray-100">
                <td className="px-3 py-2">{r.surname} {r.otherNames}</td>
                <td className="px-3 py-2">{r.relation}</td>
                <td className="px-3 py-2">{r.type}</td>
                <td className="px-3 py-2 text-right">{Number(r.percentage).toFixed(2)}%</td>
                <td className="px-3 py-2">{r.age}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => remove(r.transID)} title="Remove" className="p-1.5 rounded text-red-500 hover:bg-red-50">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-3 py-2 bg-gray-50 text-xs text-gray-600 flex gap-6">
          <span>Primary total: <b>{total("PRIMARY").toFixed(2)}%</b></span>
          <span>Contingent total: <b>{total("CONTINGENT").toFixed(2)}%</b></span>
        </div>
      </div>

      <h3 className="text-base font-semibold text-gray-800 mb-3">Add beneficiary</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input className={inputCls} placeholder="Surname" value={form.surname} onChange={(e) => set("surname", e.target.value)} />
        <input className={inputCls} placeholder="Other names" value={form.otherNames} onChange={(e) => set("otherNames", e.target.value)} />
        <select className={inputCls} value={form.sex} onChange={(e) => set("sex", e.target.value)}>
          <option value="">Sex…</option><option>Male</option><option>Female</option>
        </select>
        <input type="date" className={inputCls} value={form.dob} onChange={(e) => set("dob", e.target.value)} />
        <select className={inputCls} value={form.relation} onChange={(e) => set("relation", e.target.value)}>
          <option value="">Relationship…</option>
          {RELATIONS.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value)}>
          <option>PRIMARY</option><option>CONTINGENT</option>
        </select>
        <input type="number" min={0} max={100} className={inputCls} placeholder="Share %" value={form.percentage} onChange={(e) => set("percentage", e.target.value)} />
        <div className="md:col-span-2">
          <input className={inputCls} placeholder="Address" value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
      </div>
      <button
        onClick={add}
        disabled={busy}
        className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-[#155dfd] text-white rounded-lg text-sm font-semibold hover:bg-opacity-90 disabled:opacity-50"
      >
        <Plus size={16} /> Add beneficiary
      </button>
      <p className="text-xs text-gray-500 mt-2">Shares of one type (primary / contingent) cannot add up to more than 100%.</p>
    </div>
  );
};

export default BeneficiariesPanel;
