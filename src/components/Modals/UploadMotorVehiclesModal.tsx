//@ts-nocheck
import React, { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import type { AppDispatch } from "../../features/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Button } from "../ui/new-button"
import { Label } from "../ui/label"
import { toast } from "sonner"
import { Loader2, Download, CheckCircle2, AlertTriangle, FileSpreadsheet } from "lucide-react"
import {
  downloadMotorUploadTemplate,
  previewMotorVehicleUpload,
} from "../../features/reducers/underwriteReducers/underwritingSlice"
import { apiErrorMessage } from "../../utils/api-error"

type ImportMode = "append" | "replace"

interface UploadMotorVehiclesModalProps {
  isOpen: boolean
  onClose: () => void
  /** Number of vehicles already on this calculation */
  existingCount: number
  /**
   * Receives the file's valid vehicles; the calculator saves them with the rest of this
   * calculation (so they land in THIS calculation, keyed by its detailID). Resolve true when saved.
   */
  onImport: (vehicles: any[], mode: ImportMode) => Promise<boolean>
}

const errorMessage = (err: any) => apiErrorMessage(err)

export const UploadMotorVehiclesModal: React.FC<UploadMotorVehiclesModalProps> = ({
  isOpen,
  onClose,
  existingCount,
  onImport,
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [mode, setMode] = useState<ImportMode>("append")
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
  const [preview, setPreview] = useState<any | null>(null)

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null)
      setPreview(null)
      setMode("append")
    }
  }, [isOpen])

  const rows: any[] = preview?.rows || []
  const validVehicles = rows.filter((r) => r.isValid && r.vehicle).map((r) => r.vehicle)
  const invalidCount = preview?.invalidRowCount ?? rows.filter((r) => !r.isValid).length
  const warningCount = preview?.warningCount ?? 0

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true)
    try {
      const blob = await dispatch(downloadMotorUploadTemplate()).unwrap()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      // The API serves the template as CSV (opens in Excel)
      a.download = "Motor_Vehicles_Template.csv"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      toast.error(`Could not download the template: ${errorMessage(err)}`)
    } finally {
      setIsDownloadingTemplate(false)
    }
  }

  // Previewing only reads the file — nothing is saved until "Import"
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)
    setPreview(null)
    if (!file) return
    setIsPreviewing(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      setPreview(await dispatch(previewMotorVehicleUpload(formData)).unwrap())
    } catch (err: any) {
      toast.error(`Could not read the file: ${errorMessage(err)}`)
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleImport = async () => {
    if (validVehicles.length === 0) {
      toast.warning("The file has no valid vehicle rows to import")
      return
    }
    if (mode === "replace" && existingCount > 0 &&
      !window.confirm(`Replace this calculation's ${existingCount} vehicle(s) with the ${validVehicles.length} from the file?`)) {
      return
    }
    setIsImporting(true)
    try {
      const saved = await onImport(validVehicles, mode)
      if (saved) onClose()
    } finally {
      setIsImporting(false)
    }
  }

  const busy = isPreviewing || isImporting

  return (
    <Dialog open={isOpen} onOpenChange={() => { if (!isImporting) onClose() }} maxWidth="820px">
      <DialogContent className="max-h-[88vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-indigo-600" /> Upload Vehicles
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-5">
          <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-lg gap-3">
            <div>
              <h4 className="font-semibold text-indigo-950">Excel template</h4>
              <p className="text-sm text-indigo-700">Use the template's columns so every field is picked up.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleDownloadTemplate} disabled={isDownloadingTemplate}>
              {isDownloadingTemplate ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
              Download Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium mb-1">File (.xlsx, .xls, .csv)</Label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                disabled={busy}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 border border-gray-300 rounded-md p-1 cursor-pointer"
              />
            </div>
            <div>
              <Label className="block text-sm font-medium mb-1">Import into this calculation</Label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as ImportMode)}
                disabled={busy}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                <option value="append">Add to the existing vehicles ({existingCount})</option>
                <option value="replace">Replace the existing vehicles</option>
              </select>
            </div>
          </div>

          {isPreviewing && (
            <div className="flex items-center gap-2 text-sm text-indigo-700">
              <Loader2 className="h-4 w-4 animate-spin" /> Reading {selectedFile?.name}…
            </div>
          )}

          {preview && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-semibold text-gray-800">{preview.fileName || selectedFile?.name}</h4>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-gray-200 rounded font-medium">Rows: {preview.totalDataRows ?? rows.length}</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Valid: {validVehicles.length}
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Skipped: {invalidCount}
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded font-medium">Warnings: {warningCount}</span>
                  )}
                </div>
              </div>

              {(preview.fileIssues || []).map((issue: any, i: number) => (
                <div key={i} className="text-sm text-red-700">{issue.message}</div>
              ))}
              {(preview.unrecognizedColumns || []).length > 0 && (
                <div className="text-xs text-amber-700">
                  Ignored columns (check the spelling): {preview.unrecognizedColumns.join(", ")}
                </div>
              )}

              {rows.length > 0 && (
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded bg-white">
                  <table className="min-w-full text-xs text-left">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2">Reg No</th>
                        <th className="px-3 py-2">Type / Cover</th>
                        <th className="px-3 py-2 text-right">Value</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rows.map((row: any, idx: number) => (
                        <tr key={idx} className={row.isValid ? "" : "bg-red-50"}>
                          <td className="px-3 py-2 font-mono">{row.rowNumber ?? idx + 1}</td>
                          <td className="px-3 py-2 font-medium">{row.vehicle?.vehicleRegNo || "—"}</td>
                          <td className="px-3 py-2">{[row.vehicle?.vehicleType, row.vehicle?.coverType].filter(Boolean).join(" / ") || "—"}</td>
                          <td className="px-3 py-2 text-right">
                            {row.vehicle?.vehicleValue != null ? Number(row.vehicle.vehicleValue).toLocaleString("en-NG") : "—"}
                          </td>
                          <td className="px-3 py-2">
                            {row.isValid ? <span className="text-green-700 font-semibold">OK</span> : <span className="text-red-700 font-semibold">Skipped</span>}
                            {(row.issues || []).map((issue: any, i: number) => (
                              <span key={i} className={`block ${issue.severity === "WARNING" ? "text-amber-700" : "text-red-600"}`}>
                                {issue.column ? `${issue.column}: ` : ""}{issue.message}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isImporting}>Cancel</Button>
          <Button type="button" onClick={handleImport} disabled={busy || validVehicles.length === 0}>
            {isImporting
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
              : `Import ${validVehicles.length || ""} vehicle${validVehicles.length === 1 ? "" : "s"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default UploadMotorVehiclesModal
