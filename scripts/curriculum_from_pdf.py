"""
FLOW-001 — gera content/curriculum/<ano>.json a partir dos PDFs oficiais
"CURRÍCULO DO CURSO" (SeTIC/UFSC) em public/grades/grade<ano>.pdf.

Uso (ferramenta de manutenção, não faz parte do build):
    pip install pypdf
    python scripts/curriculum_from_pdf.py

Regras:
- Estrutura (fases, códigos, nomes, cargas, pré-requisitos, equivalências,
  ementas) vem do PDF. Categorias, nomes curtos e flags de extensão são
  metadados de apresentação mantidos em CATEGORY_OVERRIDES/legado.
- A grade 2012 não traz pré-requisitos no PDF: as arestas legadas do protótipo
  são preservadas com prerequisitesSource = "legacy-unverified".
"""
import json, os, re, sys, datetime, hashlib
sys.stdout.reconfigure(encoding="utf-8")
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
from pypdf import PdfReader

CODE = r"[A-Z]{3}\d{4}"
OUT_DIR = "content/curriculum"

# Categorias herdadas do protótipo (src/data/curriculums.ts antes de FLOW-001) + novas por palavra-chave.
KEYWORDS = [
    ("physics", r"F[ií]sica"), ("math", r"C[áa]lculo|[ÁA]lgebra|Geometria|Estat[íi]stica|Equa[çc][õo]es|Metrologia|Num[ée]rico"),
    ("railway", r"Ferrovi|Metrovi|Via Permanente|Locomotiv|Vag[õo]es|Tra[çc][ãa]o|Roda|Dinâmica Ferro|Opera[çc][ãa]o Ferro|Trens|Sinaliza"),
    ("elec", r"El[ée]tric|Eletr[ôo]nic|Motrizes|Instrumenta|Circuitos|Transmiss[ãa]o e Distr|Comunica[çc][ãa]o e Sinaliza"),
    ("fluid", r"Fluido|Termodin|Calor|Hidro|Pneum|Fluxo|Propuls"),
    ("material", r"Materia|Fratura|Desgaste|Constru[çc][ãa]o|Solda|Qu[íi]mica|Fabrica[çc][ãa]o|Liga[çc][õo]es"),
    ("mech", r"Mec[âa]nica|Est[áa]tica|Din[âa]mica|Vibra|Mecanismos|Elementos de M[áa]quinas|Ac[úu]stica|Resist"),
    ("comp", r"Programa|Modelagem de Sistemas|Inform[áa]tica|Computacion|Elementos Finitos|Controle"),
    ("mgmt", r"Gest[ãa]o|Log[íi]stica|Planejamento|Manuten|Legisla|Terminais|Qualidade|Empreended|Economia|Impactos|Ambient|Organiza|Empreendimentos"),
    ("project", r"Est[áa]gio|Projeto|Trabalho de Conclus|TCC|Atividades|P[óo]s-Gradua|T[ée]cnicas de Projeto|Metodologia"),
    ("design", r"Desenho|Representa[çc][ãa]o|Modelagem Geom"),
    ("human", r"Comunica[çc][ãa]o e Express|Ci[êe]ncia, Tecnologia|[ÉE]tica|Ergonomia|Rela[çc][õo]es|L[íi]ngua|Libras|Escrita|Tradu|Fundamentos Eng"),
]
CATEGORY_OVERRIDES = {"EMB5598": "project", "EMB5997": "project", "EMB5533": "project", "EMB5099": "project", "EMB5046": "project", "EMB5523": "project"}


def legacy_metadata():
    """Categorias, nomes curtos, flags ext e pré-requisitos do dataset legado, por ano."""
    s = open("src/data/curriculums.legacy.ts", encoding="utf-8").read()
    meta = {}
    for year in (2025, 2016, 2012):
        m = {}
        for block in re.finditer(rf"export const (?:CURRICULO|OPTATIVAS)_{year}[^\n]*= \[(.*?)\n\];", s, flags=re.S):
            for sm in re.finditer(r'\{ id: "([^"]+)", cat: "(\w+)", name: "([^"]*)", hours: (\d+)(?:, pre: \[([^\]]*)\])?(?:, ext: true)?', block.group(1)):
                m[sm.group(1)] = {"cat": sm.group(2), "shortName": sm.group(3), "pre": re.findall(CODE, sm.group(5) or ""), "ext": ", ext: true" in sm.group(0)}
        meta[year] = m
    return meta


