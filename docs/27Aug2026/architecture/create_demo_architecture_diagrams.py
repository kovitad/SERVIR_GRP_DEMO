from pathlib import Path
from xml.etree.ElementTree import Element, SubElement, ElementTree
from xml.sax.saxutils import escape
import subprocess

OUT = Path(__file__).parent
OUT.mkdir(parents=True, exist_ok=True)

BLUE = '#2380B0'
DARK_BLUE = '#08427B'
LIGHT_BLUE = '#E8F4FA'
GREEN = '#2E7D5B'
LIGHT_GREEN = '#E7F4ED'
PURPLE = '#704090'
LIGHT_PURPLE = '#F1EAF5'
GREY = '#5F6B70'
LIGHT_GREY = '#F3F5F6'
ORANGE = '#C77724'
LIGHT_ORANGE = '#FFF2DE'
INK = '#263238'


def html_label(title, kind, description, technology=''):
    tech = f'<br/><font color="#5F6B70"><i>{escape(technology)}</i></font>' if technology else ''
    return f'<b>{escape(title)}</b><br/><font color="#2380B0">[{escape(kind)}]</font>{tech}<br/><br/>{escape(description)}'


def mx_page(name, title, subtitle):
    diagram = Element('diagram', {'id': name.lower().replace(' ', '-'), 'name': name})
    model = SubElement(diagram, 'mxGraphModel', {
        'dx':'1600','dy':'900','grid':'1','gridSize':'10','guides':'1','tooltips':'1','connect':'1',
        'arrows':'1','fold':'1','page':'1','pageScale':'1','pageWidth':'1600','pageHeight':'900','math':'0','shadow':'0'
    })
    root = SubElement(model, 'root')
    SubElement(root, 'mxCell', {'id':'0'})
    SubElement(root, 'mxCell', {'id':'1','parent':'0'})
    add_text(root, 'title', title, 40, 24, 1520, 38, 26, True, DARK_BLUE)
    add_text(root, 'subtitle', subtitle, 40, 62, 1520, 28, 13, False, GREY)
    return diagram, root


def add_text(root, cell_id, value, x, y, w, h, size=14, bold=False, color=INK):
    style = f'text;html=1;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontSize={size};fontColor={color};fontStyle={1 if bold else 0};'
    cell = SubElement(root, 'mxCell', {'id':cell_id,'value':escape(value),'style':style,'vertex':'1','parent':'1'})
    SubElement(cell, 'mxGeometry', {'x':str(x),'y':str(y),'width':str(w),'height':str(h),'as':'geometry'})


def add_box(root, cell_id, title, kind, description, technology, x, y, w, h, fill, stroke, rounded=True, dashed=False):
    value = html_label(title, kind, description, technology)
    style = f'rounded={1 if rounded else 0};whiteSpace=wrap;html=1;arcSize=12;fillColor={fill};strokeColor={stroke};strokeWidth=2;fontColor={INK};fontSize=12;align=center;verticalAlign=middle;spacing=12;'
    if dashed: style += 'dashed=1;dashPattern=8 5;'
    cell = SubElement(root, 'mxCell', {'id':cell_id,'value':value,'style':style,'vertex':'1','parent':'1'})
    SubElement(cell, 'mxGeometry', {'x':str(x),'y':str(y),'width':str(w),'height':str(h),'as':'geometry'})


def add_boundary(root, cell_id, title, x, y, w, h):
    style = f'rounded=1;whiteSpace=wrap;html=1;arcSize=8;fillColor=#FFFFFF;fillOpacity=35;strokeColor={BLUE};strokeWidth=2;dashed=1;dashPattern=8 5;fontColor={DARK_BLUE};fontSize=14;fontStyle=1;align=left;verticalAlign=top;spacingTop=12;spacingLeft=14;'
    cell = SubElement(root, 'mxCell', {'id':cell_id,'value':escape(title),'style':style,'vertex':'1','parent':'1'})
    SubElement(cell, 'mxGeometry', {'x':str(x),'y':str(y),'width':str(w),'height':str(h),'as':'geometry'})


def add_edge(root, cell_id, source, target, label, color=GREY, dashed=False):
    style = f'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;strokeWidth=2;strokeColor={color};fontColor={INK};fontSize=10;labelBackgroundColor=#FFFFFF;'
    if dashed: style += 'dashed=1;dashPattern=6 4;'
    cell = SubElement(root, 'mxCell', {'id':cell_id,'value':escape(label),'style':style,'edge':'1','parent':'1','source':source,'target':target})
    SubElement(cell, 'mxGeometry', {'relative':'1','as':'geometry'})


