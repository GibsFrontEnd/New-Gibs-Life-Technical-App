//@ts-nocheck
//@ts-nocheck
// @ts-nocheck
import { useState, useEffect } from "react"
import { useDispatch } from "react-redux"
import { Button } from "../ui/new-button"
import Input from "../ui/Input"
import { Label } from "../ui/label"
import "./AddPolicySectionModal.css"

interface EndorsementSectionModalProps {
    isOpen: boolean
    policyNo: string
    onClose: () => void
    onSave: (sections: any[]) => void
    sectionToEdit?: any
    endorsementType: string
}

export const EndorsementSectionModal = ({
    isOpen,
    policyNo,
    onClose,
    onSave,
    sectionToEdit,
    endorsementType
}: EndorsementSectionModalProps) => {
    const dispatch = useDispatch()
    const [sections, setSections] = useState<any[]>([])

    const defaultSectionState = {
        sectionName: "",
        riskItems: [{ itemNo: 1, smiCode: "1001", itemDescription: "", sumInsured: 0, rate: 0, multiplier: 1, premium: 0 }],
    }

    const [currentSection, setCurrentSection] = useState(defaultSectionState)

    const SECTION_OPTIONS = [
        "BUILDING",
        "ELECTRICAL",
        "FURNITURE",
        "MACHINERY",
        "STOCK",
        "LOSS OF PROFITS",
        "MOTOR VEHICLE",
        "GENERAL ACCIDENT",
        "MARINE CARGO",
        "MARINE HULL",
        "AVIATION",
        "OIL AND GAS",
        "ENGINEERING",
        "BONDS",
        "AGRICULTURE",
    ]

    // Logic Hooks
    const isAddition = endorsementType === 'Addition';
    const isCancellation = endorsementType === 'Cancellation';
    const isDeletion = endorsementType === 'Deletion';
    const isExistingSection = !!sectionToEdit;

    // Strict UI/Logic Separation
    // The user wants strict adherence to AddPolicySectionModal UI.
    // Logic:
    // Addition: 
    //   - If New (no sectionToEdit): FULL EDIT.
    //   - If Existing (sectionToEdit): READ ONLY.
    // Cancellation/Deletion:
    //   - Always Existing (mostly): READ ONLY FIELDS.
    //   - Items can be DELETED.

    // We determine "ReadOnlyMode" which disables inputs.
    const isReadOnlyMode = (isAddition && isExistingSection) || (isCancellation || isDeletion);

    // We determine if we can delete items.
    // Original component always allows deleting items.
    // We restrict delete if it's ReadOnlyMode AND NOT Cancellation/Deletion.
    // i.e., Addition+Existing = No Delete.
    // Cancellation = Yes Delete.
    // Addition+New = Yes Delete.
    const canDeleteItems = !isReadOnlyMode || (isCancellation || isDeletion);

    // Can we add items?
    // Only if NOT ReadOnlyMode.
    const canAddItem = !isReadOnlyMode;

    const canEditFields = !isReadOnlyMode;

    useEffect(() => {
        if (isOpen) {
            if (sectionToEdit) {
                setCurrentSection({
                    sectionName: sectionToEdit.sectionName || "",
                    sectionID: sectionToEdit.sectionID,
                    riskItems: sectionToEdit.riskItems && sectionToEdit.riskItems.length > 0
                        ? sectionToEdit.riskItems.map((ri: any) => ({
                            itemNo: ri.itemNo || 1,
                            smiCode: ri.smiCode || "",
                            itemDescription: ri.itemDescription || "",
                            sumInsured: ri.actualValue || ri.sumInsured || 0,
                            rate: ri.itemRate || 0,
                            multiplier: ri.multiplyRate || ri.multiplier || 1,
                            premium: ri.actualPremium || ri.premium || 0,
                            ...ri
                        }))
                        : [{ itemNo: 1, smiCode: "1001", itemDescription: "", sumInsured: 0, rate: 0, multiplier: 1, premium: 0 }]
                })
                setSections([])
            } else {
                setSections([])
                setCurrentSection(defaultSectionState)
            }
        }
    }, [isOpen, sectionToEdit])

    const handleAddRiskItem = () => {
        setCurrentSection((prev) => ({
            ...prev,
            riskItems: [
                ...prev.riskItems,
                {
                    itemNo: prev.riskItems.length + 1,
                    smiCode: "1001",
                    itemDescription: "",
                    sumInsured: 0,
                    rate: 0,
                    multiplier: 1,
                    premium: 0,
                },
            ],
        }))
    }

    const handleRemoveRiskItem = (index: number) => {
        setCurrentSection((prev) => ({
            ...prev,
            riskItems: prev.riskItems.filter((_, i) => i !== index),
        }))
    }

    const handleRiskItemChange = (index: number, field: string, value: any) => {
        setCurrentSection((prev) => {
            const updated = [...prev.riskItems]
            updated[index] = { ...updated[index], [field]: value }

            if (field === "sumInsured" || field === "rate" || field === "multiplier") {
                const sumInsured = Number.parseFloat(updated[index].sumInsured) || 0
                const rate = Number.parseFloat(updated[index].rate) || 0
                const multiplier = Number.parseFloat(updated[index].multiplier) || 1
                updated[index].premium = (sumInsured * rate * multiplier) / 100
            }

            return { ...prev, riskItems: updated }
        })
    }

    const handleAddSection = () => {
        if (currentSection.sectionName) {
            setSections((prev) => [...prev, { ...currentSection, sectionID: Date.now() }])
            setCurrentSection(defaultSectionState)
        }
    }

    const handleRemoveSection = (index: number) => {
        setSections((prev) => prev.filter((_, i) => i !== index))
    }

    const handleSave = () => {
        if (sectionToEdit) {
            if (currentSection.sectionName) {
                onSave([currentSection])
            } else {
                onSave([])
            }
        } else {
            if (sections.length === 0 && currentSection.sectionName) {
                onSave([currentSection])
            } else {
                onSave(sections)
            }
        }
        handleClose()
    }

    const handleClose = () => {
        setSections([])
        setCurrentSection(defaultSectionState)
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="apsm-modal-overlay">
            <div className="apsm-modal-content">
                <div className="apsm-modal-header">
                    <h2>
                        {sectionToEdit ? "Edit Policy Section" : "Add Policy Sections"}
                        <span className="text-sm font-normal ml-2 text-gray-500">({endorsementType})</span>
                    </h2>
                    <button className="apsm-close-btn" onClick={handleClose}>
                        ✕
                    </button>
                </div>

                <div className="apsm-modal-body">
                    <div className="apsm-form-section">
                        <h4>{sectionToEdit ? "Section Details" : "New Section Details"}</h4>

                        <div className="apsm-form-grid">
                            <div className="apsm-form-field">
                                <Label htmlFor="sectionName">Section Name *</Label>
                                <input
                                    list="section-options"
                                    id="sectionName"
                                    className="apsm-select"
                                    value={currentSection.sectionName}
                                    onChange={(e) => setCurrentSection((prev) => ({ ...prev, sectionName: e.target.value }))}
                                    placeholder="Select or Type Section"
                                    disabled={!canEditFields}
                                />
                                <datalist id="section-options">
                                    {SECTION_OPTIONS.map((option) => (
                                        <option key={option} value={option} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        <div className="apsm-risk-items">
                            <div className="apsm-items-header">
                                <h5>Risk Items</h5>
                                {canAddItem && (
                                    <Button onClick={handleAddRiskItem} variant="outline" size="sm">
                                        + Add Item
                                    </Button>
                                )}
                            </div>

                            <div className="apsm-items-table-wrapper">
                                <table className="apsm-items-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '60px' }}>SMI</th>
                                            <th>Description</th>
                                            <th>Sum Insured</th>
                                            <th style={{ width: '60px' }}>Rate</th>
                                            <th style={{ width: '60px' }}>Mult</th>
                                            <th>Premium</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentSection.riskItems.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <Input
                                                        value={item.smiCode}
                                                        onChange={(e) => handleRiskItemChange(index, "smiCode", e.target.value)}
                                                        className="apsm-input-cell"
                                                        disabled={!canEditFields}
                                                    />
                                                </td>
                                                <td>
                                                    <Input
                                                        value={item.itemDescription}
                                                        onChange={(e) => handleRiskItemChange(index, "itemDescription", e.target.value)}
                                                        className="apsm-input-cell"
                                                        disabled={!canEditFields}
                                                    />
                                                </td>
                                                <td>
                                                    <Input
                                                        type="number"
                                                        value={item.sumInsured}
                                                        onChange={(e) => handleRiskItemChange(index, "sumInsured", Number(e.target.value))}
                                                        className="apsm-input-cell"
                                                        disabled={!canEditFields}
                                                    />
                                                </td>
                                                <td>
                                                    <Input
                                                        type="number"
                                                        value={item.rate}
                                                        onChange={(e) => handleRiskItemChange(index, "rate", Number(e.target.value))}
                                                        className="apsm-input-cell"
                                                        disabled={!canEditFields}
                                                    />
                                                </td>
                                                <td>
                                                    <Input
                                                        type="number"
                                                        value={item.multiplier}
                                                        onChange={(e) => handleRiskItemChange(index, "multiplier", Number(e.target.value))}
                                                        className="apsm-input-cell"
                                                        disabled={!canEditFields}
                                                    />
                                                </td>
                                                <td>
                                                    <div className="apsm-premium-cell">{Number(item.premium || 0).toLocaleString()}</div>
                                                </td>
                                                <td>
                                                    {canDeleteItems && (
                                                        <Button
                                                            onClick={() => handleRemoveRiskItem(index)}
                                                            variant="destructive"
                                                            size="sm"
                                                            className="apsm-delete-btn"
                                                        >
                                                            X
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {!sectionToEdit && canAddItem && (
                                <Button
                                    onClick={handleAddSection}
                                    disabled={!currentSection.sectionName}
                                    className="apsm-add-section-btn"
                                >
                                    Add This Section
                                </Button>
                            )}
                        </div>
                    </div>

                    {!sectionToEdit && sections.length > 0 && (
                        <div className="apsm-sections-list">
                            <h4>Added Sections ({sections.length})</h4>
                            {sections.map((section, index) => (
                                <div key={section.sectionID || index} className="apsm-section-card">
                                    <div className="apsm-section-header">
                                        <div>
                                            <strong>{section.sectionName}</strong>
                                            <span className="apsm-item-count">{section.riskItems.length} items</span>
                                        </div>
                                        <Button
                                            onClick={() => handleRemoveSection(index)}
                                            variant="outline"
                                            size="sm"
                                            className="apsm-remove-section-btn"
                                        >
                                            Remove
                                        </Button>
                                    </div>

                                    <div className="apsm-section-items">
                                        {section.riskItems.map((item: any, itemIndex: number) => (
                                            <div key={itemIndex} className="apsm-item-summary">
                                                <span>{item.itemDescription || "No description"}</span>
                                                <span className="apsm-item-premium">{Number(item.premium).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="apsm-modal-footer">
                    <Button onClick={handleClose} variant="outline">
                        Cancel
                    </Button>
                    {/* 
                        Save Button Logic:
                        - Normal Add: Show standard Save.
                        - Edit (Addition Existing): HIDE Save. (Readonly)
                        - Edit (Cancellation): SHOW Save (to save deletions).
                     */}
                    {(!isReadOnlyMode || (isCancellation || isDeletion)) && (
                        <Button onClick={handleSave} disabled={!sectionToEdit && sections.length === 0 && !currentSection.sectionName}>
                            {sectionToEdit ? "Update Section" : "Save Sections"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
