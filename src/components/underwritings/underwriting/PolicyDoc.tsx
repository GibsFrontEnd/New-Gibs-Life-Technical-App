// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import {
  FileText,
  Download,
  Save,
  RefreshCw,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileCode2,
  Sparkles,
  RotateCcw,
  ChevronRight,
  Upload,
} from 'lucide-react';
// import { policyDocService, PolicyDocListItem, PolicyDocDetail } from '../../../services/policyDoc.service';
// import * as mammoth from 'mammoth';
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';
import './PolicyDoc.css';
// import { openDocx, patchAndRebuild, base64ToDocxBlob, DocxContext } from '../../../utils/docxPatcher';

/* ── Mini Toast ── */
type ToastType = 'success' | 'error' | 'info' | 'warning';
interface ToastState { msg: string; type: ToastType; id: number }

const useToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerId = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback((msg: string, type: ToastType = 'info') => {
    clearTimeout(timerId.current);
    setToast({ msg, type, id: Date.now() });
    timerId.current = setTimeout(() => setToast(null), 4000);
  }, []);

  return { toast, show };
};

/* ── Utility ── */
const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('en-NG', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
};

const truncate = (str: string, n = 28) => str.length > n ? str.slice(0, n) + '…' : str;

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════ */
const PolicyDoc = () => {
  const { policyNo } = useParams<{ policyNo: string }>();
  const { isReadOnly } = (useOutletContext() as any) || {};

  /* Data state */
  const [docBase64, setDocBase64] = useState<string>('');
  const [previewHtml, setPreviewHtml] = useState('');

  const [docList, setDocList] = useState<PolicyDocListItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<PolicyDocDetail | null>(null);
  const [activeDocId, setActiveDocId] = useState<number | null>(null);

  /* JSZip context — holds the open ZIP + original XML + original text runs */
  const docxContextRef = useRef<DocxContext | null>(null);

  /* Mode */
  const [mode, setMode] = useState<'idle' | 'unsaved_preview' | 'saved_preview'>('idle');

  /* Loading flags */
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  /* Toast */
  const { toast, show: showToast } = useToast();

  /* ── Fetch doc list on mount ── */
  useEffect(() => {
    if (policyNo) fetchDocList();
  }, [policyNo]);

  const fetchDocList = async () => {
    if (!policyNo) return;
    setLoadingList(true);
    try {
      const list = await policyDocService.listDocs(policyNo);
      setDocList(Array.isArray(list) ? list : []);
    } catch (e: any) {
      showToast(e.message || 'Failed to load document history', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  /* ── Load DOCX: open JSZip context + render Mammoth preview ── */
  const loadDocxFromBase64 = async (base64Str: string) => {
    // 1. Open the DOCX as a JSZip and store the context for later patching
    const context = await openDocx(base64Str);
    docxContextRef.current = context;

    // 2. Convert to Uint8Array for Mammoth
    const binary = atob(base64Str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    // 3. Render HTML preview with Mammoth (alignment + heading style maps)
    const options = {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Heading 5'] => h5:fresh",
        "p[style-name='Heading 6'] => h6:fresh",
        "p[style-name='Title'] => h1.title:fresh",
        "p[style-name='Subtitle'] => h2.subtitle:fresh",
        "p[style-name='align-center'] => p.ql-align-center:fresh",
        "p[style-name='align-right'] => p.ql-align-right:fresh",
        "p[style-name='align-justify'] => p.ql-align-justify:fresh",
      ],
      transformDocument: mammoth.transforms.paragraph((paragraph: any) => {
        if (paragraph.alignment) {
          return {
            ...paragraph,
            styleId: `align-${paragraph.alignment}`,
            styleName: `align-${paragraph.alignment}`,
          };
        }
        return paragraph;
      }),
      convertImage: mammoth.images.imgElement((image: any) => {
        return image.read('base64').then((imageBuffer: string) => ({
          src: `data:${image.contentType};base64,${imageBuffer}`,
        }));
      }),
    };

    const result = await mammoth.convertToHtml({ arrayBuffer: bytes.buffer }, options);
    setPreviewHtml(result.value);
  };

  /* ── Load fresh template ── */
  const handleLoadTemplate = async () => {
    if (!policyNo) return;
    setLoadingTemplate(true);
    setMode('unsaved_preview');
    setActiveDocId(null);
    setPreviewHtml('');
    setDocBase64('');
    docxContextRef.current = null;

    try {
      const res = await policyDocService.getTemplate(policyNo);
      if (!res.success) {
        showToast(res.message || 'Failed to load template', 'error');
        setMode('idle');
        return;
      }

      if (res.htmlContent) {
        setPreviewHtml(res.htmlContent);
      } else if (res.wordDocumentBase64) {
        setDocBase64(res.wordDocumentBase64);
        await loadDocxFromBase64(res.wordDocumentBase64);
      }
      showToast('Template loaded. Edit and save below.', 'info');
    } catch (e: any) {
      showToast(e.message || 'Failed to load template', 'error');
      setMode('idle');
    } finally {
      setLoadingTemplate(false);
    }
  };

  /* ── Build patched DOCX base64 from current editor state ── */
  const buildPatchedDocx = async (): Promise<string> => {
    if (!docxContextRef.current) {
      throw new Error('No document context available. Please reload the template.');
    }
    if (!previewHtml) {
      throw new Error('Editor is empty — nothing to save.');
    }
    return patchAndRebuild(docxContextRef.current, previewHtml);
  };

  /* ── Download current working doc (patched or saved) ── */
  const handleDownloadWorkingDoc = async () => {
    if (mode === 'saved_preview' && activeDocId) {
      setDownloadingId(activeDocId);
      try {
        await policyDocService.downloadDoc(activeDocId, `Policy_${policyNo}_${activeDocId}.docx`);
        showToast('Download started!', 'success');
      } catch (e: any) {
        showToast(e.message || 'Download failed', 'error');
      } finally {
        setDownloadingId(null);
      }
      return;
    }

    if (!docxContextRef.current) {
      showToast('Please save the document before downloading.', 'info');
      return;
    }
    try {
      const newBase64 = await buildPatchedDocx();
      const blob = base64ToDocxBlob(newBase64);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Policy_${policyNo}_edited.docx`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Download started!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Download failed', 'error');
      console.error(err);
    }
  };

  /* ── Handle File Re-Upload ── */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      setDocBase64(base64);
      await loadDocxFromBase64(base64);
      showToast('Document uploaded and preview updated!', 'success');
      setMode('unsaved_preview');
      setActiveDocId(null);
    } catch (err) {
      showToast('Failed to read file', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  /* ── Save doc (POST HTML & base64 if present) ── */
  const handleSave = async () => {
    if (!policyNo) {
      showToast('Policy number missing.', 'error');
      return;
    }
    setLoadingSave(true);
    try {
      await policyDocService.saveDoc(policyNo, previewHtml, docBase64 || null);
      showToast('Document saved successfully!', 'success');
      setMode('idle');
      setDocBase64('');
      setPreviewHtml('');
      docxContextRef.current = null;
      await fetchDocList();
    } catch (e: any) {
      showToast(e.message || 'Failed to save document', 'error');
    } finally {
      setLoadingSave(false);
    }
  };

  /* ── Preview a saved doc ── */
  const handlePreviewSaved = async (doc: PolicyDocListItem) => {
    setLoadingPreview(true);
    setActiveDocId(doc.id);
    setMode('saved_preview');
    setPreviewHtml('');
    setDocBase64('');
    docxContextRef.current = null;
    try {
      const editRes = await policyDocService.getDocForEdit(doc.id);
      setSelectedDoc(editRes);
      if (editRes && editRes.htmlContent) {
        setPreviewHtml(editRes.htmlContent);
      }
      if (editRes && editRes.wordDocumentBase64) {
        setDocBase64(editRes.wordDocumentBase64);
      }
      if (!editRes || (!editRes.htmlContent && !editRes.wordDocumentBase64)) {
        showToast('Document data is empty.', 'warning');
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to load preview', 'error');
    } finally {
      setLoadingPreview(false);
    }
  };

  /* ── Save changes to an existing document ── */
  const handleUpdateSaved = async () => {
    if (!activeDocId) return;
    setLoadingSave(true);
    try {
      await policyDocService.updateDocHtml(activeDocId, previewHtml);
      showToast('Document updated successfully!', 'success');
      await fetchDocList();
    } catch (e: any) {
      showToast(e.message || 'Failed to update document', 'error');
    } finally {
      setLoadingSave(false);
    }
  };

  /* ── Download Saved Doc ── */
  const handleDownloadSaved = async (doc: PolicyDocListItem) => {
    setDownloadingId(doc.id);
    try {
      await policyDocService.downloadDoc(doc.id, `Policy_${doc.policyNo}_${doc.id}.docx`);
      showToast('Download started!', 'success');
    } catch (e: any) {
      showToast(e.message || 'Download failed', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  /* ── Cancel ── */
  const handleCancel = () => {
    setMode('idle');
    setDocBase64('');
    setPreviewHtml('');
    setActiveDocId(null);
    setSelectedDoc(null);
    docxContextRef.current = null;
  };

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div className="pd-container">
      {/* ── Header ── */}
      <div className="pd-header">
        <div className="pd-header-left">
          <div className="pd-header-icon">
            <FileText size={26} color="white" />
          </div>
          <div className="pd-header-text">
            <h1>Policy Documents</h1>
            <p>
              {policyNo
                ? `Policy ${policyNo} — Document centre`
                : 'Loading...'}
            </p>
          </div>
        </div>

        <div className="pd-header-actions">
          {mode === 'unsaved_preview' || mode === 'saved_preview' ? (
            <>
              <button
                className="pd-btn pd-btn-secondary"
                onClick={handleCancel}
                disabled={loadingSave}
              >
                <RotateCcw size={14} />
                Close Preview
              </button>
              {mode === 'unsaved_preview' && (
                <button
                  className="pd-btn pd-btn-success"
                  onClick={handleSave}
                  disabled={loadingSave || !previewHtml}
                >
                  {loadingSave ? (
                    <><div className="pd-spinner" />Saving…</>
                  ) : (
                    <><Save size={14} />Save Document</>
                  )}
                </button>
              )}
              {mode === 'saved_preview' && !isReadOnly && (
                <button
                  className="pd-btn pd-btn-success"
                  onClick={handleUpdateSaved}
                  disabled={loadingSave || !previewHtml}
                >
                  {loadingSave ? (
                    <><div className="pd-spinner" />Saving…</>
                  ) : (
                    <><Save size={14} />Save Changes</>
                  )}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                className="pd-btn pd-btn-secondary"
                onClick={fetchDocList}
                disabled={loadingList}
              >
                {loadingList ? <div className="pd-spinner" /> : <RefreshCw size={14} />}
                Refresh
              </button>
              {!isReadOnly && (
                <button
                  className="pd-btn pd-btn-primary"
                  onClick={handleLoadTemplate}
                  disabled={loadingTemplate}
                >
                  {loadingTemplate ? (
                    <><div className="pd-spinner" />Loading…</>
                  ) : (
                    <><Sparkles size={14} />New Document</>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="pd-layout">
        {/* ── Left: Preview Area ── */}
        <div className="pd-editor-panel">
          <div className="pd-editor-toolbar">
            <div className="pd-editor-toolbar-left">
              <span className="pd-editor-label">
                Document Preview
              </span>
              <span className={`pd-editor-badge ${mode === 'unsaved_preview' ? 'editing' : ''}`}>
                {mode === 'unsaved_preview' ? 'Unsaved' : mode === 'saved_preview' ? 'Saved' : 'Ready'}
              </span>
            </div>
            {(mode === 'unsaved_preview' || mode === 'saved_preview') && (
              <div className="pd-toolbar-actions" style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="pd-btn pd-btn-secondary"
                  onClick={handleDownloadWorkingDoc}
                  title="Download edited DOCX"
                >
                  <Download size={14} /> Download
                </button>
                {!isReadOnly && (
                  <>
                    <label className="pd-btn pd-btn-secondary" style={{ cursor: 'pointer' }}>
                      <Upload size={14} />
                      {uploading ? 'Uploading...' : 'Re-Upload'}
                      <input
                        type="file"
                        accept=".docx"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Preview View */}
          {(mode === 'unsaved_preview' || mode === 'saved_preview') && (
            <div className="pd-preview-area" style={{ position: 'relative', padding: '1.5rem', backgroundColor: '#f9fafb', minHeight: '500px', overflowY: 'auto' }}>
              {(loadingTemplate || loadingPreview) && (
                <div className="pd-loading-overlay" style={{ borderRadius: '8px' }}>
                  <Loader2 size={28} style={{ animation: 'pd-spin 0.7s linear infinite', color: '#4f46e5' }} />
                  <p>Loading preview…</p>
                </div>
              )}
              {previewHtml !== null && (previewHtml !== '' || mode === 'unsaved_preview' || mode === 'saved_preview') ? (
                <div className="policy-document-editor-container">
                  <ReactQuill
                    theme="snow"
                    value={previewHtml}
                    onChange={setPreviewHtml}
                    readOnly={isReadOnly}
                    modules={{
                      toolbar: isReadOnly ? false : [
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        [{ 'align': [] }],
                        [{ 'color': [] }, { 'background': [] }],
                        ['clean'],
                      ],
                    }}
                  />
                </div>
              ) : !(loadingPreview || loadingTemplate) ? (
                <div className="pd-editor-empty" style={{ minHeight: 320 }}>
                  <div className="pd-editor-empty-icon">
                    <Eye size={32} color="#4f46e5" />
                  </div>
                  <h3>No preview available</h3>
                  <p>The selected document could not be previewed.</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Idle State */}
          {mode === 'idle' && (
            <div className="pd-editor-empty">
              <div className="pd-editor-empty-icon">
                <FileCode2 size={36} color="#4f46e5" />
              </div>
              <h3>No document open</h3>
              <p>
                {isReadOnly
                  ? 'Select a document from the history panel to preview it.'
                  : 'Click "New Document" to load the template or select a document from history.'}
              </p>
              {!isReadOnly && (
                <button
                  className="pd-btn pd-btn-primary"
                  onClick={handleLoadTemplate}
                  disabled={loadingTemplate}
                  style={{ marginTop: 15 }}
                >
                  {loadingTemplate ? (
                    <><div className="pd-spinner" />Loading Template…</>
                  ) : (
                    <><Sparkles size={14} />Load Template</>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Right Sidebar ── */}
        <div className="pd-sidebar">
          {/* Doc History Card */}
          <div className="pd-card">
            <div className="pd-card-header">
              <h3>
                <Clock size={15} />
                Document History
              </h3>
              {docList.length > 0 && (
                <span className="pd-info-pill" style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
                  {docList.length} {docList.length === 1 ? 'doc' : 'docs'}
                </span>
              )}
            </div>

            {loadingList ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Loader2 size={24} style={{ animation: 'pd-spin 0.7s linear infinite', color: '#4f46e5' }} />
              </div>
            ) : docList.length === 0 ? (
              <div className="pd-empty" style={{ padding: '2rem 1.5rem' }}>
                <div className="pd-empty-icon">
                  <FileText size={22} />
                </div>
                <p>No saved documents yet.<br />Create your first document above.</p>
              </div>
            ) : (
              <div className="pd-doc-list">
                {docList.map((doc, idx) => (
                  <div
                    key={doc.id}
                    className={`pd-doc-item ${activeDocId === doc.id ? 'active' : ''}`}
                    onClick={() => handlePreviewSaved(doc)}
                  >
                    <div className={`pd-doc-item-icon ${idx === 0 ? 'latest' : ''}`}>
                      <FileText size={16} />
                    </div>
                    <div className="pd-doc-item-info">
                      <div className="pd-doc-item-name">
                        {truncate(`Document ${doc.id}`)}
                        {idx === 0 && (
                          <span className="pd-badge-latest" style={{ marginLeft: 6 }}>Latest</span>
                        )}
                      </div>
                      <div className="pd-doc-item-meta">
                        {doc.submittedBy && `By ${doc.submittedBy} · `}
                        {fmtDate(doc.submittedOn || doc.entryDate)}
                      </div>
                    </div>
                    <div className="pd-doc-item-actions">
                      <button
                        className="pd-btn pd-btn-ghost pd-btn-icon"
                        title="Download DOCX"
                        onClick={(e) => { e.stopPropagation(); handleDownloadSaved(doc); }}
                        disabled={downloadingId === doc.id}
                      >
                        {downloadingId === doc.id
                          ? <div className="pd-spinner" style={{ width: 14, height: 14 }} />
                          : <Download size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="pd-card">
            <div className="pd-card-header">
              <h3>
                <Sparkles size={15} />
                Quick Actions
              </h3>
            </div>
            <div className="pd-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!isReadOnly && (
                <button
                  className="pd-btn pd-btn-primary"
                  style={{ width: '100%', justifyContent: 'space-between' }}
                  onClick={handleLoadTemplate}
                  disabled={loadingTemplate}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    {loadingTemplate ? <div className="pd-spinner" /> : <Sparkles size={14} />}
                    {loadingTemplate ? 'Loading…' : 'New from Template'}
                  </span>
                  <ChevronRight size={14} />
                </button>
              )}
              {mode === 'unsaved_preview' && (
                <button
                  className="pd-btn pd-btn-success"
                  style={{ width: '100%', justifyContent: 'space-between' }}
                  onClick={handleSave}
                  disabled={loadingSave || !previewHtml}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    {loadingSave ? <div className="pd-spinner" /> : <Save size={14} />}
                    {loadingSave ? 'Saving…' : 'Save Document'}
                  </span>
                  <ChevronRight size={14} />
                </button>
              )}
              {mode === 'saved_preview' && !isReadOnly && (
                <button
                  className="pd-btn pd-btn-success"
                  style={{ width: '100%', justifyContent: 'space-between' }}
                  onClick={handleUpdateSaved}
                  disabled={loadingSave || !previewHtml}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    {loadingSave ? <div className="pd-spinner" /> : <Save size={14} />}
                    {loadingSave ? 'Saving…' : 'Save Changes'}
                  </span>
                  <ChevronRight size={14} />
                </button>
              )}
              {docList.length > 0 && (
                <button
                  className="pd-btn pd-btn-secondary"
                  style={{ width: '100%', justifyContent: 'space-between' }}
                  onClick={() => handleDownloadSaved(docList[0])}
                  disabled={downloadingId !== null}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    {downloadingId === docList[0]?.id ? <div className="pd-spinner" /> : <Download size={14} />}
                    Download Latest
                  </span>
                  <ChevronRight size={14} />
                </button>
              )}
              <button
                className="pd-btn pd-btn-secondary"
                style={{ width: '100%', justifyContent: 'space-between' }}
                onClick={fetchDocList}
                disabled={loadingList}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {loadingList ? <div className="pd-spinner" /> : <RefreshCw size={14} />}
                  Refresh History
                </span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Status Card */}
          <div className="pd-card" style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', border: '1px solid #c7d2fe' }}>
            <div className="pd-card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                {mode === 'unsaved_preview' || mode === 'saved_preview' ? (
                  <><Eye size={18} color="#4f46e5" /><span style={{ fontWeight: 700, color: '#3730a3', fontSize: '0.9rem' }}>Preview Mode</span></>
                ) : (
                  <><CheckCircle size={18} color="#059669" /><span style={{ fontWeight: 700, color: '#065f46', fontSize: '0.9rem' }}>Ready</span></>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: '#4338ca', margin: 0, lineHeight: 1.5 }}>
                {mode === 'unsaved_preview'
                  ? 'Edit text in the document below. When done, click Save — images, alignment and layout are preserved automatically.'
                  : mode === 'saved_preview'
                  ? 'Viewing a saved document. Download it or upload a replacement.'
                  : isReadOnly
                  ? 'This policy is read-only. You can preview and download existing documents.'
                  : 'Select an action above to get started with the policy document.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toast Notification ── */}
      {toast && (
        <div className={`pd-toast ${toast.type}`} key={toast.id}>
          {toast.type === 'success' && <CheckCircle size={18} />}
          {toast.type === 'error' && <AlertCircle size={18} />}
          {toast.type === 'info' && <Sparkles size={18} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default PolicyDoc;
