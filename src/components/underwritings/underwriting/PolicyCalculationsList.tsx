//@ts-nocheck
//@ts-nocheck
import { useDispatch, useSelector } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"
import type { RootState } from "../../../features/store"
import { setCurrentCalculation } from "../../../features/reducers/underwriteReducers/underwritingSlice"
import { Button } from "../../ui/new-button"
import "./PolicyCalculationsList.css"

const PolicyCalculationsList = () => {
  const { policyNo } = useParams<{ policyNo: string }>()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { calculationHistory: calculations = [], currentPolicy } = useSelector((state: RootState) => state.underwritings)

  // Filter calculations for this specific policy
  const policyCalculations = (calculations || []).filter((calc) => calc.policyNo === policyNo)

  const handleViewCalculation = (calculationId: string) => {
    const calculation = calculations.find((c) => c.id === calculationId)
    if (calculation) {
      dispatch(setCurrentCalculation(calculation) as any)
      navigate(`/underwriting/calculator/${policyNo}/${calculationId}`)
    }
  }

  const handleDeleteCalculation = (calculationId: string) => {
    if (confirm("Are you sure you want to delete this calculation?")) {
      // TODO: Implement delete calculation logic
      console.log("Delete calculation:", calculationId)
    }
  }

  const handleAddNewCalculation = () => {
    dispatch(setCurrentCalculation(null) as any)
    navigate(`/underwritings/calculator/${policyNo}`)
  }

  const handleBackToPolicies = () => {
    navigate(`/underwritings/edit/${policyNo}`)
  }

  const handleCreateDebitNote = (calculationId: string) => {
    navigate(`/underwriting/edit/${policyNo}/debit-note`, {
      state: { detailID: calculationId }
    })
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 2 }).format(value)

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-NG")
    } catch {
      return dateString
    }
  }

  return (
    <div className="pcl-container">
      <div className="pcl-header">
        <div>
          <h1>Policy Details</h1>
          <p className="pcl-policy-number">Policy No: {policyNo}</p>
        </div>
        <div className="pcl-header-actions">
          <Button onClick={handleBackToPolicies} variant="outline">
            Back to Policies
          </Button>
          <Button onClick={handleAddNewCalculation} variant="primary">
            + New Calculation
          </Button>
        </div>
      </div>

      {policyCalculations.length === 0 ? (
        <div className="pcl-empty-state">
          <p>No calculations found for this policy</p>
          <Button onClick={handleAddNewCalculation}>Create First Calculation</Button>
        </div>
      ) : (
        <div className="staged-table-wrapper">
          <table className="staged-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Calculation</th>
                <th>ID</th>
                <th>Created</th>
                <th>Sum Insured</th>
                <th>Total Premium</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {policyCalculations.map((c, idx) => (
                <tr key={c.id}>
                  <td>{idx + 1}</td>
                  <td className="clause-col">
                    <div className="clause-title">{c.calculationName}</div>
                    <div className="clause-sub muted">{c.createdBy} • {c.status}</div>
                  </td>
                  <td className="mono">{c.id}</td>
                  <td className="mono">{formatDate(c.createdOn)}</td>
                  <td className="mono">{formatCurrency(c.totalSumInsured)}</td>
                  <td className="mono">{formatCurrency(c.totalPremium)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      {/* Add Debit Note Button */}
                      <Button size="sm" variant="secondary" onClick={() => handleCreateDebitNote(c.id)}>
                        + Debit Note
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleViewCalculation(c.id)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteCalculation(c.id)}>
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
  )
}

export default PolicyCalculationsList
