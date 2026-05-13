import React, { useState, useRef } from "react";

const FileUpload = ({ onFileUploaded, onError }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleFile = (file) => {
    const ext = file.name.toLowerCase();
    if (!ext.endsWith(".xlsx") && !ext.endsWith(".zip")) {
      onError("Please select a valid XLSX or ZIP file");
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    await new Promise((r) => setTimeout(r, 300));
    onFileUploaded(
      {
        name: selectedFile.name,
        size: selectedFile.size,
        isXlsx: selectedFile.name.toLowerCase().endsWith(".xlsx"),
        isZip: selectedFile.name.toLowerCase().endsWith(".zip"),
      },
      selectedFile
    );
    setUploading(false);
  };

  const fmt = (b) => {
    if (b === 0) return "0 B";
    const k = 1024, s = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return (b / Math.pow(k, i)).toFixed(1) + " " + s[i];
  };

  return (
    <div className="glass rounded-3xl p-8 shadow-2xl border border-white/20">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold gradient-text mb-2">Upload File</h2>
        <p className="text-gray-400">Drop an XLSX or ZIP file to begin</p>
      </div>

      <div
        onDragEnter={handleDrag} onDragLeave={handleDrag}
        onDragOver={handleDrag} onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
          dragActive ? "border-red-400 bg-red-500/10" : "border-gray-600 hover:border-red-400/60"
        }`}
        onClick={() => !selectedFile && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.zip" className="hidden"
          onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />

        {selectedFile ? (
          <div className="bg-gray-800/60 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {selectedFile.name.toLowerCase().endsWith(".xlsx") ? "XLS" : "ZIP"}
              </div>
              <div className="text-left">
                <p className="text-white font-medium">{selectedFile.name}</p>
                <p className="text-gray-400 text-sm">{fmt(selectedFile.size)}</p>
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
              className="text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors">✕</button>
          </div>
        ) : (
          <div>
            <div className="text-6xl mb-4">📁</div>
            <p className="text-white text-xl font-semibold mb-2">Drag & Drop or Click to Browse</p>
            <p className="text-gray-400">Supports .xlsx and .zip files</p>
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="mt-6 text-center">
          <button onClick={handleUpload} disabled={uploading}
            className="bg-gradient-to-r from-red-600 via-pink-600 to-red-600 hover:opacity-90 disabled:opacity-50 text-white font-bold py-4 px-12 rounded-2xl transition-all transform hover:scale-105 shadow-xl animate-glow">
            {uploading ? "Processing..." : "Continue to Payload Generation →"}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
