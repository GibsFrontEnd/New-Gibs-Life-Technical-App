/// src/features/reducers/documentReducers/documentSlice.ts
//@ts-nocheck

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  Document,
  DocumentState,
  CreateDocumentRequest,
  UpdateDocumentRequest,
} from "../../../types/document";
import { SERVER_URL } from "../../../utils/constants";

const initialState: DocumentState = {
  documents: [],
  currentDocument: null,
  loading: false,
  error: null,
};

// SERVER_URL already includes /api
const DOCUMENTS_API = `${SERVER_URL}/v1/Documents`;
const DOCUMENTS_BY_DOC_NO_API = `${SERVER_URL}/v1/Documents/docno`;

// ---- Auth helper -----------------------------------------------------------
const buildAuthHeaders = (extra: HeadersInit = {}): HeadersInit => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  const headers: HeadersInit = { accept: "application/json", ...extra };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
};

// ---- Response normalizer ---------------------------------------------------
const normalizeDocumentsResponse = (rawResult: any): Document[] => {
  if (Array.isArray(rawResult)) return rawResult as Document[];
  if (Array.isArray(rawResult?.data)) return rawResult.data as Document[];
  if (Array.isArray(rawResult?.result)) return rawResult.result as Document[];
  if (Array.isArray(rawResult?.documents)) return rawResult.documents as Document[];
  if (rawResult && typeof rawResult === "object") return [rawResult as Document];
  return [];
};

// ============================================================================
// FETCH ALL DOCUMENTS  →  GET /api/v1/Documents
// ============================================================================
export const fetchAllDocuments = createAsyncThunk(
  "documents/fetchAllDocuments",
  async (_: void | undefined, { rejectWithValue }) => {
    try {
      console.log("📥 Fetching ALL documents");

      const response = await fetch(DOCUMENTS_API, {
        method: "GET",
        headers: buildAuthHeaders(),
      });

      console.log("📥 Fetch-all response:", response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 400 || response.status === 404) {
          console.warn("⚠️ No documents found – treating as empty list");
          return [];
        }
        const errorText = await response.text();
        throw new Error(`Failed to fetch documents: ${response.status} ${errorText}`);
      }

      const rawResult = await response.json();
      const normalized = normalizeDocumentsResponse(rawResult);
      console.log("📄 Normalized documents (all):", normalized);
      return normalized;
    } catch (error: any) {
      console.error("❌ Fetch-all error:", error);
      return rejectWithValue(error.message);
    }
  }
);

// ============================================================================
// FETCH DOCUMENTS (smart)  →  docNo given: /Documents/docno?docNo=...
//                            docNo empty: /Documents
// ============================================================================
export const fetchDocuments = createAsyncThunk(
  "documents/fetchDocuments",
  async (docNo: string | undefined, { rejectWithValue }) => {
    try {
      const trimmed = (docNo ?? "").trim();
      const hasDocNo = trimmed.length > 0;

      const apiUrl = hasDocNo
        ? `${DOCUMENTS_BY_DOC_NO_API}?docNo=${encodeURIComponent(trimmed)}`
        : DOCUMENTS_API;

      console.log(
        hasDocNo
          ? `📥 Fetching documents for proposal: ${trimmed}`
          : "📥 Fetching ALL documents (no docNo filter)"
      );
      console.log("📥 Fetch URL:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: buildAuthHeaders(),
      });

      console.log("📥 Fetch response:", response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 400 || response.status === 404) {
          console.warn(
            "⚠️ Documents endpoint returned",
            response.status,
            "– treating as empty list"
          );
          return [];
        }
        const errorText = await response.text();
        console.error("❌ Fetch failed:", errorText);
        throw new Error(`Failed to fetch documents: ${response.status}`);
      }

      const rawResult = await response.json();
      console.log("✅ Fetched documents (raw):", rawResult);

      const normalized = normalizeDocumentsResponse(rawResult);
      console.log("📄 Normalized documents:", normalized);
      return normalized;
    } catch (error: any) {
      console.error("❌ Fetch error:", error);
      return rejectWithValue(error.message);
    }
  }
);