def build_drawio():
    mxfile = Element('mxfile', {'host':'app.diagrams.net','modified':'2026-08-28T00:00:00.000Z','agent':'SERVIR GRP architecture generator','version':'24.7.17','type':'device','compressed':'false'})

    page, root = mx_page('C1 System Context', 'C1 — SERVIR GRP Demo: System Context', 'Purpose: show who uses the controlled demo and which external services make the live AI observability flow work.')
    add_box(root,'planner','Planner / disaster preparedness staff','Person','Runs the Phaya Thai RP100 assessment, asks for an AI explanation and gives helpful/not-helpful feedback.','Web browser · EN/TH',45,190,310,180,LIGHT_BLUE,DARK_BLUE)
    add_box(root,'reviewer','Product, technical and leadership reviewer','Person','Reviews answer evidence, traces, evaluator results, version comparison, cost and governance status.','Web browser',45,500,310,180,LIGHT_BLUE,DARK_BLUE)
    add_box(root,'system','SERVIR Global Risk Platform Demo','Software System','Supports evacuation-preparedness planning and one observable AI explanation for Phaya Thai, RP100 and a 1 km shelter-proximity threshold.','Caddy + JavaScript + Node.js · Type B-lite',500,245,520,275,LIGHT_BLUE,DARK_BLUE)
    add_box(root,'osm','OpenStreetMap','External System','Provides the real low-traffic basemap tiles used by the planning interface.','Public tile service',1210,115,310,145,LIGHT_GREY,GREY)
    add_box(root,'openai','OpenAI API','External System','Generates one planning explanation and runs three narrow AI judges.','gpt-5.2 · Responses API',1210,335,310,150,LIGHT_GREEN,GREEN)
    add_box(root,'langfuse','Langfuse Cloud','External System','Stores traces, observations, evaluator scores, token/cost metadata and planner feedback.','Configured non-production project',1210,565,310,165,LIGHT_PURPLE,PURPLE)
    add_edge(root,'e1','planner','system','Uses planning journey; asks Explain with AI; submits feedback',BLUE)
    add_edge(root,'e2','reviewer','system','Reviews five AI assurance views',BLUE)
    add_edge(root,'e3','system','osm','Requests basemap tiles over HTTPS',GREY)
    add_edge(root,'e4','system','openai','Sends governed pilot context; receives answer and judge verdicts',GREEN)
    add_edge(root,'e5','system','langfuse','Writes live trace, observations, scores and feedback',PURPLE)
    add_edge(root,'e6','reviewer','langfuse','Opens exact trace for investigation',PURPLE,True)
    add_text(root,'c1note','REAL SERVICES: OpenStreetMap · OpenAI · Langfuse     |     ILLUSTRATIVE: GRP evidence, geometry, population and analytical values     |     HUMAN REVIEW REQUIRED',40,820,1520,35,11,True,ORANGE)
    mxfile.append(page)

    page, root = mx_page('C2 Containers', 'C2 — SERVIR GRP Demo: Container Architecture', 'Purpose: show what runs locally or in Docker Compose, what each container does, and how a human action becomes a Langfuse trace.')
    add_box(root,'planner2','Planner / reviewer','Person','Uses the planning interface, assurance views and feedback controls.','Browser',30,250,250,165,LIGHT_BLUE,DARK_BLUE)
    add_box(root,'reviewer2','Technical reviewer','Person','Follows the exact trace in Langfuse for diagnosis and review.','Browser',30,560,250,140,LIGHT_BLUE,DARK_BLUE)
    add_boundary(root,'boundary','SERVIR GRP Demo software system · Local runner or Docker Compose / AWS Lightsail target',320,105,900,655)
    add_box(root,'frontend','Web application and reverse proxy','Container','Serves the EN/TH planning UI, Leaflet map and five assurance views. Proxies same-origin /api/* calls to the backend.','Caddy 2.8 + HTML/CSS/JavaScript',385,205,350,205,LIGHT_BLUE,BLUE)
    add_box(root,'backend','Observable AI pilot API','Container','Validates the fixed pilot contract; reads governed evidence; calls OpenAI; runs four code checks and three judges; sends traces/scores and feedback to Langfuse. No LangGraph is used.','Node.js 22 · built-in HTTP/fetch',825,180,335,300,LIGHT_GREEN,GREEN)
    add_box(root,'evidence','Versioned illustrative evidence','Embedded Data Store','Three stable evidence records plus deterministic values: 18,640 exposed and 11,240 beyond 1 km.','Embedded in backend image · demo-evidence-v1.0',410,540,330,145,LIGHT_ORANGE,ORANGE)
    add_box(root,'secrets','Server-side configuration','Configuration','OpenAI and Langfuse credentials stay in ignored .env or an approved deployment secret store.','Never sent to browser or Git',825,560,335,125,LIGHT_GREY,GREY)
    add_box(root,'osm2','OpenStreetMap tiles','External System','Real basemap for limited prototype traffic.','HTTPS',1300,125,260,120,LIGHT_GREY,GREY)
    add_box(root,'openai2','OpenAI Responses API','External System','One answer generation plus three narrow judge calls.','gpt-5.2',1300,350,260,130,LIGHT_GREEN,GREEN)
    add_box(root,'langfuse2','Langfuse Cloud','External System','Root trace, 8 observations, evaluator scores and human feedback.','Cloud dashboard + ingestion API',1300,600,260,145,LIGHT_PURPLE,PURPLE)
    add_edge(root,'c2e1','planner2','frontend','HTTPS: assessment, Explain with AI, assurance views and feedback',BLUE)
    add_edge(root,'c2e2','frontend','backend','Same-origin /api/observability/* JSON',GREEN)
    add_edge(root,'c2e3','frontend','osm2','Browser requests map tiles',GREY)
    add_edge(root,'c2e4','backend','evidence','Reads fixed evidence IDs, versions and deterministic values',ORANGE)
    add_edge(root,'c2e5','secrets','backend','Injects provider configuration at runtime',GREY,True)
    add_edge(root,'c2e6','backend','openai2','Answer + 3 judge requests; receives text, verdicts and usage',GREEN)
    add_edge(root,'c2e7','backend','langfuse2','Ingests trace, spans, generations, scores and feedback',PURPLE)
    add_edge(root,'c2e8','reviewer2','langfuse2','Opens trace dashboard',PURPLE,True)
    add_text(root,'c2note','CONTROLLED PILOT BOUNDARY: fixed Phaya Thai · RP100 · 1 km contract; 5 requests/client/10 min; no production authentication or durable quota yet.',320,795,1240,38,11,True,ORANGE)
    mxfile.append(page)

    tree = ElementTree(mxfile)
    tree.write(OUT/'SERVIR_GRP_Demo_C1_C2.drawio', encoding='utf-8', xml_declaration=True)


