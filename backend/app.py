from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os, zipfile, tempfile, shutil
from werkzeug.utils import secure_filename
from xxe_generator import XXEGenerator
from xlsx_processor import XLSXProcessor

PROCESSED_DIR = os.environ.get("PROCESSED_DIR", os.path.join(os.path.dirname(__file__), "processed"))

app = Flask(__name__)
CORS(app)

@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    return response

xxe_gen = XXEGenerator()
xlsx_proc = XLSXProcessor(PROCESSED_DIR)


@app.route("/")
def index():
    return jsonify({"status": "running"})


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "message": "XXE XLSX Tool Backend is running"})


@app.route("/api/generate-payloads", methods=["POST", "OPTIONS"])
def generate_payloads():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    try:
        data = request.get_json(force=True, silent=True) or {}
        payloads = xxe_gen.generate_payloads(
            data.get("target_url", "file:///etc/passwd"),
            data.get("collaborator", "http://localhost:5000"),
            data.get("attack_type", "all")
        )
        return jsonify({"success": True, "payloads": payloads, "count": len(payloads)})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400


@app.route("/api/inject-xxe", methods=["POST", "OPTIONS"])
def inject_xxe():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        file = request.files["file"]
        if not file.filename:
            return jsonify({"error": "No file selected"}), 400

        filename = secure_filename(file.filename)
        tmp = os.path.join(tempfile.gettempdir(), filename)
        file.save(tmp)

        try:
            if filename.lower().endswith(".zip"):
                result = _process_zip(tmp,
                    request.form.get("payload_type", "doctype"),
                    request.form.get("payload", ""),
                    request.form.get("collaborator", ""))
            elif filename.lower().endswith(".xlsx"):
                result = xlsx_proc.inject_xxe(tmp,
                    request.form.get("payload_type", "doctype"),
                    request.form.get("payload", ""),
                    request.form.get("collaborator", ""))
            else:
                return jsonify({"error": "Only XLSX and ZIP supported"}), 400
            return jsonify(result)
        finally:
            if os.path.exists(tmp):
                os.remove(tmp)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def _process_zip(zip_path, payload_type, payload, collaborator):
    tmp_dir = tempfile.mkdtemp()
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(tmp_dir)
        results = []
        for root, dirs, files in os.walk(tmp_dir):
            for f in files:
                if f.lower().endswith(".xlsx"):
                    r = xlsx_proc.inject_xxe(os.path.join(root, f), payload_type, payload, collaborator)
                    if r["success"]:
                        results.append(r)
        if not results:
            return {"success": False, "error": "No XLSX files found in ZIP"}
        out_name = "xxe_batch_{}_files.zip".format(len(results))
        out_path = os.path.join(PROCESSED_DIR, out_name)
        os.makedirs(PROCESSED_DIR, exist_ok=True)
        with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for r in results:
                fp = os.path.join(PROCESSED_DIR, r["output_filename"])
                if os.path.exists(fp):
                    zf.write(fp, r["output_filename"])
        return {"success": True, "output_filename": out_name, "total_files": len(results)}
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


@app.route("/api/analyze-file", methods=["POST", "OPTIONS"])
def analyze_file():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        file = request.files["file"]
        filename = secure_filename(file.filename)
        tmp = os.path.join(tempfile.gettempdir(), filename)
        file.save(tmp)
        try:
            if filename.lower().endswith(".xlsx"):
                analysis = xlsx_proc.analyze_xlsx_structure(tmp)
            elif filename.lower().endswith(".zip"):
                analysis = _analyze_zip(tmp)
            else:
                return jsonify({"error": "Unsupported file type"}), 400
            return jsonify({"success": True, "analysis": analysis})
        finally:
            if os.path.exists(tmp):
                os.remove(tmp)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


def _analyze_zip(zip_path):
    result = {"type": "zip", "xlsx_files": [], "total_files": 0, "other_files": []}
    with zipfile.ZipFile(zip_path, "r") as zf:
        files = zf.namelist()
        result["total_files"] = len(files)
        for f in files:
            (result["xlsx_files"] if f.lower().endswith(".xlsx") else result["other_files"]).append(f)
    return result


@app.route("/api/download/<filename>", methods=["GET"])
def download_file(filename):
    try:
        fp = os.path.join(PROCESSED_DIR, secure_filename(filename))
        if os.path.exists(fp):
            return send_file(fp, as_attachment=True)
        return jsonify({"error": "File not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    port = int(os.environ.get("PORT", 8000))
    print("Backend running at http://localhost:{}".format(port))
    print("Health: http://localhost:{}/api/health".format(port))
    app.run(debug=True, host="0.0.0.0", port=port)
