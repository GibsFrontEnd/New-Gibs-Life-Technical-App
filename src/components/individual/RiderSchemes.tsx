// Rider schemes on a traditional policy (legacy proposal_edit: "Rider Schemes" panel, table UndRider).
// Rider premium = sum assured x rate / 100; the API adds it to the policy's total premium.
import { Plus, Trash2 } from "lucide-react";

export const RIDER_TYPES = [
  "PERMANENT DISABILITY",
  "CRITICAL ILLNESS",
  "MEDICAL EXPENSES",
  "LOSS OF JOB",
  "DOUBLE INDEMNITY",
];

export type RiderLine = { type: string; rate: number | string };

const money = (n: number) =>
  `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const cell =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#155dfd]/30 focus:border-[#155dfd]";

const RiderSchemes = ({
  riders,
  onChange,
  sumAssured,
}: {
  riders: RiderLine[];
  onChange: (next: RiderLine[]) => void;
  /** Known sum assured, for the live premium column (blank when the premium drives the sum assured). */
  sumAssured: number;
}) => {
  const used = new Set(riders.map((r) => r.type));
  const premiumOf = (r: RiderLine) =>
    sumAssured > 0 && Number(r.rate) > 0 ? Math.round(sumAssured * Number(r.rate)) / 100 : null;
  const total = riders.reduce((s, r) => s + (premiumOf(r) ?? 0), 0);
  const free = RIDER_TYPES.filter((t) => !used.has(t));

  const update = (i: number, patch: Partial<RiderLine>) =>
    onChange(riders.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div>
      {riders.length === 0 ? (
        <p className="text-sm text-gray-500 mb-3">No riders. Add one if the policy carries a rider cover.</p>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-3 py-2 w-16">Item</th>
                <th className="text-left px-3 py-2">Rider</th>
                <th className="text-left px-3 py-2 w-32">Rate (%)</th>
                <th className="text-right px-3 py-2 w-44">Premium</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {riders.map((r, i) => {
                const p = premiumOf(r);
                return (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-3 py-2">{i + 1}</td>
                    <td className="px-3 py-2">
                      <select className={cell} value={r.type} onChange={(e) => update(i, { type: e.target.value })}>
                        {[r.type, ...free].filter(Boolean).map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        className={cell}
                        value={r.rate}
                        onChange={(e) => update(i, { rate: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2 text-right">{p === null ? "on save" : money(p)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        title="Remove rider"
                        onClick={() => onChange(riders.filter((_, idx) => idx !== i))}
                        className="p-1.5 rounded text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {sumAssured > 0 && (
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
                  <td colSpan={3} className="px-3 py-2 text-right">Total rider premium</td>
                  <td className="px-3 py-2 text-right">{money(total)}</td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      <button
        type="button"
        disabled={free.length === 0}
        onClick={() => onChange([...riders, { type: free[0] ?? "", rate: "" }])}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
      >
        <Plus size={15} /> Add rider
      </button>
      <p className="text-xs text-gray-500 mt-2">
        Rider premium = sum assured × rate ÷ 100, added to the total premium. When you price from a premium, the sum assured
        (and so the rider premium) is worked out on save.
      </p>
    </div>
  );
};

export default RiderSchemes;
