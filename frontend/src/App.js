import React, { useState } from "react";
import FileUpload from "./components/FileUpload";
import PayloadGenerator from "./components/PayloadGenerator";
import Results from "./components/Results";

const STEPS = [
  { id: "upload",   icon: "📁", label: "UPLOAD" },
  { id: "generate", icon: "⚡", label: "GENERATE" },
  { id: "results",  icon: "🎯", label: "RESULTS" },
];

function App() {
  const [step, setStep]           = useState("upload");
  const [fileInfo, setFileInfo]   = useState(null);
  const [actualFile, setActualFile] = useState(null);
  const [payloads, setPayloads]   = useState([]);
  const [error, setError]         = useState("");

  const reset = () => { setStep("upload"); setFileInfo(null); setActualFile(null); setPayloads([]); setError(""); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-red-900">
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block bg-gradient-to-r from-red-600 via-pink-600 to-red-600 p-6 rounded-2xl border border-red-400 shadow-2xl mb-6">
            <h1 className="text-4xl font-bold text-white font-mono tracking-wider">
              XXE <span className="text-red-300">INJECTION</span> TOOL
            </h1>
            <p className="text-red-200 font-mono mt-1 tracking-widest text-sm">[ SECURITY TESTING PLATFORM ]</p>
          </div>
          <div className="bg-red-900/30 border-2 border-red-500 rounded-xl p-4 max-w-xl mx-auto">
            <p className="text-red-300 font-bold font-mono">⚠ AUTHORIZED ACCESS ONLY</p>
            <p className="text-red-200 text-sm font-mono">Use only on systems you own or have explicit permission to test</p>
          </div>
        </div>

        {/* Steps */}
        <div className="flex justify-center mb-10">
          <div className="bg-black/50 border border-red-500/30 rounded-2xl p-6 flex items-center space-x-8">
            {STEPS.map((s, idx) => {
              const done = (step === "generate" && s.id === "upload") ||
                           (step === "results" && (s.id === "upload" || s.id === "generate"));
              const active = step === s.id;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold border-2 transition-all ${
                      active ? "bg-gradient-to-r from-red-500 to-pink-500 border-white animate-pulse" :
                      done   ? "bg-gradient-to-r from-green-500 to-emerald-500 border-green-400" :
                               "bg-gray-800 border-gray-600"
                    }`}>
                      {done ? "✓" : s.icon}
                    </div>
                    <p className={`mt-2 font-mono text-xs font-bold ${active ? "text-white" : done ? "text-green-300" : "text-gray-500"}`}>
                      {s.label}
                    </p>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={`w-16 h-1 rounded-full ${done ? "bg-green-500" : "bg-gray-700"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-900/80 border-2 border-red-500 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-red-300 font-bold font-mono">SYSTEM ERROR</p>
              <p className="text-red-200 text-sm font-mono">{error}</p>
            </div>
            <button onClick={() => setError("")} className="text-red-300 hover:text-white p-2 rounded-lg hover:bg-red-500/20 transition-colors">✕</button>
          </div>
        )}

        {/* Content */}
        {step === "upload" && (
          <FileUpload
            onFileUploaded={(info, file) => { setFileInfo(info); setActualFile(file); setStep("generate"); setError(""); }}
            onError={setError}
          />
        )}
        {step === "generate" && (
          <PayloadGenerator
            fileInfo={fileInfo}
            onPayloadsGenerated={(p) => { setPayloads(p); setStep("results"); }}
            onError={setError}
            onBack={() => setStep("upload")}
          />
        )}
        {step === "results" && (
          <Results
            payloads={payloads}
            fileInfo={fileInfo}
            actualFile={actualFile}
            onBack={() => setStep("generate")}
            onReset={reset}
          />
        )}
      </div>
    </div>
  );
}

export default App;
