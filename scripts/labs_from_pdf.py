"""
LAB-001 — extrai content/labs.json de referencias_ferro/Portfolio_Laboratorios_EFM_UFSC.pdf.

Uso (manutenção): pip install pypdf && python scripts/labs_from_pdf.py

Regras (14): não copiar e-mails/telefones/salas; marcar frases prospectivas
("potencial", "podem ser adaptadas"…) como `prospective` para a UI distinguir
capacidade oferecida de potencial. Tudo nasce UNVERIFIED na quarentena.

O PDF é diagramado em blocos: cada seção ("O laboratório", "Histórico e projetos",
"Aplicações no setor ...") tem um cabeçalho e um bloco de texto abaixo; usamos a
posição vertical (cm[5]) do visitor do pypdf para associar bloco → seção.
"""
import datetime
import hashlib
import json
import os
import re
import sys

from pypdf import PdfReader

sys.stdout.reconfigure(encoding="utf-8")
os.chdir(os.path.join(os.path.dirname(__file__), ".."))

PDF = "referencias_ferro/Portfolio_Laboratorios_EFM_UFSC.pdf"
SLUGS = {
    "LMSE": "lmse", "LMS": "lms", "LabDSE": "labdse", "Lab. Robótica Avançada": "robotica", "NSO": "nso",
    "LaCMa": "lacma", "LIFE": "life", "Aeolus": "aeolus", "LTS": "lts", "LAV": "lav", "LDTPav": "ldtpav",
}
PROSPECTIVE = re.compile(r"potencial|podem ser adaptad|pode ser aplicad|aplicável|em desenvolvimento|futur", re.I)
CONTACT = re.compile(r"@|\+55|\bsite\b|Sala \?|Bloco [A-Z]|Campus Perini|\.ufsc\.br|Link do Lattes", re.I)
SECTION_KEYS = {"O LABORATÓRIO": "about", "HISTÓRICO E PROJETOS": "history"}
CONTINUATION_ENDINGS = (",", ";", ":", " de", " e", " para", " na", " no", " em", " do", " da", " com", " a", " o", " ao", " à", " os", " as", " dos", " das", " ou", " via", " atual", " and", " of", " the", " por", " pela", " pelo", " sob", " sobre")


def unspace(s: str) -> str:
    """Cabeçalhos vêm com espaçamento de letras: 'O  L A B O R A T Ó R I O'."""
    return re.sub(r"\s+", " ", s.replace("  ", "\x00").replace(" ", "").replace("\x00", " ")).strip()


def extract_page(page):
    items = []

    def visitor(text, cm, tm, _fd, _fs):
        t = text.strip()
        if t:
            items.append((round(cm[5]), round(tm[5]), round(tm[4]), t))

    page.extract_text(visitor_text=visitor)
    items = [it for it in items if it[0] != 850 or it[1] != 0]  # bloco final é a página inteira repetida
    return items


def paragraphs_from_block(lines):
    """lines: [(indent, text)] já agrupadas por linha visual.
    Novo parágrafo com recuo de marcador (indent >= 20), após pontuação final ou quando a linha
    começa em maiúscula e a anterior não termina em conector (vírgula, preposição…);
    hífen no fim da linha cola sem espaço ("pós-" + "graduação")."""
    out = []
    for indent, text in lines:
        if not out:
            out.append(text)
            continue
        prev = out[-1]
        starts_new = text[:1].isupper() and not prev.endswith(CONTINUATION_ENDINGS)
        if indent >= 20 or re.search(r"[.!?]$", prev) or starts_new:
            out.append(text)
        elif prev.endswith("-"):
            out[-1] = prev + text
        else:
            out[-1] = prev + " " + text
    return [p for p in out if len(p) > 25]


def join_parts(parts):
    """Trechos de uma mesma linha visual. O pypdf às vezes quebra dentro de uma palavra
    ("de d" + "esempenho", "A" + "tua"): se o último token anterior é uma letra isolada que
    não é palavra em português, cola sem espaço."""
    text = parts[0][1]
    for _indent, part in parts[1:]:
        last = text.rsplit(" ", 1)[-1]
        if len(text) == 1 or (len(last) == 1 and last.lower() not in ("a", "e", "o", "é", "à")):
            text += part
        else:
            text += " " + part
    return text


