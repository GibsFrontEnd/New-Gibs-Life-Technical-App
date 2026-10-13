// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Paperclip, Upload, Download, Trash2, Eye, Search,
  File, FileText, FileImage, CheckCircle, AlertCircle,
  RefreshCw, X, Loader2, HardDrive, FolderOpen, FileBadge,
} from 'lucide-react';
import { SERVER_URL } from '../../../utils/constants';
import './PolicyAttachments.css';

/* ── Types ────────────────────────────────────────────────── */
// Matches AttachDocResponseDto from GET/POST /v1/Documents
interface AttachDocument {
  attachID: number;
  docNo: string | null;
  entryDate: string;
  docTypes: string | null;
  docFrom: string | null;
  docDetails: string | null;
  documentSize: number;
  active: number;
  optionType: string | null;
  submittedBy: string | null;
  submittedOn: string;
}

interface UploadForm {
  docTypes: string;
  docFrom: string;
  optionType: string;
  file: File | null;
}

/* ── Auth helpers ─────────────────────────────────────────── */
const getToken = () => localStorage.getItem('token') || '';
const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

/* ── Toast ────────────────────────────────────────────────── */
type ToastType = 'success' | 'error' | 'info';
interface ToastState { msg: string; type: ToastType; id: number }

const useToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<any>();
  const show = useCallback((msg: string, type: ToastType = 'info') => {
    clearTimeout(timer.current);
    setToast({ msg, type, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 4000);
  }, []);
  return { toast, show };
};

/* ── Utilities ────────────────────────────────────────────── */
const fmtDate = (iso: string) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-NG', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
};

const fmtSize = (bytes: number) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const MIME_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/zip': 'zip',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'text/plain': 'txt',
  'text/csv': 'csv',
};

const mimeToExt = (contentType: string | null): string | null => {
  if (!contentType) return null;
  const mime = contentType.split(';')[0].trim().toLowerCase();
  return MIME_EXT[mime] || null;
};

// The API no longer returns a file name/extension, so the icon is themed off docTypes instead.
const docTypeIconClass = (docTypes: string | null) => {
  switch ((docTypes || '').toUpperCase()) {
    case 'POLICY': return 'docx';
    case 'CLAIM': return 'pdf';
    case 'KYC': return 'img';
    case 'CORRESPONDENCE': return 'xlsx';
    default: return 'other';
  }
};