def write_dot_files():
    c1 = r'''digraph C1 {
      graph [label="C1 — SERVIR GRP Demo: System Context\nWho uses the demo and which external services make live observability work", labelloc=t, fontsize=24, fontname="Arial Bold", bgcolor="#FFFFFF", pad=0.35, nodesep=0.8, ranksep=1.0, splines=polyline];
      node [shape=box, style="rounded,filled", fontname="Arial", fontsize=11, margin="0.18,0.12", penwidth=2]; edge [fontname="Arial", fontsize=9, color="#5F6B70", penwidth=2, arrowsize=0.8];
      planner [label="Planner / disaster preparedness staff\n[Person]\n\nRuns assessment, asks Explain with AI,\nand gives helpful/not-helpful feedback", fillcolor="#E8F4FA", color="#08427B"];
      reviewer [label="Product, technical and leadership reviewer\n[Person]\n\nReviews evidence, traces, evaluators,\ncomparison, cost and governance", fillcolor="#E8F4FA", color="#08427B"];
      grp [label="SERVIR Global Risk Platform Demo\n[Software System]\n\nEvacuation-preparedness planning plus one\nobservable AI explanation for Phaya Thai,\nRP100 and a 1 km threshold\n\nCaddy + JavaScript + Node.js · Type B-lite", fillcolor="#2380B0", fontcolor="white", color="#08427B", width=5.1, height=2.2];
      osm [label="OpenStreetMap\n[External System]\n\nReal low-traffic basemap tiles", fillcolor="#F3F5F6", color="#5F6B70"];
      openai [label="OpenAI API\n[External System]\n\nOne planning explanation +\nthree narrow AI judges\n\ngpt-5.2", fillcolor="#E7F4ED", color="#2E7D5B"];
      langfuse [label="Langfuse Cloud\n[External System]\n\nTraces, observations, scores,\nusage metadata and feedback", fillcolor="#F1EAF5", color="#704090"];
      {rank=same; planner; grp; openai} {rank=same; reviewer; langfuse}
      planner -> grp [label="Uses EN/TH planning journey; asks explanation; feedback", color="#2380B0"];
      reviewer -> grp [label="Reviews five assurance views", color="#2380B0"];
      grp -> osm [label="Requests basemap tiles"];
      grp -> openai [label="Governed context → answer and judge verdicts", color="#2E7D5B"];
      grp -> langfuse [label="Writes live traces, scores and feedback", color="#704090"];
      reviewer -> langfuse [label="Opens exact trace", color="#704090", style=dashed];
      footer [shape=plain, label="REAL: OpenStreetMap · OpenAI · Langfuse    |    ILLUSTRATIVE: GRP evidence and analytical values    |    HUMAN REVIEW REQUIRED", fontcolor="#C77724", fontsize=11];
      {rank=sink; footer}
    }'''
    c2 = r'''digraph C2 {
      graph [label="C2 — SERVIR GRP Demo: Container Architecture\nHow a human action becomes a real OpenAI response and Langfuse trace", labelloc=t, fontsize=24, fontname="Arial Bold", bgcolor="#FFFFFF", pad=0.35, nodesep=0.65, ranksep=0.85, splines=polyline, compound=true];
      node [shape=box, style="rounded,filled", fontname="Arial", fontsize=10, margin="0.16,0.12", penwidth=2]; edge [fontname="Arial", fontsize=8.5, color="#5F6B70", penwidth=2, arrowsize=0.8];
      planner [label="Planner / reviewer\n[Person]\n\nPlanning, assurance views, feedback", fillcolor="#E8F4FA", color="#08427B"];
      tech [label="Technical reviewer\n[Person]\n\nTrace investigation", fillcolor="#E8F4FA", color="#08427B"];
      subgraph cluster_grp { label="SERVIR GRP Demo software system\nLocal runner or Docker Compose / AWS Lightsail target"; fontsize=14; fontname="Arial Bold"; color="#2380B0"; penwidth=2; style="rounded,dashed"; margin=24;
        frontend [label="Web application + reverse proxy\n[Container]\n\nEN/TH planning UI, Leaflet map,\nfive assurance views, /api/* proxy\n\nCaddy 2.8 + HTML/CSS/JavaScript", fillcolor="#E8F4FA", color="#2380B0"];
        backend [label="Observable AI pilot API\n[Container]\n\nValidate → evidence → OpenAI → checks/judges\n→ Langfuse trace/scores/feedback\n\nNode.js 22 · no LangGraph", fillcolor="#E7F4ED", color="#2E7D5B"];
        evidence [label="Versioned illustrative evidence\n[Embedded Data Store]\n\n3 records · 18,640 exposed ·\n11,240 beyond 1 km", fillcolor="#FFF2DE", color="#C77724"];
        secrets [label="Server-side configuration\n[Configuration]\n\n.env / approved secret store\nNever browser or Git", fillcolor="#F3F5F6", color="#5F6B70"];
        frontend -> backend [label="same-origin JSON\n/api/observability/*", color="#2E7D5B"];
        backend -> evidence [label="reads IDs, versions, values", color="#C77724"];
        secrets -> backend [label="runtime provider config", style=dashed];
      }
      osm [label="OpenStreetMap tiles\n[External System]\nReal basemap", fillcolor="#F3F5F6", color="#5F6B70"];
      openai [label="OpenAI Responses API\n[External System]\n1 answer + 3 judges · gpt-5.2", fillcolor="#E7F4ED", color="#2E7D5B"];
      langfuse [label="Langfuse Cloud\n[External System]\nRoot trace · 8 observations ·\nscores · feedback", fillcolor="#F1EAF5", color="#704090"];
      planner -> frontend [label="HTTPS: assessment, explanation, assurance, feedback", color="#2380B0"];
      frontend -> osm [label="browser map-tile requests"];
      backend -> openai [label="answer + judge requests; usage", color="#2E7D5B"];
      backend -> langfuse [label="trace, spans, generations, scores, feedback", color="#704090"];
      tech -> langfuse [label="opens trace dashboard", color="#704090", style=dashed];
      footer [shape=plain, label="CONTROLLED PILOT: Phaya Thai · RP100 · 1 km · basic rate limit · no production authentication/durable quota yet", fontcolor="#C77724", fontsize=11];
      {rank=sink; footer}
    }'''
    for name, content in [('SERVIR_GRP_Demo_C1.dot',c1),('SERVIR_GRP_Demo_C2.dot',c2)]:
        (OUT/name).write_text(content,encoding='utf-8')
        subprocess.run(['dot','-Tpng','-Gdpi=150',str(OUT/name),'-o',str(OUT/name.replace('.dot','.png'))],check=True)


if __name__ == '__main__':
    build_drawio()
    write_dot_files()
    print('Created C1/C2 draw.io and PNG architecture diagrams in', OUT)
