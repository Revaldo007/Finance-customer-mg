import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import client from '../api/client'

const FIELD_STYLE = {
  width: '100%',
  border: '1.5px solid #e2e8f0',
  borderRadius: '10px',
  padding: '8px 12px',
  fontSize: '13px',
  color: '#1e293b',
  outline: 'none',
  background: '#f8fafc',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const LABEL_STYLE = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  color: '#64748b',
  marginBottom: '5px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const EMPLOYMENT_COLORS = {
  salaried:       { bg: '#ede9fe', color: '#4338ca', border: '#c4b5fd' },
  'self-employed':{ bg: '#fef9c3', color: '#92400e', border: '#fde68a' },
  business:       { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
  unemployed:     { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
}

// ID proof types with label, placeholder and regex validation
const ID_PROOF_TYPES = [
  { value: 'aadhaar',  label: 'Aadhaar Card',       placeholder: 'XXXX XXXX XXXX', pattern: /^\d{4}\s?\d{4}\s?\d{4}$/, hint: '12-digit Aadhaar number (e.g. 1234 5678 9012)' },
  { value: 'pan',      label: 'PAN Card',            placeholder: 'ABCDE1234F',     pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, hint: '10-character PAN (e.g. ABCDE1234F)' },
  { value: 'passport', label: 'Passport',            placeholder: 'A1234567',       pattern: /^[A-Z][0-9]{7}$/, hint: '8-character passport number (e.g. A1234567)' },
  { value: 'voter_id', label: 'Voter ID (EPIC)',     placeholder: 'ABC1234567',     pattern: /^[A-Z]{3}[0-9]{7}$/, hint: '10-character Voter ID (e.g. ABC1234567)' },
  { value: 'driving',  label: 'Driving Licence',     placeholder: 'KA0120230001234', pattern: /^[A-Z]{2}[0-9]{13}$/, hint: '15-character DL number (e.g. KA0120230001234)' },
  { value: 'gstin',    label: 'GSTIN',               placeholder: '22AAAAA0000A1Z5', pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, hint: '15-digit GSTIN number' },
  { value: 'other',    label: 'Other',               placeholder: 'Document number', pattern: null, hint: 'Enter the document number' },
]

const EMPLOYMENT_TYPES = [
  { value: 'Salaried',      label: 'Salaried' },
  { value: 'Self-Employed', label: 'Self-Employed' },
  { value: 'Business',      label: 'Business Owner' },
  { value: 'Freelancer',    label: 'Freelancer' },
  { value: 'Unemployed',    label: 'Unemployed' },
  { value: 'Retired',       label: 'Retired' },
  { value: 'Student',       label: 'Student' },
]

const empty = {
  full_name: '', phone: '', email: '', address: '',
  id_proof_type: '', id_proof_number: '',
  id_proof_document: null, id_proof_document_name: '',
  id_proof_document_size: null, id_proof_document_type: '',
  employment_type: '', employer_name: '', monthly_income: '',
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(empty)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const load = (query = '') => {
    client.get('/customers', { params: query ? { q: query } : {} }).then((r) => setCustomers(r.data))
  }

  useEffect(() => { load() }, [])

  const handleSearch = (e) => { e.preventDefault(); load(q) }

  const handleFileSelect = (file) => {
    if (!file) return
    const allowedExtensions = /\.(pdf|jpe?g|png|webp)$/i
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf' && !allowedExtensions.test(file.name)) {
      alert('Please upload a valid document file in PDF, PNG, JPG, or WEBP format.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds the 5MB limit. Please choose a smaller file.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setForm((prev) => ({
        ...prev,
        id_proof_document: ev.target.result,
        id_proof_document_name: file.name,
        id_proof_document_size: file.size,
        id_proof_document_type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleRemoveFile = () => {
    setForm((prev) => ({
      ...prev,
      id_proof_document: null,
      id_proof_document_name: '',
      id_proof_document_size: null,
      id_proof_document_type: '',
    }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    await client.post('/customers', {
      ...form,
      monthly_income: form.monthly_income ? Number(form.monthly_income) : null,
      id_proof_document: form.id_proof_document || null,
      id_proof_document_name: form.id_proof_document_name || null,
    })
    setForm(empty)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setShowForm(false)
    load(q)
  }

  const getEmploymentBadge = (type) => {
    if (!type) return null
    const key = type.toLowerCase()
    const cfg = EMPLOYMENT_COLORS[key] || { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0' }
    return (
      <span style={{
        padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 600,
        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
        textTransform: 'capitalize',
      }}>{type}</span>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 600, color: '#3763f4', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
            Web-Based Finance and Customer Management System
          </p>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>Customers</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '3px 0 0' }}>Manage and view customer records</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          style={{
            background: showForm ? 'linear-gradient(135deg,#f1f5f9,#e2e8f0)' : 'linear-gradient(135deg,#3763f4,#2a4fd6)',
            color: showForm ? '#64748b' : '#fff',
            border: 'none', borderRadius: '10px', padding: '9px 18px',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            boxShadow: showForm ? 'none' : '0 4px 14px rgba(55,99,244,0.35)',
          }}
        >
          {showForm ? '✕ Cancel' : '+ Add Customer'}
        </button>
      </div>

      {/* Add Customer Form */}
      {showForm && (
        <form onSubmit={handleCreate} style={{
          background: '#fff', borderRadius: '16px', padding: '24px',
          boxShadow: '0 4px 24px rgba(15,23,42,0.08)', border: '1px solid #f1f5f9',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
          animation: 'fadeInUp 0.25s ease',
        }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>Add New Customer</h2>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>Fill in the customer details below</p>
          </div>

          {/* Basic fields */}
          {[
            ['full_name', 'Full Name', true, 'text', 'e.g. Ravi Kumar'],
            ['phone', 'Phone Number', true, 'tel', 'e.g. 9876543210'],
            ['email', 'Email Address', false, 'email', 'e.g. ravi@example.com'],
          ].map(([key, label, required, type, ph]) => (
            <div key={key}>
              <label style={LABEL_STYLE}>{label}</label>
              <input
                type={type}
                style={FIELD_STYLE}
                value={form[key]}
                required={!!required}
                placeholder={ph}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}

          {/* ── ID Proof Type – clean professional select ── */}
          <div>
            <label style={LABEL_STYLE}>ID Proof Type</label>
            <div style={{ position: 'relative' }}>
              <select
                style={{
                  ...FIELD_STYLE,
                  appearance: 'none',
                  paddingRight: '32px',
                  cursor: 'pointer',
                  fontWeight: form.id_proof_type ? 600 : 400,
                  color: form.id_proof_type ? '#1e293b' : '#94a3b8',
                  border: form.id_proof_type ? '1.5px solid #3763f4' : '1.5px solid #e2e8f0',
                  background: form.id_proof_type
                    ? 'linear-gradient(135deg,#eef4ff,#f8fafc)'
                    : '#f8fafc',
                }}
                value={form.id_proof_type}
                onChange={(e) => setForm({ ...form, id_proof_type: e.target.value, id_proof_number: '' })}
              >
                <option value="">Select ID proof type…</option>
                {ID_PROOF_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {/* Custom chevron */}
              <span style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                pointerEvents: 'none', fontSize: '10px', color: '#94a3b8',
              }}>▼</span>
            </div>
          </div>

          {/* ── ID Proof Number – smart validated input ── */}
          <div>
            <label style={LABEL_STYLE}>ID Proof Number</label>
            {(() => {
              const t = ID_PROOF_TYPES.find(x => x.value === form.id_proof_type)
              const isValid = t?.pattern ? t.pattern.test(form.id_proof_number.trim().toUpperCase()) : true
              const hasValue = form.id_proof_number.length > 0
              const showError = hasValue && t?.pattern && !isValid
              const showOk    = hasValue && (!t?.pattern || isValid)
              return (
                <>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{
                        ...FIELD_STYLE,
                        paddingRight: '36px',
                        border: showError ? '1.5px solid #ef4444'
                              : showOk    ? '1.5px solid #22c55e'
                              : '1.5px solid #e2e8f0',
                        background: showError ? '#fff5f5'
                                  : showOk    ? '#f0fdf4'
                                  : form.id_proof_type ? '#f8fafc' : '#f1f5f9',
                        color: form.id_proof_type ? '#1e293b' : '#94a3b8',
                        textTransform: t?.value !== 'aadhaar' ? 'uppercase' : 'none',
                        letterSpacing: t?.value === 'aadhaar' ? '0.15em' : 'normal',
                        fontWeight: 600,
                        transition: 'border-color 0.2s, background 0.2s',
                      }}
                      value={form.id_proof_number}
                      placeholder={t ? t.placeholder : 'Select ID type first…'}
                      disabled={!form.id_proof_type}
                      maxLength={t?.value === 'pan' ? 10 : t?.value === 'aadhaar' ? 14 : undefined}
                      onChange={(e) => setForm({ ...form, id_proof_number: e.target.value })}
                    />
                    {/* Professional SVG validation icon */}
                    {hasValue && (
                      <span style={{
                        position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)',
                        pointerEvents: 'none', display: 'flex', alignItems: 'center',
                      }}>
                        {showOk ? (
                          <svg width="15" height="15" viewBox="0 0 20 20" fill="#16a34a">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 20 20" fill="#dc2626">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                  {/* Clean format hint */}
                  {t && (
                    <p style={{
                      fontSize: '11px', margin: '5px 0 0', fontWeight: 500,
                      color: showError ? '#ef4444' : '#64748b',
                    }}>
                      {showError ? `Invalid format: ${t.hint}` : t.hint}
                    </p>
                  )}
                </>
              )
            })()}
          </div>

          {/* ── Document Attachment (KYC File Format) ── */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={LABEL_STYLE}>
              {form.id_proof_type
                ? `${ID_PROOF_TYPES.find(x => x.value === form.id_proof_type)?.label || 'ID'} Document (File Attachment)`
                : 'ID Proof Document (File Attachment)'}
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0])
                }
              }}
            />

            {!form.id_proof_document ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragging ? '2px dashed #3763f4' : '1.5px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  background: isDragging ? '#eff6ff' : '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #eef4ff, #dbeafe)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#3763f4', flexShrink: 0, border: '1px solid #bfdbfe',
                  }}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                      Click to upload document or drag and drop
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                      Supported formats: PDF, JPG, PNG, WEBP (up to 5MB)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  style={{
                    background: '#fff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '7px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#3763f4',
                    pointerEvents: 'none',
                    boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
                  }}
                >
                  Browse File
                </button>
              </div>
            ) : (
              <div style={{
                background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
                border: '1.5px solid #bfdbfe',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '14px',
                boxShadow: '0 2px 10px rgba(55,99,244,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                  {/* Format Pill / Thumbnail */}
                  {form.id_proof_document_type?.includes('image') ? (
                    <img
                      src={form.id_proof_document}
                      alt="ID Preview"
                      style={{
                        width: '42px', height: '42px', borderRadius: '8px',
                        objectFit: 'cover', border: '1.5px solid #cbd5e1', flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '10px',
                      background: 'linear-gradient(135deg,#fee2e2,#fecaca)',
                      color: '#b91c1c', border: '1px solid #fca5a5',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>PDF</span>
                    </div>
                  )}

                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      margin: 0, fontSize: '13px', fontWeight: 600, color: '#1e293b',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {form.id_proof_document_name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                        {formatFileSize(form.id_proof_document_size)}
                      </span>
                      <span style={{ color: '#cbd5e1', fontSize: '10px' }}>•</span>
                      <span style={{
                        fontSize: '11px', fontWeight: 600, color: '#16a34a',
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}>
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Document Attached
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (form.id_proof_document) {
                        const win = window.open()
                        if (win) {
                          win.document.write(
                            `<iframe src="${form.id_proof_document}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
                          )
                        }
                      }
                    }}
                    style={{
                      background: '#fff', border: '1.5px solid #cbd5e1', borderRadius: '8px',
                      padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    Preview
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: 'linear-gradient(135deg,#eef4ff,#dbeafe)',
                      border: '1px solid #bfdbfe', borderRadius: '8px',
                      padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#3763f4',
                      cursor: 'pointer',
                    }}
                  >
                    Change
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    style={{
                      background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px',
                      padding: '6px 10px', fontSize: '12px', fontWeight: 600, color: '#b91c1c',
                      cursor: 'pointer',
                    }}
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Employment Type – styled select ── */}
          <div>
            <label style={LABEL_STYLE}>Employment Type</label>
            <div style={{ position: 'relative' }}>
              <select
                style={{
                  ...FIELD_STYLE,
                  appearance: 'none',
                  paddingRight: '32px',
                  cursor: 'pointer',
                  fontWeight: form.employment_type ? 600 : 400,
                  color: form.employment_type ? '#1e293b' : '#94a3b8',
                }}
                value={form.employment_type}
                onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
              >
                <option value="">Select employment type…</option>
                {EMPLOYMENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <span style={{
                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                pointerEvents: 'none', fontSize: '10px', color: '#94a3b8',
              }}>▼</span>
            </div>
          </div>

          {/* Remaining basic fields */}
          {[
            ['employer_name', 'Employer / Company Name', false, 'text', 'e.g. Infosys Ltd'],
            ['monthly_income', 'Monthly Income (₹)', false, 'number', 'e.g. 50000'],
          ].map(([key, label, required, type, ph]) => (
            <div key={key}>
              <label style={LABEL_STYLE}>{label}</label>
              <input
                type={type}
                style={FIELD_STYLE}
                value={form[key]}
                required={!!required}
                placeholder={ph}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={LABEL_STYLE}>Address</label>
            <textarea
              style={{ ...FIELD_STYLE, minHeight: '70px', resize: 'vertical' }}
              value={form.address}
              placeholder="Full address"
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ background: 'linear-gradient(135deg,#3763f4,#2a4fd6)', color: '#fff', border: 'none', borderRadius: '10px', padding: '9px 22px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(55,99,244,0.35)' }}>Save Customer</button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#94a3b8' }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            style={{ ...FIELD_STYLE, paddingLeft: '34px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '10px 12px 10px 36px' }}
            placeholder="Search by name, phone, email or ID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button type="submit" style={{ background: 'linear-gradient(135deg,#1e293b,#334155)', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          Search
        </button>
      </form>

      {/* Customers Table */}
      <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 24px rgba(15,23,42,0.07)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 2fr 1.2fr 100px', padding: '12px 20px', background: 'linear-gradient(to right,#f8fafc,#f1f5f9)', borderBottom: '1px solid #e2e8f0' }}>
          {['Customer', 'Phone', 'Email', 'Employment', ''].map((h) => (
            <span key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
          ))}
        </div>

        {customers.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>👤</div>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, fontWeight: 500 }}>No customers found</p>
            <p style={{ fontSize: '12px', color: '#cbd5e1', margin: '4px 0 0' }}>Try a different search or add a new customer</p>
          </div>
        ) : (
          customers.map((c, idx) => (
            <div
              key={c.id}
              className="finance-row-enter"
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1.2fr 2fr 1.2fr 100px',
                padding: '14px 20px', borderBottom: idx < customers.length - 1 ? '1px solid #f8fafc' : 'none',
                alignItems: 'center', transition: 'background 0.15s', animationDelay: `${idx * 0.04}s`,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Name + avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#3763f4,#6366f1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '13px', fontWeight: 700,
                }}>
                  {c.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', margin: 0 }}>{c.full_name}</p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>ID #{c.id}</p>
                </div>
              </div>

              <span style={{ fontSize: '13px', color: '#475569' }}>{c.phone}</span>

              <span style={{ fontSize: '13px', color: '#3763f4', textDecoration: c.email ? 'none' : 'none' }}>
                {c.email || <span style={{ color: '#cbd5e1' }}>—</span>}
              </span>

              <div>{c.employment_type ? getEmploymentBadge(c.employment_type) : <span style={{ color: '#cbd5e1' }}>—</span>}</div>

              <div style={{ textAlign: 'right' }}>
                <Link
                  to={`/customers/${c.id}`}
                  style={{
                    fontSize: '12px', fontWeight: 600, color: '#3763f4',
                    textDecoration: 'none', padding: '5px 12px',
                    background: 'linear-gradient(135deg,#eef4ff,#dbeafe)',
                    borderRadius: '8px', border: '1px solid #bfdbfe',
                    display: 'inline-block',
                  }}
                >
                  View →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
