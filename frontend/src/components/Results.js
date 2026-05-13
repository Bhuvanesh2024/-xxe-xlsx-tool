import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

const TYPE_COLORS = {
  doctype:  "from-blue-500 to-blue-600",
  xinclude: "from-green-500 to-green-600",
  dtd:      "from-yellow-500 to-yellow-600",
  svg:      "from-purple-500 to-purple-600",
};
const TYPE_ICONS = { doctype: "📄", xinclude: "🔗", dtd: "📋", svg: "🎨" };

const Results = ({ payloads, fileInfo, actualFile, onBack, onReset }) => {
  const [selected, setSelected]         = useState(null);
  const [injecting, setInjecting]       = useState(false);
  const [result, setResult]             = useState(null);
  const [activeTab, setActiveTab]       = useState("payloads");
  const [editIdx, setEditIdx]           = useState(null);
  const [editText, setEditText]         = useState("");

  const inject = async (payload) => {
    if (!actualFile) {
      setResult({ success: false, error: "No file. Go back and upload a file." });
      setActiveTab("results");
      return;
    }
    setInjecting(true);
    try {
      const fd = new FormData();
      fd.append("file", actualFile);
      fd.append("payload_type", payload.type);
      fd.append("payload", payload.payload);
      fd.append("collaborator", "http://localhost:8000");
      const res = await axios.post(`${API_BASE_URL}/api/inject-xxe`, fd, { timeout: 60000 });
      setResult(res.data);
    } catch (e) {
      setResult({ success: false, error: e.response?.data?.error || e.message });
    } finally {
      setInjecting(false);
      setActiveTab("results");
    }
  };

  const copy = (text) => navigator.clipboard.writeText(text);
  const download = (fn) => window.open(`${API_BASE_URL}/api/download/${fn}`, "_blank");
  const downloadText = (filename, text, mimeType = "text/plain") => {
    const blob = new Blob([text], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
  };
  const downloadPayload = (payload, index) => {
    const safeName = (payload.name || `payload-${index + 1}`).replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
    downloadText(`${safeName}.xml`, payload.payload, "application/xml");
  };
  const downloadAllPayloads = () => {
    downloadText("xxe-payloads.json", JSON.stringify(payloads, null, 2), "application/json");
  };
  const downloadInjectedFile = () => {
    if (result?.success && result?.output_filename) {
      download(result.output_filename);
    }
  };

  return (
    <div className="glass rounded-3xl p-8 shadow-2xl border border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-3xl font-bold gradient-text">Generated Payloads</h2>
            <p className="text-gray-300">{payloads.length} payloads ready for {fileInfo?.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={downloadAllPayloads}
            className="bg-green-700 hover:bg-green-600 text-white px-5 py-2 rounded-xl transition-colors">
            💾 Download Payloads
          </button>
          <button onClick={onReset}
            className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded-xl transition-colors">
            🔄 Start Over
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-8">
        {[
          { id: "payloads", label: `💥 Payloads (${payloads.length})` },
          { id: "results",  label: "📊 Injection Results" },
        ].map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === t.id
                ? "bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg"
                : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Payloads Tab */}
      {activeTab === "payloads" && (
        <div className="space-y-4">
          {payloads.map((p, i) => (
            <div key={i} className="bg-gray-800/40 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${TYPE_COLORS[p.type] || "from-gray-500 to-gray-600"} text-white text-sm font-semibold`}>
                      {TYPE_ICONS[p.type] || "⚡"} {p.type.toUpperCase()}
                    </span>
                    <h3 className="text-white font-bold">{p.name}</h3>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => copy(p.payload)} title="Copy"
                      className="text-green-400 hover:text-green-300 p-2 hover:bg-green-500/10 rounded-lg transition-colors">
                      📋
                    </button>
                    <button onClick={() => downloadPayload(p, i)} title="Download"
                      className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-500/10 rounded-lg transition-colors">
                      ⬇
                    </button>
                    <button onClick={() => setSelected(selected === i ? null : i)}
                      className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
                      {selected === i ? "▲" : "▼"}
                    </button>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mt-2">{p.description}</p>

                {selected === i && (
                  <div className="mt-4 space-y-3">
                    {editIdx === i ? (
                      <div className="space-y-3">
                        <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
                          className="w-full h-40 bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-xl border border-gray-600 focus:border-red-500 focus:outline-none resize-none" />
                        <div className="flex space-x-2">
                          <button onClick={() => { p.payload = editText; setEditIdx(null); }}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                            💾 Save
                          </button>
                          <button onClick={() => setEditIdx(null)}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-black/40 rounded-xl p-4 border border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-300 text-sm font-semibold">💻 Payload</span>
                          <button onClick={() => { setEditIdx(i); setEditText(p.payload); }}
                            className="text-blue-400 hover:text-blue-300 text-xs transition-colors">✏️ Edit</button>
                        </div>
                        <pre className="text-green-400 text-xs font-mono overflow-x-auto whitespace-pre-wrap bg-black/30 p-3 rounded-lg">
                          {p.payload}
                        </pre>
                      </div>
                    )}
                    {editIdx !== i && (
                      <button onClick={() => inject(p)} disabled={injecting}
                        className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg">
                        {injecting ? "🔄 Injecting..." : "💉 Inject into File"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === "results" && (
        <div>
          {result ? (
            <div className={`rounded-2xl p-8 border-2 ${
              result.success
                ? "bg-green-900/20 border-green-500/50"
                : "bg-red-900/20 border-red-500/50"
            }`}>
              <h3 className={`text-2xl font-bold mb-2 ${result.success ? "text-green-300" : "text-red-300"}`}>
                {result.success ? "✅ Injection Successful!" : "❌ Injection Failed"}
              </h3>
              <p className={result.success ? "text-green-400" : "text-red-400"}>
                {result.message || result.error}
              </p>
              {result.success && (
                <div className="mt-6 space-y-4">
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 flex items-center justify-between">
                    <span className="text-gray-300 font-medium">📁 {result.output_filename}</span>
                    <button onClick={downloadInjectedFile}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
                      💾 Download
                    </button>
                  </div>
                  {result.modified_files?.length > 0 && (
                    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                      <p className="text-gray-300 font-semibold mb-3">📝 Modified XML Files:</p>
                      {result.modified_files.map((f, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                          <span className="text-gray-400 text-sm">{f}</span>
                          <span className="text-green-400 text-xs">✅ Modified</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-gray-400 text-xl font-bold mb-2">No Results Yet</h3>
              <p className="text-gray-500">Select a payload and click Inject to see results</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Results;