def parse_lab(page, page_number):
    items = extract_page(page)
    acronym = items[0][3]
    headers = []  # (y, key, label)
    body_blocks = {}  # y -> {line_y: [(indent, text)]}
    head_text = []
    for y, ly, indent, text in items[1:]:
        if y < 400 and not CONTACT.search(text):
            head_text.append(text)
            continue
        if y == 3343 or CONTACT.search(text):
            continue  # linha de contato — não publicar
        label = unspace(text)
        if label.isupper() and len(text) > 10:
            key = SECTION_KEYS.get(label, "applications")
            headers.append((y, key, label))
            continue
        body_blocks.setdefault(y, {}).setdefault(ly, []).append((indent, text))
    # nome completo: aparece no cabeçalho ou como primeira linha de bloco isolado (y≈200)
    name = next((t for t in head_text if t.startswith(("Laboratório", "Núcleo"))), None)
    responsible = next((t for t in head_text if re.search(r"Prof", t)), "")
    responsible = responsible.replace("Coordenador:", "").strip(" ·")
    sections = {"about": [], "history": [], "applications": []}
    labels = {}
    for y in sorted(body_blocks):
        lines = []
        for ly in sorted(body_blocks[y]):
            parts = body_blocks[y][ly]
            lines.append((parts[0][0], join_parts(parts)))
        if name is None and len(lines) == 1 and lines[0][1].startswith(("Laboratório", "Núcleo")) and y < 400:
            name = lines[0][1]
            continue
        owner = max((h for h in headers if h[0] < y), key=lambda h: h[0], default=None)
        if owner is None:
            continue
        labels[owner[1]] = owner[2]
        sections[owner[1]].extend(paragraphs_from_block(lines))
    if name is None:
        name = acronym
    return {
        "id": SLUGS[acronym],
        "acronym": acronym,
        "name": name,
        "responsible": responsible,
        "page": page_number,
        "applicationsLabel": labels.get("applications", ""),
        "about": sections["about"],
        "history": sections["history"],
        "applications": [{"text": t, "prospective": bool(PROSPECTIVE.search(t))} for t in sections["applications"]],
    }


reader = PdfReader(PDF)
sha = hashlib.sha256(open(PDF, "rb").read()).hexdigest()
labs = [parse_lab(reader.pages[i], i + 1) for i in range(2, 13)]

# Páginas com corpo idêntico ao de outro laboratório (defeito do PDF): não publicar
# como se fosse conteúdo próprio; a UI mostra pendência.
seen_bodies = {}
for lab in labs:
    key = chr(10).join(lab["about"])
    if key in seen_bodies:
        lab["duplicateOf"] = seen_bodies[key]
        lab["about"], lab["history"], lab["applications"] = [], [], []
    else:
        seen_bodies[key] = lab["id"]

# Índice (p.2) lista 14 laboratórios; três não têm página detalhada no PDF (nomes como no índice).
index_only = [
    {"id": "labmci", "acronym": "LABMCI", "name": "Motores de Combustão Interna"},
    {"id": "lasc", "acronym": "LASC", "name": "Automação e Sistemas de Controle"},
    {"id": "idalab", "acronym": "IDA Lab", "name": "Dados e Inteligência Artificial"},
]
for lab in index_only:
    lab.update({"responsible": "", "page": 2, "applicationsLabel": "", "about": [], "history": [], "applications": []})

data = {
    "source": {
        "file": PDF,
        "sha256": sha,
        "title": "Portfólio de Laboratórios — Engenharia Ferroviária e Metroviária, UFSC Joinville",
        "extractedAt": datetime.date.today().isoformat(),
        "tool": "scripts/labs_from_pdf.py",
    },
    "labs": labs + index_only,
}
os.makedirs("content", exist_ok=True)
with open("content/labs.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")
for lab in data["labs"]:
    print(f"{lab['acronym']:<24} about={len(lab['about']):>2} hist={len(lab['history']):>2} apps={len(lab['applications']):>2}  {lab['name'][:45]:<45}  {lab['responsible'][:40]}")