def category_for(code, name, legacy):
    if code in CATEGORY_OVERRIDES: return CATEGORY_OVERRIDES[code]
    if code in legacy: return legacy[code]["cat"]
    for cat, rx in KEYWORDS:
        if re.search(rx, name, flags=re.I): return cat
    return "mgmt"


def parse_groups(text):
    """'eh(A B)' = todos; 'ou(A ou B)' = alternativas; códigos soltos = todos."""
    all_of, any_of = [], []
    for g in re.finditer(r"(eh|ou)\(([^)]*)\)", text):
        codes = re.findall(CODE, g.group(2))
        (all_of if g.group(1) == "eh" else any_of).append(codes) if g.group(1) == "ou" else all_of.extend(codes)
    rest = re.sub(r"(eh|ou)\([^)]*\)", " ", text)
    all_of.extend(re.findall(CODE, rest))
    return list(dict.fromkeys(all_of)), any_of


def parse_pdf(year):
    r = PdfReader(f"public/grades/grade{year}.pdf")
    raw = "\n".join((p.extract_text() or "") for p in r.pages)
    title = re.search(r"CURRÍCULO DO CURSO\n(.*?)\n(\d{5})", raw)
    t = re.sub(r"CURRÍCULO DO CURSO\n.*?\nHabilitação:.*?\n", "\n", raw, flags=re.S)
    t = re.sub(r"SeTIC.*?Página: \d+", "", t)
    blocks = re.split(r"\n(?=\d+ª Fase\n)", t)
    phases, optatives, activities = {}, [], []
    seen = set()
    for b in blocks:
        m = re.match(r"(\d+)ª Fase", b)
        phase = int(m.group(1)) if m else None
        lines = b.split("\n")
        for i, line in enumerate(lines):
            em = re.match(rf"^(?P<pre>.*?)(?P<type>Ob|Op)(?P<code>{CODE}) (?P<aulas>\d+)(?P<name>.+)$", line)
            if not em: continue
            pre_text = em.group("pre")
            glued_hours = re.match(r"^(\d{2,3})(?=Ob|Op)", pre_text)
            if glued_hours: pre_text = pre_text[len(glued_hours.group(1)):]
            k = i - 1
            while k >= 0 and k >= i - 5 and ")" in "".join(lines[k:i]) and "(" not in "".join(lines[k:i]): k -= 1
            back = "\n".join(lines[max(k, 0):i])
            if "(" in back and ")" in back: pre_text = back[back.rfind("("):].replace("\n", " ") + " " + pre_text
            # 'eh(' / 'ou(' podem ter sido cortados: recupera prefixo na linha anterior
            if back.rstrip().endswith("eh(") or back.rstrip().endswith("ou("): pre_text = back[-3:] + pre_text
            pre, pre_any = parse_groups(pre_text)
            hours = int(glued_hours.group(1)) if glued_hours else None
            if hours is None:
                for j in range(i - 1, max(i - 12, -1), -1):
                    if re.fullmatch(r"\d{2,3}", lines[j].strip()): hours = int(lines[j].strip()); break
            # ementa: linhas entre a carga e a disciplina
            syl_lines = []
            for j in range(i - 1, max(i - 12, -1), -1):
                if re.fullmatch(r"\d{2,3}", lines[j].strip()) or re.match(r"^(Tipo|Conjunto|\d+ª Fase|Optativas|Disciplinas Optativas|Atividades)", lines[j].strip()): break
                if not re.match(r"^(eh|ou)\(|^\)$|^" + CODE + r"\)?$", lines[j].strip()): syl_lines.insert(0, lines[j].strip())
            name_raw = em.group("name").strip()
            equiv = re.findall(CODE, re.sub(r"^.*?(?=(?:ou\(|" + CODE + "))", "", name_raw)) if re.search(r"ou\(|" + CODE, name_raw) else []
            name = re.split(r"\s+(?:ou\(|" + CODE + r")", name_raw)[0].strip()
            entry = {"id": em.group("code"), "name": name, "hours": hours, "classesPerWeek": int(em.group("aulas")), "pre": pre, "preAny": pre_any, "equivalents": equiv, "syllabus": " ".join(syl_lines).strip()}
            # Quebra de página repete a última linha da tabela no bloco seguinte: mantém a 1ª ocorrência.
            if entry["id"] in seen: continue
            seen.add(entry["id"])
            if em.group("type") == "Op": optatives.append(entry)
            elif phase is not None: phases.setdefault(phase, []).append(entry)
            else: activities.append(entry)
        for line in lines:
            sm = re.match(r"^Op- Dis[a-z]+ Optativa Obrigatória (IV|III|II|I|V)(?![IV])", line)
            if sm and phase is not None:
                n = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5}[sm.group(1)]
                if f"OPT-{n}" in seen: continue
                seen.add(f"OPT-{n}")
                phases.setdefault(phase, []).append({"id": f"OPT-{n}", "name": f"Optativa Obrigatória {sm.group(1)}", "hours": None, "classesPerWeek": None, "pre": [], "preAny": [], "equivalents": [], "syllabus": ""})
    return {"title": title.group(1).strip() if title else "", "curriculumCode": title.group(2) if title else "", "phases": phases, "optatives": optatives, "activities": activities}


def build(year, parsed, legacy):
    used = set()
    def enrich(e):
        used.add(e["id"])
        meta = legacy.get(e["id"], {})
        out = {
            "id": e["id"], "name": e["name"], "shortName": meta.get("shortName") or e["name"],
            "cat": category_for(e["id"], e["name"], legacy), "hours": e["hours"], "classesPerWeek": e["classesPerWeek"],
            "pre": e["pre"], "preAny": e["preAny"], "equivalents": e["equivalents"], "ext": bool(meta.get("ext")), "syllabus": e["syllabus"],
        }
        if year == 2012:  # PDF sem pré-requisitos: preserva arestas legadas
            out["pre"] = meta.get("pre", [])
            out["preAny"] = []
        if e["id"].startswith("OPT-"):
            out["hours"] = meta.get("hours") or 54
            out["cat"] = "mgmt"
        return out
    phases = [{"phase": p, "subjects": [enrich(e) for e in parsed["phases"][p]]} for p in sorted(parsed["phases"])]
    optatives = [enrich(e) for e in parsed["optatives"]]
    # Pré-requisitos que apontam para códigos fora deste currículo (constam no PDF; não desenháveis no grafo).
    all_ids = {s["id"] for ph in phases for s in ph["subjects"]} | {s["id"] for s in optatives}
    unknown = sorted({c for ph in phases for s in ph["subjects"] for c in s["pre"] + [x for g in s["preAny"] for x in g] if c not in all_ids}
                     | {c for s in optatives for c in s["pre"] + [x for g in s["preAny"] for x in g] if c not in all_ids})
    return {
        "id": str(year), "year": year,
        "name": {"pt": f"Grade {year}" + (" (Atual)" if year == 2025 else ""), "en": f"Curriculum {year}" + (" (Current)" if year == 2025 else "")},
        "source": {"file": f"public/grades/grade{year}.pdf", "sha256": hashlib.sha256(open(f"public/grades/grade{year}.pdf", "rb").read()).hexdigest(), "title": parsed["title"], "curriculumCode": parsed["curriculumCode"], "extractedAt": datetime.date.today().isoformat(), "tool": "scripts/curriculum_from_pdf.py"},
        "prerequisitesSource": "legacy-unverified" if year == 2012 else "pdf",
        "unknownPrerequisites": unknown,
        "phases": phases, "optatives": optatives,
        "activities": [enrich(e) for e in parsed["activities"]],
    }


if __name__ == "__main__":
    legacy = legacy_metadata()
    os.makedirs(OUT_DIR, exist_ok=True)
    for year in (2025, 2016, 2012):
        data = build(year, parse_pdf(year), legacy[year])
        with open(f"{OUT_DIR}/{year}.json", "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2); f.write("\n")
        n = sum(len(p["subjects"]) for p in data["phases"])
        print(f"{year}: {n} obrigatórias em {len(data['phases'])} fases, {len(data['optatives'])} optativas, {len(data['activities'])} atividades → {OUT_DIR}/{year}.json")
