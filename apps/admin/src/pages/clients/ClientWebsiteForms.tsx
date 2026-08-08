import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';

interface ClientFormField {
  fieldId: string;
  fieldName: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  mappedTo: string;
  customKey?: string;
}

interface ClientForm {
  _id?: string;
  formId: string;
  formName: string;
  pageUrl: string;
  action: string;
  method: 'GET' | 'POST';
  fields: ClientFormField[];
  formType: string;
  isActive: boolean;
  isPrimary: boolean;
  lastScanned?: string;
  submissionType: string;
}

interface Props {
  clientId: string;
}

const MAPPING_OPTIONS = [
  { value: 'visitor.name', label: 'Visitor Full Name (visitor.name)' },
  { value: 'visitor.email', label: 'Visitor Email Address (visitor.email)' },
  { value: 'visitor.phone', label: 'Visitor Phone / Mobile (visitor.phone)' },
  { value: 'visitor.message', label: 'Requirement / Message (visitor.message)' },
  { value: 'visitor.company', label: 'Company / Business Name (visitor.company)' },
  { value: 'visitor.subject', label: 'Subject / Inquiry Topic (visitor.subject)' },
  { value: 'visitor.date', label: 'Booking / Check-in Date (visitor.date)' },
  { value: 'visitor.guests', label: 'Number of Guests / Party Size (visitor.guests)' },
  { value: 'visitor.occasion', label: 'Occasion / Event Type (visitor.occasion)' },
  { value: 'visitor.budget', label: 'Budget Estimate (visitor.budget)' },
  { value: 'visitor.address', label: 'Location / Address (visitor.address)' },
  { value: 'visitor.custom', label: 'Custom Field (visitor.custom)' },
];

export function ClientWebsiteForms({ clientId }: Props) {
  const [forms, setForms] = useState<ClientForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selectedForm, setSelectedForm] = useState<ClientForm | null>(null);
  const [editingForm, setEditingForm] = useState<ClientForm | null>(null);
  const [testModalForm, setTestModalForm] = useState<ClientForm | null>(null);
  const [testInput, setTestInput] = useState({
    name: 'Vishal Sahu',
    email: 'vishal@example.com',
    phone: '+919876543210',
    date: '2026-08-15',
    guests: '4',
    message: 'I would like to make an inquiry regarding your services.',
  });
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (clientId) fetchForms();
  }, [clientId]);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getClientForms(clientId);
      if (res.success && res.data) {
        setForms(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch client website forms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanForms = async () => {
    try {
      setScanning(true);
      setMessage(null);
      const res = await adminApi.scanClientForms(clientId);
      if (res.success) {
        setMessage({ type: 'success', text: `Website scan complete! Found ${res.data?.formsFound || 0} forms.` });
        fetchForms();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to scan website forms.' });
    } finally {
      setScanning(false);
    }
  };

  const handleSaveForm = async () => {
    if (!editingForm) return;
    try {
      const res = await adminApi.updateClientForm(clientId, editingForm.formId, editingForm);
      if (res.success) {
        setMessage({ type: 'success', text: 'Form mapping configuration saved!' });
        setEditingForm(null);
        fetchForms();
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save form configuration.' });
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!window.confirm('Are you sure you want to delete this form configuration?')) return;
    try {
      await adminApi.deleteClientForm(clientId, formId);
      setMessage({ type: 'success', text: 'Form configuration deleted.' });
      fetchForms();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to delete form.' });
    }
  };

  const handleRunTest = async () => {
    if (!testModalForm) return;
    try {
      setTesting(true);
      setTestResult(null);
      const res = await adminApi.testClientFormSubmission(clientId, testModalForm.formId, testInput);
      if (res.success) {
        setTestResult(res.data);
      }
    } catch (err: any) {
      setTestResult({ error: err.response?.data?.message || 'Test submission failed' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Loading website forms...</div>;
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Header & Scan Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Website Forms Integration</h2>
          <p className="text-sm text-gray-500">
            NestChat detects client website forms and maps chatbot visitor conversations directly to their fields.
          </p>
        </div>
        <button
          onClick={handleScanForms}
          disabled={scanning}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {scanning ? 'Scanning Website HTML...' : '🔍 Scan Website Forms'}
        </button>
      </div>

      {/* Forms List */}
      {forms.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500 font-medium">No HTML forms detected yet for this client.</p>
          <p className="text-sm text-gray-400 mt-1">Click "Scan Website Forms" above to crawl the client's site for forms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {forms.map((form) => (
            <div key={form.formId} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">{form.formName}</h3>
                    {form.isPrimary && (
                      <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                        Primary Lead Form
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${form.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {form.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Page: <a href={form.pageUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">{form.pageUrl}</a> | Action: {form.action} ({form.method})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingForm({ ...form })}
                    className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  >
                    ⚙️ Edit Mappings
                  </button>
                  <button
                    onClick={() => {
                      setTestModalForm(form);
                      setTestResult(null);
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
                  >
                    🧪 Test Integration
                  </button>
                  <button
                    onClick={() => handleDeleteForm(form.formId)}
                    className="px-3 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-700 rounded-md transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {/* Form Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-gray-600 bg-gray-50 p-3 rounded-md">
                <div>
                  <span className="font-semibold text-gray-700">Form Purpose:</span> {form.formType.toUpperCase()}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Submission Mode:</span> {form.submissionType.toUpperCase()}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Detected Fields:</span> {form.fields.length} fields
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Last Scanned:</span> {form.lastScanned ? new Date(form.lastScanned).toLocaleDateString() : 'N/A'}
                </div>
              </div>

              {/* Fields Table Preview */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-3 py-2">Field Name</th>
                      <th className="px-3 py-2">Label</th>
                      <th className="px-3 py-2">Input Type</th>
                      <th className="px-3 py-2">Required</th>
                      <th className="px-3 py-2">Mapped Target</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {form.fields.map((f, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-3 py-1.5 font-mono text-blue-600">{f.fieldName}</td>
                        <td className="px-3 py-1.5">{f.label}</td>
                        <td className="px-3 py-1.5">{f.type}</td>
                        <td className="px-3 py-1.5">{f.required ? <span className="text-red-500 font-bold">Yes</span> : 'No'}</td>
                        <td className="px-3 py-1.5 font-semibold text-green-700">{f.mappedTo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Form & Field Mappings Modal */}
      {editingForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full p-6 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Edit Form Mappings — {editingForm.formName}</h3>
              <button onClick={() => setEditingForm(null)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Form Display Name</label>
                <input
                  type="text"
                  value={editingForm.formName}
                  onChange={(e) => setEditingForm({ ...editingForm, formName: e.target.value })}
                  className="w-full text-xs p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Form Purpose Type</label>
                <select
                  value={editingForm.formType}
                  onChange={(e) => setEditingForm({ ...editingForm, formType: e.target.value })}
                  className="w-full text-xs p-2 border rounded-md bg-white"
                >
                  <option value="contact">Contact Us</option>
                  <option value="inquiry">General Inquiry</option>
                  <option value="booking">Booking</option>
                  <option value="reservation">Table / Room Reservation</option>
                  <option value="quote">Get Quote / Pricing</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Submission Adapter</label>
                <select
                  value={editingForm.submissionType}
                  onChange={(e) => setEditingForm({ ...editingForm, submissionType: e.target.value })}
                  className="w-full text-xs p-2 border rounded-md bg-white"
                >
                  <option value="html_form">Standard HTML Form (URL Encoded)</option>
                  <option value="api_endpoint">JSON REST Endpoint</option>
                  <option value="wordpress">WordPress Form (admin-ajax / CF7 / WPForms)</option>
                  <option value="webhook">Webhook POST</option>
                  <option value="unsupported">Unsupported / Fallback to NestChat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Action / Target Endpoint URL</label>
                <input
                  type="text"
                  value={editingForm.action || ''}
                  onChange={(e) => setEditingForm({ ...editingForm, action: e.target.value })}
                  placeholder="https://client-domain.com/api/inquiries"
                  className="w-full text-xs p-2 border rounded-md"
                />
              </div>

              <div className="flex items-center gap-6 pt-4 sm:col-span-2">

                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingForm.isActive}
                    onChange={(e) => setEditingForm({ ...editingForm, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingForm.isPrimary}
                    onChange={(e) => setEditingForm({ ...editingForm, isPrimary: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  Primary Lead Form
                </label>
              </div>
            </div>

            {/* Field Mapping Config Table */}
            <div>
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Field Mapping Configuration</h4>
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full text-xs text-left">
                  <thead className="bg-gray-100 text-gray-700 font-semibold">
                    <tr>
                      <th className="p-2">HTML Field Name</th>
                      <th className="p-2">Label</th>
                      <th className="p-2">Map to Chatbot Property</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {editingForm.fields.map((field, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-mono text-blue-600">{field.fieldName}</td>
                        <td className="p-2">{field.label}</td>
                        <td className="p-2">
                          <select
                            value={field.mappedTo}
                            onChange={(e) => {
                              const updated = [...editingForm.fields];
                              updated[idx].mappedTo = e.target.value;
                              setEditingForm({ ...editingForm, fields: updated });
                            }}
                            className="w-full text-xs p-1.5 border rounded bg-white"
                          >
                            {MAPPING_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setEditingForm(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveForm}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Save Form Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Integration Modal */}
      {testModalForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Test Form Integration — {testModalForm.formName}</h3>
              <button onClick={() => setTestModalForm(null)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
            </div>

            <p className="text-xs text-gray-500">
              Enter sample visitor data to preview how NestChat maps conversational data into the target form fields.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  value={testInput.name}
                  onChange={(e) => setTestInput({ ...testInput, name: e.target.value })}
                  className="w-full p-1.5 border rounded"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={testInput.email}
                  onChange={(e) => setTestInput({ ...testInput, email: e.target.value })}
                  className="w-full p-1.5 border rounded"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Phone</label>
                <input
                  type="text"
                  value={testInput.phone}
                  onChange={(e) => setTestInput({ ...testInput, phone: e.target.value })}
                  className="w-full p-1.5 border rounded"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Date</label>
                <input
                  type="text"
                  value={testInput.date}
                  onChange={(e) => setTestInput({ ...testInput, date: e.target.value })}
                  className="w-full p-1.5 border rounded"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-gray-600 mb-1">Requirement / Message</label>
                <textarea
                  value={testInput.message}
                  onChange={(e) => setTestInput({ ...testInput, message: e.target.value })}
                  className="w-full p-1.5 border rounded h-16"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleRunTest}
                disabled={testing}
                className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {testing ? 'Running Test...' : '⚡ Run Dry-Run Preview'}
              </button>
            </div>

            {testResult && (
              <div className="bg-gray-900 text-green-400 p-4 rounded-md text-xs font-mono overflow-x-auto space-y-2">
                <p className="text-white font-bold border-b border-gray-700 pb-1">Payload & Mapping Dry-Run Result:</p>
                <pre>{JSON.stringify(testResult, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
