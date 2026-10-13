// src/components/groupLife/AttachmentsTab.tsx
// @ts-nocheck

import React, { useState, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/use-apps";
import {
  fetchDocuments,
  createDocument,
  deleteDocument,
  downloadDocumentFile,
  clearError,
} from "../../features/reducers/documentReducers/documentSlice";
import { CreateDocumentRequest, Document } from "../../types/document";
import { useToast } from "../../hooks/use-toast";

interface AttachmentsTabProps {
  policyNo: string;
  className?: string;
}

const AttachmentsTab: React.FC<AttachmentsTabProps> = ({
  policyNo,
  className = "",
}) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { documents, loading, error } = useAppSelector((state) => state.documents);

  const safeDocuments = Array.isArray(documents) ? documents : [];

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUpload = Boolean(policyNo);

  // Filter to only documents that belong to this policy
  const filteredDocuments = safeDocuments.filter(
    (doc) => !policyNo || doc.docNo === policyNo
  );

  const documentTypes = [
    "AGENCY ONBOARDING",
    "IDENTIFICATION",
    "PROOF OF ADDRESS",
    "EDUCATIONAL CERTIFICATE",
    "FINANCIAL DOCUMENT",
    "CONTRACT",
    "PICTURE",
    "OTHER",
  ];

  // ===== EFFECTS =====

  useEffect(() => {
    if (policyNo) {
      dispatch(fetchDocuments(policyNo));
    }
  }, [dispatch, policyNo]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => dispatch(clearError()), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // ===== HANDLERS =====

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (!policyNo) {
      toast({
        title: "Missing policy",
        description: "Cannot upload without a policy number.",
        variant: "destructive",
      });
      return;
    }

    const currentUser =
      localStorage.getItem("agentId") ||
      localStorage.getItem("userId") ||
      "portal_user";

    const documentData: CreateDocumentRequest = {
      DocNo: policyNo,
      DocTypes: selectedDocType || getDocumentType(file.name),
      DocFrom: "Group Life Policy",
      DocumentFile: file,
      OptionType: "PolicyDoc",
      SubmittedBy: currentUser,
    };

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      setUploadProgress(0);
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => (prev >= 90 ? 90 : prev + 10));
      }, 200);

      await dispatch(createDocument(documentData)).unwrap();

      if (progressInterval) clearInterval(progressInterval);
      setUploadProgress(100);

      toast({
        title: "Success",
        description: "Document uploaded successfully",
        variant: "success",
      });

      setShowUploadModal(false);

      if (fileInputRef.current) fileInputRef.current.value = "";

      dispatch(fetchDocuments(policyNo));
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err: any) {
      console.error("Upload failed:", err);
      if (progressInterval) clearInterval(progressInterval);
      setUploadProgress(0);

      toast({
        title: "Upload Failed",
        description: err?.message || "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (docItem: Document) => {
    try {
      const blob = await dispatch(
        downloadDocumentFile(docItem.attachID)
      ).unwrap();

      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = docItem.docDetails || `document-${docItem.attachID}`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      toast({
        title: "Download Failed",
        description: "Failed to download document.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (docItem: Document) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${docItem.docDetails || docItem.docNo}"?`
      )
    ) {
      return;
    }

    try {
      await dispatch(deleteDocument(docItem.attachID)).unwrap();

      toast({
        title: "Success",
        description: "Document deleted successfully",
        variant: "success",
      });

      if (policyNo) dispatch(fetchDocuments(policyNo));
    } catch (err) {
      console.error("Delete failed:", err);
      toast({
        title: "Delete Failed",
        description: "Failed to delete document.",
        variant: "destructive",
      });
    }
  };

  // ===== HELPERS =====

  const getDocumentType = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase();
    const typeMap: { [key: string]: string } = {
      pdf: "PDF Document",
      doc: "Word Document",
      docx: "Word Document",
      jpg: "Image",
      jpeg: "Image",
      png: "Image",
      xls: "Excel Spreadsheet",
      xlsx: "Excel Spreadsheet",
      txt: "Text File",
    };
    return typeMap[ext || ""] || "Other";
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (docType: string): string => {
    const iconMap: { [key: string]: string } = {
      "PDF Document": "📄",
      "Word Document": "📝",
      Image: "🖼️",
      "Excel Spreadsheet": "📊",
      "Text File": "📃",
      "AGENCY ONBOARDING": "🏢",
      IDENTIFICATION: "🆔",
      "PROOF OF ADDRESS": "🏠",
      "EDUCATIONAL CERTIFICATE": "🎓",
      "FINANCIAL DOCUMENT": "💰",
      CONTRACT: "📑",
      PICTURE: "🖼️",
    };
    return iconMap[docType] || "📎";
  };

  // ===== LOADING =====

  if (loading && filteredDocuments.length === 0) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading attachments...</span>
        </div>
      </div>
    );
  }

  // ===== RENDER =====

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
          <p className="text-gray-500 text-sm mt-1">
            {canUpload
              ? `Documents for policy ${policyNo}`
              : "Select a policy to manage attachments."}
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          disabled={!canUpload}
          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center ${
            canUpload
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          <span className="mr-2">+</span>
          Upload Documents
        </button>
      </div>

      {!canUpload && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          Select or create a policy to enable document uploads.
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="text-sm text-red-700 mt-1">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      {filteredDocuments.length > 0 ? (
        <div className="grid gap-4">
          {filteredDocuments.map((docItem) => (
            <div
              key={docItem.attachID}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="text-2xl">{getFileIcon(docItem.docTypes)}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {docItem.docDetails || docItem.docNo || "Untitled"}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {docItem.docTypes}
                    </span>
                    <span>{formatFileSize(docItem.documentSize)}</span>
                    <span>•</span>
                    <span>Policy: {docItem.docNo}</span>
                    <span>•</span>
                    <span>Uploaded {formatDate(docItem.submittedOn)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleDownload(docItem)}
                  className="text-blue-600 hover:text-blue-800 p-2 rounded transition-colors duration-200"
                  title="Download"
                >
                  ⬇️
                </button>
                <button
                  onClick={() => handleDelete(docItem)}
                  className="text-red-600 hover:text-red-800 p-2 rounded transition-colors duration-200"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-6xl mb-4">📁</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No attachments found
          </h4>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            {policyNo
              ? `No documents have been uploaded for policy ${policyNo} yet.`
              : "No documents have been uploaded yet."}
          </p>
          {canUpload && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Upload Documents
            </button>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Upload Document</h3>

            {uploadProgress > 0 ? (
              <div className="space-y-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  {uploadProgress < 100 ? "Uploading..." : "Upload Complete!"}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Type
                  </label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Auto-detect from file</option>
                    {documentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                    canUpload
                      ? "border-gray-300 cursor-pointer hover:border-blue-400"
                      : "border-gray-200 cursor-not-allowed bg-gray-50"
                  }`}
                  onClick={() => {
                    if (canUpload) handleFileSelect();
                  }}
                >
                  <div className="text-4xl mb-4">📄</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Click to select file
                  </h4>
                  <p className="text-gray-500">
                    {canUpload
                      ? "Supported formats: PDF, DOC, DOCX, JPG, PNG, XLS, TXT"
                      : "Select a policy to enable uploads"}
                  </p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.txt"
                  disabled={!canUpload}
                />

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentsTab;