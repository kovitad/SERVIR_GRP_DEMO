# SERVIR GRP Demo Architecture — C1 and C2

**Purpose:** provide a simple visual explanation of what the Type B-lite demo does, who uses it, what runs inside it and which services are real versus illustrative.

## Files

- `SERVIR_GRP_Demo_C1.png` — C1 System Context picture
- `SERVIR_GRP_Demo_C2.png` — C2 Container picture
- `SERVIR_GRP_Demo_C1_C2.drawio` — editable diagrams.net file with two pages
- `create_demo_architecture_diagrams.py` — reproducible source
- `SERVIR_GRP_Demo_C1.dot` and `SERVIR_GRP_Demo_C2.dot` — Graphviz picture sources

Open the `.drawio` file in [app.diagrams.net](https://app.diagrams.net/) or the diagrams.net desktop application.

## How to read C1

C1 answers: **Who uses the demo, what is the SERVIR GRP Demo system, and what external systems does it depend on?**

- A Planner runs the assessment, requests an AI explanation and submits feedback.
- Product, technical and leadership reviewers inspect the assurance views and exact Langfuse trace.
- The SERVIR GRP Demo uses real OpenStreetMap tiles, OpenAI and Langfuse Cloud.
- GRP evidence, geometry, population and analytical values remain illustrative.

## How to read C2

C2 answers: **What runs inside the demo and how does a click become a trace?**

1. The Caddy/JavaScript web application presents the EN/TH planning and assurance interfaces.
2. `/api/observability/*` is proxied to the internal Node.js backend.
3. The backend validates the fixed Phaya Thai/RP100/1 km contract and reads three versioned illustrative evidence records.
4. OpenAI produces one answer and three narrow judge results.
5. The backend sends the root trace, eight observations, scores, usage and feedback to Langfuse.
6. Provider credentials remain server-side.

The Node workflow is manually orchestrated. **LangGraph is not currently used.**
