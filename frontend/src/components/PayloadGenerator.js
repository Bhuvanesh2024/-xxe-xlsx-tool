import React, { useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

const ATTACK_TYPES = [
  { value: "all",      label: "All Payload Types",    desc: "Generate all available XXE payloads" },
  { value: "doctype",  label: "DOCTYPE Declarations", desc: "Basic XXE using DOCTYPE declarations" },
  { value: "xinclude", label: "XInclude Attacks",     desc: "XML Inclusion based attacks" },
  { value: "dtd",      label: "External DTD",         desc: "External DTD based payloads" },
  { value: "svg",      label: "SVG Based",            desc: "SVG embedded XXE payloads" },
];

const PayloadGenerator = ({ fileInfo, onPayloadsGenerated, onError, onBack }) => {
  const [collaborator, setCollaborator] = useState("http://localhost:8000");
  const [targetUrl, setTargetUrl]       = useState("file:///C:/Windows/win.ini");
  const [attackType, setAttackType]     = useState("all");
  const [generating, setGenerating]     = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/generate-payloads`,
        { target_url: targetUrl, collaborator, attack_type: attackType },
        { headers: { "Content-Type": "application/json" }, timeout: 30000 }
      );
      if (res.data.success && res.data.payloads?.length > 0) {
        onPayloadsGenerated(res.data.payloads);
      } else {
        onError("No payloads returned. Check backend is running on port 5000.");
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      onError(`Backend error: ${msg}. Make sure backend is running: cd backend && py app.py`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-4 p-2 text-gray-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">Generate XXE Payloads</h2>
          <p className="text-gray-400">File: {fileInfo?.name}</p>
        </div>
      </div>

      {/* File info */}
      <div className="bg-gray-700/30 rounded-xl p-4 mb-6 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
          {fileInfo?.isXlsx ? "XLS" : "ZIP"}
        </div>
        <div>
          <p className="text-white font-medium">{fileInfo?.name}</p>
          <p className="text-gray-400 text-sm">{((fileInfo?.size || 0) / 1024).toFixed(1)} KB</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* URL inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Collaborator URL</label>
            <input type="text" value={collaborator} onChange={(e) => setCollaborator(e.target.value)}
              placeholder="http://localhost:5000"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500" />
            <p className="text-gray-500 text-xs mt-1">For out-of-band attacks and data exfiltration</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Target URL</label>
            <input type="text" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="file:///C:/Windows/win.ini"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500" />
            <p className="text-gray-500 text-xs mt-1">Target file or URL for direct attacks</p>
          </div>
        </div>

        {/* Attack type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Attack Type</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ATTACK_TYPES.map((t) => (
              <div key={t.value} onClick={() => setAttackType(t.value)}
                className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${
                  attackType === t.value
                    ? "border-red-500 bg-red-900/20"
                    : "border-gray-600 bg-gray-700/30 hover:border-gray-500"
                }`}>
                <p className="text-white font-medium text-sm">{t.label}</p>
                <p className="text-gray-400 text-xs mt-1">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <div className="text-center pt-2">
          <button onClick={handleGenerate} disabled={generating}
            className="bg-gradient-to-r from-red-600 via-pink-600 to-red-600 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-12 rounded-2xl transition-all transform hover:scale-105 shadow-xl text-lg">
            {generating ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </span>
            ) : "⚡ Generate XXE Payloads"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayloadGenerator;
