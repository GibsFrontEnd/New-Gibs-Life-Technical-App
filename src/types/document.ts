//@ts-nocheck


export interface Document {
  attachID: number;
  docNo: string;
  entryDate: string;
  docTypes: string;
  docFrom: string;
  docDetails: string;
  documentSize: number;
  active: number;
  optionType: string;
  submittedBy: string;
  submittedOn: string;
}

export interface CreateDocumentRequest {
  DocNo: string;
  DocTypes: string;
  DocFrom: string;
  DocumentFile: File;
  OptionType: string;
  SubmittedBy: string;
}

export interface UpdateDocumentRequest {
  DocNo: string;
  EntryDate: string;
  DocTypes: string;
  DocFrom: string;
  DocDetails: string;
  DocumentFile?: File;
  Active: number;
  OptionType: string;
}

export interface DocumentState {
  documents: Document[];
  currentDocument: Document | null;
  loading: boolean;
  error: string | null;
}