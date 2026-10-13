//@ts-nocheck
//@ts-nocheck

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"
import Select from "react-select"
import type { RootState } from "../../../features/store"
import {
  getClausesByPolicyNo,
  getClauseOptionsBySubrisk,
  createClausesBulk,
  updateClause,
  deleteClause,
  clearMessages,
} from "../../../features/reducers/quoteReducers/clauseSlice"
import { getProposalByNumber } from "../../../features/reducers/quoteReducers/quotationSlice"
import { Button } from "../../ui/new-button"
import { Label } from "../../ui/label"
import Input from "../../ui/Input"
import type { CreateClauseRequest, UpdateClauseRequest } from "../../../types/clause"
import "./ClauseManager.css"

interface ClauseForm {
  localId: string // local uuid for UI
  id?: number | null // backend id if existing saved clause
  clauseOptionId: string // memoID (string)
  clauseHeader: string // human header (we still keep it if needed)
  subheader1: string
  subheader2: string
  details: string // will be auto-filled with selected clause header
  certNo: string
  remarks: string
  tag: string
  policyNo?: string // optional
  clauseID?: string // memoID persisted as clauseID (per your request)
  headerID?: string // subrisk code persisted here (per your request)
}

const blankForm = (): ClauseForm => ({
  localId: crypto.randomUUID(),
  id: null,
  clauseOptionId: "",
  clauseHeader: "",
  subheader1: "",
  subheader2: "",
  details: "",
  certNo: "",
  remarks: "",
  tag: "CLAUSES",
  clauseID: "",
  headerID: "",
})