const FileTypeIcon: React.FC<{ docTypes: string | null }> = ({ docTypes }) => {
  const cls = docTypeIconClass(docTypes);
  const Icon = cls === 'img' ? FileImage : cls === 'pdf' ? FileBadge : FileText;
  return (
    <div className={`pa-file-icon ${cls}`}>
      <Icon size={18} />
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   UPLOAD MODAL
══════════════════════════════════════════════════════ */
interface UploadModalProps {
  policyNo: string;
  onClose: () => void;
  onUploaded: (doc: AttachDocument) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ policyNo, onClose, onUploaded }) => {
  const [form, setForm] = useState<UploadForm>({
    docTypes: 'POLICY',
    docFrom: 'CLIENT',
    optionType: '',
    file: null,
  });
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Resolve logged-in user */
  const getSubmittedBy = () => {
    try {
      const raw = localStorage.getItem('user') || localStorage.getItem('userInfo') || localStorage.getItem('currentUser');
      if (raw) {
        const p = JSON.parse(raw);
        return p.username ?? p.userName ?? p.email ?? p.name ?? 'Unknown';
      }
    } catch { /* ignore */ }
    return 'Unknown';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setForm(f => ({ ...f, file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.file) { setError('Please select a file to upload.'); return; }
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('DocNo', policyNo);
      fd.append('DocTypes', form.docTypes);
      fd.append('DocFrom', form.docFrom);
      fd.append('DocumentFile', form.file);
      fd.append('OptionType', form.optionType || 'POLICY');
      fd.append('SubmittedBy', getSubmittedBy());

      const url = `${SERVER_URL}/v1/Documents`;
      const res = await fetch(url, {
        method: 'POST',
        headers: authHeaders(), // no Content-Type — browser sets multipart boundary
        body: fd,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Upload failed (${res.status}): ${txt}`);
      }
      const doc: AttachDocument = await res.json();
      onUploaded(doc);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="pa-modal-backdrop" onClick={onClose}>
      <div className="pa-modal" onClick={e => e.stopPropagation()}>
        <div className="pa-modal-header">
          <h2><Upload size={16} /> Upload Document</h2>
          <button className="pa-modal-close" onClick={onClose}><X size={15} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="pa-modal-body">
            {/* Drop zone */}
            <div
              className={`pa-dropzone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                type="file"
                onChange={e => {
                  const file = e.target.files?.[0] || null;
                  setForm(f => ({ ...f, file }));
                }}
              />
              <div className="pa-dropzone-icon">
                <Upload size={20} />
              </div>
              {form.file ? (
                <div className="pa-file-chosen">
                  <CheckCircle size={13} />
                  {form.file.name} ({fmtSize(form.file.size)})
                </div>
              ) : (
                <div className="pa-dropzone-text">
                  <strong>Click to browse</strong> or drag & drop a file here
                  <br />
                  <span style={{ fontSize: '0.73rem' }}>PDF, Word, Excel, Images — any format</span>
                </div>
              )}
            </div>

            {/* Two-column fields */}
            <div className="pa-form-row">
              <div className="pa-form-field">
                <label>Document Type</label>
                <select value={form.docTypes} onChange={e => setForm(f => ({ ...f, docTypes: e.target.value }))}>
                  <option value="POLICY">Policy</option>
                  <option value="CLAIM">Claim</option>
                  <option value="KYC">KYC</option>
                  <option value="CORRESPONDENCE">Correspondence</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="pa-form-field">
                <label>Document From</label>
                <select value={form.docFrom} onChange={e => setForm(f => ({ ...f, docFrom: e.target.value }))}>
                  <option value="CLIENT">Client</option>
                  <option value="UNDERWRITER">Underwriter</option>
                  <option value="BROKER">Broker</option>
                  <option value="REINSURER">Reinsurer</option>
                  <option value="INTERNAL">Internal</option>
                </select>
              </div>
            </div>

            <div className="pa-form-field">
              <label>Option / Classification Tag</label>
              <input
                type="text"
                placeholder="e.g. RENEWAL, ENDORSE, SPRI…"
                value={form.optionType}
                onChange={e => setForm(f => ({ ...f, optionType: e.target.value }))}
              />
            </div>

            {error && (
              <div style={{ display:'flex', alignItems:'center', gap:6, color:'#dc2626', fontSize:'0.82rem',
                background:'#fef2f2', border:'1px solid #fecaca', borderRadius:6, padding:'0.5rem 0.75rem' }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </div>

          <div className="pa-modal-footer">
            <button type="button" className="pa-btn pa-btn-secondary" onClick={onClose} disabled={uploading}>
              Cancel
            </button>
            <button type="submit" className="pa-btn pa-btn-primary" disabled={uploading || !form.file}>
              {uploading ? <><span className="pa-spinner" />Uploading…</> : <><Upload size={14} />Upload</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   METADATA MODAL (detail view)
══════════════════════════════════════════════════════ */
interface MetaModalProps {
  doc: AttachDocument;
  onClose: () => void;
}

const MetaModal: React.FC<MetaModalProps> = ({ doc, onClose }) => (
  <div className="pa-modal-backdrop" onClick={onClose}>
    <div className="pa-modal" onClick={e => e.stopPropagation()}>
      <div className="pa-modal-header">
        <h2><Eye size={16} /> Document Details</h2>
        <button className="pa-modal-close" onClick={onClose}><X size={15} /></button>
      </div>
      <div className="pa-modal-body">
        {([
          ['Attach ID', doc.attachID],
          ['Policy / Doc No', doc.docNo],
          ['Document Size', fmtSize(doc.documentSize)],
          ['Document Type', doc.docTypes],
          ['Document From', doc.docFrom],
          ['Option Type', doc.optionType],
          ['Details', doc.docDetails || '—'],
          ['Submitted By', doc.submittedBy],
          ['Submitted On', fmtDate(doc.submittedOn)],
          ['Entry Date', fmtDate(doc.entryDate)],
          ['Status', doc.active === 1 ? 'Active' : 'Inactive'],
        ] as [string, any][]).map(([label, val]) => (
          <div key={label} style={{ display:'grid', gridTemplateColumns:'130px 1fr',
            gap:'0.5rem', fontSize:'0.82rem', padding:'0.35rem 0', borderBottom:'1px solid #f3f4f6' }}>
            <span style={{ color:'#6b7280', fontWeight:600 }}>{label}</span>
            <span style={{ color:'#111827', wordBreak:'break-all' }}>{String(val)}</span>
          </div>
        ))}
      </div>
      <div className="pa-modal-footer">
        <button className="pa-btn pa-btn-secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
const PolicyAttachments: React.FC = () => {
  const { policyNo } = useParams<{ policyNo: string }>();
  const { toast, show: showToast } = useToast();

  const [docs, setDocs] = useState<AttachDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [viewDoc, setViewDoc] = useState<AttachDocument | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  /* ── Fetch docs ── */
  const fetchDocs = useCallback(async () => {
    if (!policyNo) return;
    setLoading(true);
    setError(null);
    try {
      const url = `${SERVER_URL}/v1/Documents/docno?docNo=${encodeURIComponent(policyNo)}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (res.status === 404 || res.status === 204) {
        setDocs([]);
        return;
      }
      if (!res.ok) throw new Error(`Failed to load documents (${res.status})`);
      const data: AttachDocument[] = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [policyNo]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  /* ── Download ── */
  const handleDownload = async (doc: AttachDocument) => {
    setDownloadingId(doc.attachID);
    try {
      const url = `${SERVER_URL}/v1/Documents/${doc.attachID}/file`;
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Download failed (${res.status})`);

      // The /file endpoint always serves Content-Type: application/octet-stream
      // and a Content-Disposition filename hardcoded to "{docNo}.bin", regardless
      // of what was actually uploaded — a backend limitation, not something we can
      // read our way around. The one place the real original filename survives is
      // docDetails on the list/metadata endpoint (the API appears to auto-fill it
      // with the uploaded file's name), so prefer that when it looks like one.
      const looksLikeFilename = (s: string | null) => !!s && /\.[a-z0-9]{2,5}$/i.test(s.trim());
      let filename = `document-${doc.attachID}`;
      if (looksLikeFilename(doc.docDetails)) {
        filename = doc.docDetails!.trim();
      } else {
        const cd = res.headers.get('content-disposition');
        const match = cd && /filename\*?=(?:UTF-8'')?"?([^;"]+)"?/i.exec(cd);
        if (match?.[1]) {
          filename = decodeURIComponent(match[1]);
        } else {
          const ext = mimeToExt(res.headers.get('content-type'));
          if (ext) filename += `.${ext}`;
        }
      }

      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
      showToast('Download started!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Download failed', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (doc: AttachDocument) => {
    if (!window.confirm(`Delete this ${doc.docTypes || 'document'}?`)) return;
    setDeletingId(doc.attachID);
    try {
      const url = `${SERVER_URL}/v1/Documents/${doc.attachID}`;
      const res = await fetch(url, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      showToast('Document deleted', 'success');
      await fetchDocs();
    } catch (e: any) {
      showToast(e.message || 'Delete failed', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Stats ── */
  const totalSize = docs.reduce((s, d) => s + (d.documentSize || 0), 0);
  const activeCount = docs.filter(d => d.active === 1).length;
  const typeSet = new Set(docs.map(d => d.docTypes).filter(Boolean));

  /* ── Filter / search ── */
  const filtered = docs.filter(d => {
    if (filterType && d.docTypes !== filterType) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.docTypes?.toLowerCase().includes(q) ||
      d.docFrom?.toLowerCase().includes(q) ||
      d.docDetails?.toLowerCase().includes(q) ||
      d.submittedBy?.toLowerCase().includes(q)
    );
  });

  /* ── Render ── */
  return (
    <div className="pa-container">
      {/* ── Header ── */}
      <div className="pa-header">
        <div className="pa-header-left">
          <div className="pa-header-icon">
            <Paperclip size={22} color="white" />
          </div>
          <div className="pa-header-text">
            <h1>Policy Attachments</h1>
            <p>{policyNo ? `Policy ${policyNo} — attached documents` : 'Loading…'}</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.6rem', alignItems:'center' }}>
          <button className="pa-upload-btn" style={{ background:'#f3f4f6', color:'#374151',
            border:'1px solid #e5e7eb', boxShadow:'none' }}
            onClick={fetchDocs} disabled={loading}>
            {loading ? <span className="pa-spinner" style={{ borderColor:'#374151' }} /> : <RefreshCw size={14} />}
            Refresh
          </button>
          <button className="pa-upload-btn" onClick={() => setShowUpload(true)} disabled={loading}>
            <Upload size={14} /> Upload Document
          </button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="pa-stats">
        <div className="pa-stat-card">
          <div className="pa-stat-icon blue"><FolderOpen size={18} /></div>
          <div>
            <div className="pa-stat-value">{docs.length}</div>
            <div className="pa-stat-label">Total Docs</div>
          </div>
        </div>
        <div className="pa-stat-card">
          <div className="pa-stat-icon green"><CheckCircle size={18} /></div>
          <div>
            <div className="pa-stat-value">{activeCount}</div>
            <div className="pa-stat-label">Active</div>
          </div>
        </div>
        <div className="pa-stat-card">
          <div className="pa-stat-icon amber"><FileBadge size={18} /></div>
          <div>
            <div className="pa-stat-value">{typeSet.size}</div>
            <div className="pa-stat-label">Doc Types</div>
          </div>
        </div>
        <div className="pa-stat-card">
          <div className="pa-stat-icon purple"><HardDrive size={18} /></div>
          <div>
            <div className="pa-stat-value">{fmtSize(totalSize)}</div>
            <div className="pa-stat-label">Total Size</div>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="pa-filter-bar">
        <div className="pa-search-wrap">
          <Search size={14} className="pa-search-icon" />
          <input
            className="pa-search-input"
            placeholder="Search by type, source, details, submitter…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="pa-filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {[...typeSet].sort().map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="pa-loading">
          <Loader2 size={28} style={{ animation: 'pa-spin 0.65s linear infinite', color: '#4f46e5' }} />
          <span>Loading documents…</span>
        </div>
      ) : error ? (
        <div className="pa-error">
          <AlertCircle size={28} />
          <h3>Failed to load documents</h3>
          <p>{error}</p>
          <button className="pa-retry-btn" onClick={fetchDocs}>Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="pa-empty">
          <div className="pa-empty-icon">
            <Paperclip size={28} color="#6366f1" />
          </div>
          <h3>{search || filterType ? 'No results found' : 'No documents found'}</h3>
          <p>
            {search || filterType
              ? 'Try adjusting your search or filter.'
              : 'Upload the first document for this policy using the button above.'}
          </p>
        </div>
      ) : (
        <div className="pa-list">
          {filtered.map(doc => (
            <div key={doc.attachID} className={`pa-doc-card ${doc.active !== 1 ? 'deleted' : ''}`}>
              {/* Icon */}
              <FileTypeIcon docTypes={doc.docTypes} />

              {/* Meta */}
              <div className="pa-doc-meta">
                <div className="pa-doc-name" title={doc.docDetails || doc.docTypes || undefined}>
                  {doc.docDetails || doc.docTypes || `Document #${doc.attachID}`}
                </div>
                <div className="pa-doc-tags">
                  {doc.docTypes && <span className="pa-tag type">{doc.docTypes}</span>}
                  {doc.docFrom  && <span className="pa-tag from">{doc.docFrom}</span>}
                  {doc.optionType && <span className="pa-tag option">{doc.optionType}</span>}
                </div>
                <div className="pa-doc-info">
                  {doc.documentSize > 0 && <span>{fmtSize(doc.documentSize)}</span>}
                  {doc.submittedBy && <span>By {doc.submittedBy}</span>}
                  <span>{fmtDate(doc.submittedOn)}</span>
                  {doc.active !== 1 && <span style={{ color:'#dc2626', fontWeight:600 }}>Inactive</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="pa-doc-actions">
                {/* View metadata */}
                <button
                  className="pa-icon-btn"
                  title="View details"
                  onClick={() => setViewDoc(doc)}
                >
                  <Eye size={15} />
                </button>
                {/* Download */}
                <button
                  className="pa-icon-btn download"
                  title="Download file"
                  disabled={downloadingId === doc.attachID || doc.active !== 1}
                  onClick={() => handleDownload(doc)}
                >
                  {downloadingId === doc.attachID
                    ? <span className="pa-spinner" style={{ width:13, height:13 }} />
                    : <Download size={15} />}
                </button>
                {/* Delete */}
                {doc.active === 1 && (
                  <button
                    className="pa-icon-btn delete"
                    title="Delete document"
                    disabled={deletingId === doc.attachID}
                    onClick={() => handleDelete(doc)}
                  >
                    {deletingId === doc.attachID
                      ? <span className="pa-spinner" style={{ width:13, height:13 }} />
                      : <Trash2 size={15} />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {showUpload && (
        <UploadModal
          policyNo={policyNo!}
          onClose={() => setShowUpload(false)}
          onUploaded={doc => {
            setDocs(prev => [doc, ...prev]);
            setShowUpload(false);
            showToast(`Document uploaded successfully!`, 'success');
          }}
        />
      )}

      {viewDoc && (
        <MetaModal
          doc={viewDoc}
          onClose={() => setViewDoc(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`pa-toast ${toast.type}`} key={toast.id}>
          {toast.type === 'success' && <CheckCircle size={16} />}
          {toast.type === 'error'   && <AlertCircle size={16} />}
          {toast.type === 'info'    && <Paperclip   size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default PolicyAttachments;