// ============================================================================
// FETCH DOCUMENT BY ID  →  GET /api/v1/Documents/{id}
// ============================================================================
export const fetchDocumentById = createAsyncThunk(
  "documents/fetchDocumentById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${DOCUMENTS_API}/${id}`, {
        method: "GET",
        headers: buildAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.status}`);
      }

      return (await response.json()) as Document;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ============================================================================
// CREATE  →  POST /api/v1/Documents  (multipart/form-data)
// ============================================================================
export const createDocument = createAsyncThunk(
  "documents/createDocument",
  async (documentData: CreateDocumentRequest, { rejectWithValue }) => {
    try {
      console.log("📤 Uploading document:", {
        DocNo: documentData.DocNo,
        DocTypes: documentData.DocTypes,
        SubmittedBy: documentData.SubmittedBy,
        fileName: documentData.DocumentFile?.name,
        fileSize: documentData.DocumentFile?.size,
      });

      const formData = new FormData();
      formData.append("DocNo", documentData.DocNo);
      formData.append("DocTypes", documentData.DocTypes);
      formData.append("DocFrom", documentData.DocFrom);
      formData.append("DocumentFile", documentData.DocumentFile);
      formData.append("OptionType", documentData.OptionType);
      formData.append("SubmittedBy", documentData.SubmittedBy);

      // NOTE: do NOT set Content-Type manually — browser must add the multipart boundary.
      const headers = buildAuthHeaders();
      delete (headers as any)["accept"]; // not required, harmless if left
      // Actually keep accept if you want; formData works either way.

      const response = await fetch(DOCUMENTS_API, {
        method: "POST",
        headers: buildAuthHeaders(),
        body: formData,
      });

      console.log("📥 Response status:", response.status, response.statusText);

      if (!response.ok) {
        let errorText = "";
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = "Unable to read error response";
        }
        console.error("❌ Upload failed:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        throw new Error(
          `Failed to upload document (${response.status}): ${
            errorText || response.statusText
          }`
        );
      }

      let result;
      try {
        result = await response.json();
        console.log("✅ Upload successful:", result);
      } catch (e) {
        console.warn("⚠️ Response is not JSON, assuming success");
        result = {
          DocNo: documentData.DocNo,
          DocTypes: documentData.DocTypes,
          message: "Document uploaded successfully",
        };
      }

      return result as Document;
    } catch (error: any) {
      console.error("❌ Upload error:", error);
      return rejectWithValue(error.message);
    }
  }
);

// ============================================================================
// UPDATE  →  PUT /api/v1/Documents/{id}  (multipart/form-data)
// ============================================================================
export const updateDocument = createAsyncThunk(
  "documents/updateDocument",
  async (
    { id, documentData }: { id: number; documentData: UpdateDocumentRequest },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append("DocNo", documentData.DocNo);
      formData.append("EntryDate", documentData.EntryDate);
      formData.append("DocTypes", documentData.DocTypes);
      formData.append("DocFrom", documentData.DocFrom);
      formData.append("DocDetails", documentData.DocDetails);
      formData.append("Active", documentData.Active.toString());
      formData.append("OptionType", documentData.OptionType);

      if (documentData.DocumentFile) {
        formData.append("DocumentFile", documentData.DocumentFile);
      }

      const response = await fetch(`${DOCUMENTS_API}/${id}`, {
        method: "PUT",
        headers: buildAuthHeaders(),
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to update document: ${response.status}`);
      }

      // 204 No Content → nothing to parse
      if (response.status === 204) {
        return {
          attachID: id,
          ...documentData,
        } as unknown as Document;
      }

      return (await response.json()) as Document;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ============================================================================
// DELETE  →  DELETE /api/v1/Documents/{id}
// ============================================================================
export const deleteDocument = createAsyncThunk(
  "documents/deleteDocument",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${DOCUMENTS_API}/${id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete document: ${response.status}`);
      }

      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ============================================================================
// DOWNLOAD FILE  →  GET /api/v1/Documents/{id}/file
// ============================================================================
export const downloadDocumentFile = createAsyncThunk(
  "documents/downloadDocumentFile",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${DOCUMENTS_API}/${id}/file`, {
        method: "GET",
        headers: buildAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to download document file");
      }

      return await response.blob();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ============================================================================
// SLICE
// ============================================================================
const documentSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentDocument: (state) => {
      state.currentDocument = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ---- Fetch ALL documents ----
      .addCase(fetchAllDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllDocuments.fulfilled,
        (state, action: PayloadAction<Document[]>) => {
          state.loading = false;
          state.documents = action.payload;
        }
      )
      .addCase(fetchAllDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---- Fetch documents (smart: all or by docNo) ----
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchDocuments.fulfilled,
        (state, action: PayloadAction<Document[]>) => {
          state.loading = false;
          state.documents = action.payload;
        }
      )
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---- Fetch document by ID ----
      .addCase(fetchDocumentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchDocumentById.fulfilled,
        (state, action: PayloadAction<Document>) => {
          state.loading = false;
          state.currentDocument = action.payload;
        }
      )
      .addCase(fetchDocumentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---- Create ----
      .addCase(createDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createDocument.fulfilled,
        (state, action: PayloadAction<Document>) => {
          state.loading = false;
          state.documents.push(action.payload);
        }
      )
      .addCase(createDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---- Update ----
      .addCase(updateDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateDocument.fulfilled,
        (state, action: PayloadAction<Document>) => {
          state.loading = false;
          const index = state.documents.findIndex(
            (doc) => doc.attachID === action.payload.attachID
          );
          if (index !== -1) state.documents[index] = action.payload;
          if (state.currentDocument?.attachID === action.payload.attachID) {
            state.currentDocument = action.payload;
          }
        }
      )
      .addCase(updateDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ---- Delete ----
      .addCase(deleteDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteDocument.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.loading = false;
          state.documents = state.documents.filter(
            (doc) => doc.attachID !== action.payload
          );
          if (state.currentDocument?.attachID === action.payload) {
            state.currentDocument = null;
          }
        }
      )
      .addCase(deleteDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // downloadDocumentFile: no state change needed
  },
});

export const { clearError, clearCurrentDocument } = documentSlice.actions;
export default documentSlice.reducer;