const ClauseManager = () => {
  const { proposalNo } = useParams<{ proposalNo: string }>()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { currentProposal } = useSelector((state: RootState) => state.quotations)
  const { clauses, clauseOptions, loading, success, error } = useSelector((state: RootState) => state.clauses)

  // Forms currently being edited (usually a single blank/new form, but supports multiple)
  const [clauseForms, setClauseForms] = useState<ClauseForm[]>([blankForm()])

  // Staged clauses: table entries at the bottom (not yet sent to API). Could be created locally or come from saved API results.
  const [stagedClauses, setStagedClauses] = useState<ClauseForm[]>([])

  // Local view of proposal's saved clauses from API (we now fetch them via getClausesByPolicyNo)
  const [proposalClauses, setProposalClauses] = useState<any[]>([])

  // ID of saved clause currently being edited (optional)
  const [editingSavedId, setEditingSavedId] = useState<number | null>(null)

  // Fetch proposal and clause options on mount
  useEffect(() => {
    if (proposalNo) {
      dispatch(getProposalByNumber(proposalNo) as any)
      dispatch(getClausesByPolicyNo(proposalNo) as any) // <-- fetch clauses for this proposal
    }
  }, [dispatch, proposalNo])

  // Fetch clause options when we have the proposal's subRiskID
  useEffect(() => {
    if (currentProposal?.subRiskID) {
      dispatch(getClauseOptionsBySubrisk(currentProposal.subRiskID) as any)
    }
  }, [currentProposal, dispatch])

  // Update local proposalClauses whenever the slice's clauses change
  useEffect(() => {
    // slice.clauses should now hold the clauses returned by getClausesByPolicyNo when called with proposalNo
    if (Array.isArray(clauses) && proposalNo) {
      setProposalClauses(clauses)
    } else {
      setProposalClauses([])
    }
  }, [clauses, proposalNo])

  useEffect(() => {
    if (success.createClauses || success.updateClause) {
      // clear forms and staged list after successful save/update
      setClauseForms([blankForm()])
      setStagedClauses([])
      setEditingSavedId(null)

      // re-fetch clauses for this proposal so saved ones appear
      if (proposalNo) {
        dispatch(getClausesByPolicyNo(proposalNo) as any)
      }

      dispatch(clearMessages())
    }
  }, [success.createClauses, success.updateClause, dispatch, proposalNo])

  // WHEN user clicks "+ Add Another Clause"
  // Move existing clauseForms to stagedClauses (table) and create a single new blank form.
  const handleAddClauseForm = () => {
    // Only stage forms that have some selected clauseOptionId or content (avoid empty duplicates)
    const filled = clauseForms.filter(
      (f) =>
        f.clauseOptionId ||
        f.clauseHeader ||
        f.subheader1 ||
        f.subheader2 ||
        f.details ||
        f.certNo ||
        f.remarks ||
        f.tag,
    )

    if (filled.length > 0) {
      setStagedClauses((prev) => [...prev, ...filled.map((f) => ({ ...f, policyNo: proposalNo }))])
    }

    // reset to a single blank form ready for the next clause
    setClauseForms([blankForm()])
    setEditingSavedId(null)
  }

  const handleRemoveClauseForm = (localId: string) => {
    if (clauseForms.length > 1) {
      setClauseForms(clauseForms.filter((form) => form.localId !== localId))
    } else {
      // reset the single form to blank (don't allow zero forms)
      setClauseForms([blankForm()])
    }
    setEditingSavedId(null)
  }

  const handleClauseFormChange = (localId: string, field: keyof ClauseForm, value: string) => {
    setClauseForms(
      clauseForms.map((form) => {
        if (form.localId === localId) {
          return { ...form, [field]: value }
        }
        return form
      }),
    )
  }

  // When a clause option is selected we:
  // - set details = selectedOption.header
  // - set clauseID = selectedOption.memoID
  // - set headerID = currentProposal.subRiskID (the subriskcode used to fetch options)
  // - keep clauseOptionId for internal use (memoID) as well
  const handleClauseSelect = (localId: string, option: any) => {
    if (!option) {
      setClauseForms(
        clauseForms.map((form) => {
          if (form.localId === localId) {
            return {
              ...form,
              clauseOptionId: "",
              clauseHeader: "",
              details: "",
              clauseID: "",
              headerID: "",
            }
          }
          return form
        }),
      )
      return
    }

    const selectedOption = clauseOptions.find((opt) => opt.memoID === option.value)
    if (selectedOption) {
      const subriskCode = currentProposal?.subRiskID ?? ""
      setClauseForms(
        clauseForms.map((form) => {
          if (form.localId === localId) {
            return {
              ...form,
              clauseOptionId: String(selectedOption.memoID),
              clauseHeader: selectedOption.header ?? "",
              details: selectedOption.header ?? "", // auto-fill details with header text
              clauseID: String(selectedOption.memoID), // memoID stored in clauseID
              headerID: String(subriskCode), // subrisk code stored in headerID
            }
          }
          return form
        }),
      )
    }
  }

  // Stage a single form to the table (alternative to staging all on "+ Add Another Clause")
  const handleStageSingleForm = (localId: string) => {
    const form = clauseForms.find((f) => f.localId === localId)
    if (!form) return

    // basic validation — require clauseOptionId or header
    if (!form.clauseOptionId && !form.clauseHeader) {
      alert("Please select a clause before staging it.")
      return
    }

    setStagedClauses((prev) => [...prev, { ...form, policyNo: proposalNo }])
    // remove from forms and ensure at least one blank form remains
    const remaining = clauseForms.filter((f) => f.localId !== localId)
    setClauseForms(remaining.length > 0 ? remaining : [blankForm()])
  }

  // Edit a staged clause: move it back to the form area for editing
  const handleEditStagedClause = (localId: string) => {
    const staged = stagedClauses.find((s) => s.localId === localId)
    if (!staged) return

    // Put the staged clause into the first form for editing
    setClauseForms([{ ...staged }])
    // remove it from staged list
    setStagedClauses(stagedClauses.filter((s) => s.localId !== localId))
    setEditingSavedId(null)
  }

  const handleRemoveStagedClause = (localId: string) => {
    setStagedClauses(stagedClauses.filter((s) => s.localId !== localId))
  }

  // Load a saved clause (from API) into the form for editing
  const handleEditSavedClause = (savedId: number) => {
    const saved = proposalClauses.find((c) => c.id === savedId)
    if (!saved) return

    const mapped: ClauseForm = {
      localId: crypto.randomUUID(),
      id: saved.id,
      clauseOptionId: String(saved.memoID ?? saved.clauseID ?? ""), // keep previous values if present
      clauseHeader: saved.clauseID ?? saved.clauseID ?? "",
      subheader1: saved.subheader1 ?? "",
      subheader2: saved.subheader2 ?? "",
      details: saved.details ?? (saved.clauseID ?? ""), // details persisted server-side or fallback to clauseID text
      certNo: saved.certNo ?? "",
      remarks: saved.remarks ?? "",
      tag: saved.tag ?? "CLAUSES",
      clauseID: String(saved.clauseID ?? saved.memoID ?? ""),
      headerID: String(saved.headerID ?? currentProposal?.subRiskID ?? ""),
      policyNo: saved.policyNo ?? proposalNo,
    }

    // Replace current forms with the saved clause for editing
    setClauseForms([mapped])
    setEditingSavedId(savedId)
  }

  // save: handle both create bulk and update
  const handleSubmit = async () => {
    if (!proposalNo || !currentProposal) return

    // Combine stagedClauses and any non-empty current clauseForms
    const formsToSubmit = [
      ...stagedClauses,
      ...clauseForms.filter(
        (f) =>
          f.clauseOptionId ||
          f.clauseHeader ||
          f.subheader1 ||
          f.subheader2 ||
          f.details ||
          f.certNo ||
          f.remarks ||
          f.tag,
      ),
    ]

    const validForms = formsToSubmit.filter((form) => form.clauseID && form.headerID)

    if (validForms.length === 0) {
      alert("Please stage or fill at least one clause to save.")
      return
    }

    // Split updates (have id) vs creates (no id)
    const toUpdate = validForms.filter((f) => f.id)
    const toCreate = validForms.filter((f) => !f.id)

    try {
      const promises: Promise<any>[] = []

      // dispatch updates (one-by-one), mapping to UpdateClauseRequest
      for (const f of toUpdate) {
        const updateData: UpdateClauseRequest = {
          policyNo: proposalNo,
          headerID: Number(f.headerID || currentProposal?.subRiskID || 0), // headerID now holds subrisk code
          clauseID: f.clauseID ?? String(f.clauseOptionId ?? ""),
          subheader1: f.subheader1,
          subheader2: f.subheader2,
          details: f.details,
          certNo: f.certNo,
          remarks: f.remarks,
          tag: f.tag,
        }
        promises.push(dispatch(updateClause({ id: Number(f.id), clauseData: updateData }) as any))
      }

      // dispatch bulk create for new ones
      if (toCreate.length > 0) {
        const createRequests: CreateClauseRequest[] = toCreate.map((form) => ({
          policyNo: proposalNo,
          headerID: Number(form.headerID || currentProposal?.subRiskID || 0), // headerID = subrisk code
          clauseID: form.clauseID ?? String(form.clauseOptionId ?? ""),
          subheader1: form.subheader1,
          subheader2: form.subheader2,
          details: form.details,
          certNo: form.certNo,
          remarks: form.remarks,
          tag: form.tag,
        }))
        promises.push(dispatch(createClausesBulk(createRequests) as any))
      }

      // wait for all to complete
      await Promise.all(promises)

      // refresh clauses for this policy
      if (proposalNo) {
        dispatch(getClausesByPolicyNo(proposalNo) as any)
      }

      // clear local staged/forms
      setClauseForms([blankForm()])
      setStagedClauses([])
      setEditingSavedId(null)
    } catch (err) {
      console.error("Failed to save/update clauses:", err)
      alert("Failed to save/update clauses. Check console or error messages.")
    }
  }

  const handleDeleteClause = (clauseId: number) => {
    if (window.confirm("Are you sure you want to delete this clause?")) {
      dispatch(deleteClause(clauseId) as any)
    }
  }

  const handleBack = () => {
    navigate("/quotations")
  }

  if (!currentProposal) {
    return <div className="clause-manager-loading">Loading proposal...</div>
  }

  return (
    <div className="clause-manager-container">
      <div className="clause-manager-header">
        <div>
          <h1>Manage Clauses</h1>
          <p className="proposal-info">
            Proposal No: {proposalNo} | Product: {currentProposal.subRisk}
          </p>
        </div>
        <div className="header-actions">
          <Button onClick={handleBack} variant="outline">
            Back to Proposals
          </Button>
          <Button onClick={handleSubmit} disabled={loading.createClauses || loading.updateClause}>
            {loading.createClauses || loading.updateClause ? "Saving..." : "Save Clauses"}
          </Button>
        </div>
      </div>

      <div className="clause-manager-content">
        {error.createClauses && <div className="error-message">{error.createClauses}</div>}
        {error.fetchClauses && <div className="error-message">{error.fetchClauses}</div>}
        {success.createClauses && <div className="success-message">Clauses saved successfully!</div>}
        {success.updateClause && <div className="success-message">Clause updated successfully!</div>}

        {/* Add / Edit new clauses */}
        <div className="add-clauses-section" style={{ marginTop: 18 }}>
          <div className="section-header">
            <h2>Add / Edit Clauses</h2>
{/*             <div style={{ display: "flex", gap: 8 }}>
              <Button onClick={handleAddClauseForm} variant="outline">
                + Add Another Clause (stage)
              </Button>
            </div>
 */}          </div>

          {/* Staged Clauses Table */}
          <div className="staged-clauses-section" style={{ marginTop: 12 }}>
            <h3>Staged Clauses (Table)</h3>
            {stagedClauses.length === 0 ? (
              <div className="muted">No staged clauses yet. Click "Add Another Clause" to stage current form(s).</div>
            ) : (
              <div className="staged-table-wrapper">
                <table className="staged-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Clause</th>
{/*                       <th>Subheader 1</th>
                      <th>Subheader 2</th>
                      <th>Details</th>
 */}                      <th>Tag</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stagedClauses.map((s, idx) => (
                      <tr key={s.localId}>
                        <td>{idx + 1}</td>
                        <td>{s.clauseHeader}</td>
{/*                         <td>{s.subheader1}</td>
                        <td>{s.subheader2}</td>
                        <td className="truncate-cell">{s.details}</td>
 */}                        <td>{s.tag}</td>
                        <td>
                          <div style={{ display: "flex", gap: 8 }}>
                            <Button size="sm" variant="outline" onClick={() => handleEditStagedClause(s.localId)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleRemoveStagedClause(s.localId)}>
                              Remove
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Forms */}
          <div className="clause-forms" style={{ marginTop: 12 }}>
            {clauseForms.map((form, index) => (
              <div key={form.localId} className="clause-form">
                <div className="clause-form-header">
                  <h3>{editingSavedId ? `Editing saved clause #${editingSavedId}` : `Clause ${stagedClauses.length + index + 1}`}</h3>
                  <div style={{ display: "flex", gap: 8 }}>
                    {clauseForms.length > 1 && (
                      <Button variant="outline" size="sm" onClick={() => handleRemoveClauseForm(form.localId)}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-field form-field-full">
                    <Label>Select Clause *</Label>
                    <Select
                      options={clauseOptions.map((opt) => ({
                        value: opt.memoID,
                        label: opt.header,
                      }))}
                      value={
                        form.clauseOptionId
                          ? {
                              value: Number.parseInt(form.clauseOptionId),
                              label: form.clauseHeader,
                            }
                          : null
                      }
                      onChange={(opt) => handleClauseSelect(form.localId, opt)}
                      placeholder="Select a clause"
                      isClearable
                      isLoading={loading.fetchClauseOptions}
                    />
                  </div>

                  {/* Most editable fields hidden/commented as you indicated the user won't have much control */}
{/*                   <div className="form-field">
                    <Label htmlFor={`subheader1-${form.localId}`}>Subheader 1</Label>
                    <Input
                      id={`subheader1-${form.localId}`}
                      value={form.subheader1}
                      onChange={(e) => handleClauseFormChange(form.localId, "subheader1", e.target.value)}
                      placeholder="Enter subheader 1"
                    />
                  </div>
                  ...
*/}                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop:20 }}>
              <Button onClick={handleAddClauseForm} variant="outline">
                + Add Another Clause (stage)
              </Button>
            </div>
        </div>
        <Button onClick={handleSubmit} disabled={loading.createClauses || loading.updateClause}>
            {loading.createClauses || loading.updateClause ? "Saving..." : "Save Clauses"}
          </Button>

        {/* Saved clauses table (from API) */}
        <div className="saved-clauses-section" style={{ marginTop: 18 }}>
          <h2>Saved Clauses (Proposal)</h2>
          {proposalClauses.length === 0 ? (
            <div className="muted">No saved clauses for this proposal yet.</div>
          ) : (
            <div className="saved-table-wrapper">
              <table className="saved-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>ClauseID</th>
{/*                     <th>Subheader 1</th>
                    <th>Subheader 2</th>
 */}                    <th>Details</th>
                    <th>Tag</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {proposalClauses.map((c, idx) => (
                    <tr key={c.id}>
                      <td>{idx + 1}</td>
                      <td>{c.clauseID}</td>
{/*                       <td>{c.subheader1}</td>
                      <td>{c.subheader2}</td>
 */}                      <td className="truncate-cell">{c.details}</td>
                      <td>{c.tag}</td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <Button size="sm" variant="outline" onClick={() => handleEditSavedClause(c.id)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (window.confirm("Delete this saved clause?")) {
                                handleDeleteClause(c.id)
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClauseManager
