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

// SERVER_URL already includes /api, so we just append the remaining path segments
const DOCUMENTS_API = `${SERVER_URL}/v1/Documents`;
const DOCUMENTS_BY_DOC_NO_API = `${SERVER_URL}/v1/Documents/docno`;

// Async thunks
export const fetchDocuments = createAsyncThunk(
  "documents/fetchDocuments",
  async (docNo: string, { rejectWithValue }) => {
    try {
      if (!docNo) {
        throw new Error("Document number is required");
      }

      console.log("📥 Fetching documents for proposal:", docNo);

      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers: HeadersInit = {
        accept: "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const apiUrl = `${DOCUMENTS_BY_DOC_NO_API}?docNo=${encodeURIComponent(
        docNo
      )}`;
      console.log("📥 Fetch URL:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers,
      });

      console.log("📥 Fetch response:", response.status, response.statusText);

      if (!response.ok) {
        // Backend returns 400/404 when no documents exist yet – treat as empty instead of error
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

      let normalizedDocuments: Document[] = [];

      if (Array.isArray(rawResult)) {
        normalizedDocuments = rawResult as Document[];
      } else if (Array.isArray(rawResult?.data)) {
        normalizedDocuments = rawResult.data as Document[];
      } else if (Array.isArray(rawResult?.result)) {
        normalizedDocuments = rawResult.result as Document[];
      } else if (Array.isArray(rawResult?.documents)) {
        normalizedDocuments = rawResult.documents as Document[];
      } else if (rawResult && typeof rawResult === "object") {
        normalizedDocuments = [rawResult as Document];
      }

      console.log("📄 Normalized documents:", normalizedDocuments);
      return normalizedDocuments;
    } catch (error: any) {
      console.error("❌ Fetch error:", error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchDocumentById = createAsyncThunk(
  "documents/fetchDocumentById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${DOCUMENTS_API}/${id}`, {
        method: "GET",
        headers: {
          accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch document");
      }

      return (await response.json()) as Document;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

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

      console.log("📤 API URL:", `${DOCUMENTS_API}`);

      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers: HeadersInit = {};

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        console.log("🔑 Auth token found");
      } else {
        console.warn("⚠️ No auth token found");
      }

      const response = await fetch(`${DOCUMENTS_API}`, {
        method: "POST",
        headers,
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
        // If the response is not JSON but status is OK, treat as success
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
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update document");
      }

      return (await response.json()) as Document;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteDocument = createAsyncThunk(
  "documents/deleteDocument",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${DOCUMENTS_API}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const downloadDocumentFile = createAsyncThunk(
  "documents/downloadDocumentFile",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${DOCUMENTS_API}/${id}/file`);

      if (!response.ok) {
        throw new Error("Failed to download document file");
      }

      return await response.blob();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

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
      // Fetch documents
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
      // Fetch document by ID
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
      // Create document
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
      // Update document
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
          if (index !== -1) {
            state.documents[index] = action.payload;
          }
          if (state.currentDocument?.attachID === action.payload.attachID) {
            state.currentDocument = action.payload;
          }
        }
      )
      .addCase(updateDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete document
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
  },
});

export const { clearError, clearCurrentDocument } = documentSlice.actions;
export default documentSlice.reducer;
