# Changelog

## 0.9.1-prototype

- Redesigned the login cover as a clearly labelled Thailand reference experience rather than a mandatory Hub frontend.
- Added the supplied Thailand flood-planning artwork as decorative, responsive cover imagery while retaining the SERVIR identity and accessible text contrast.
- Updated the login-panel instructions for authorised access and one-click demo Planner entry without changing authentication behaviour.
- Prioritised the login form on small screens and hides nonessential artwork on mobile.

## 0.9.0-prototype

- Added optional one-click Planner demo access without exposing account credentials; Admin access remains password-protected.
- Added authenticated hub feedback submission with name, hub, category, text, optional HTTP/HTTPS document link and an optional 1 MB PNG/JPG/WebP/DOCX attachment.
- Added server-side file-signature checks, generated storage names, submission rate limiting and persistent Docker storage.
- Added an Admin-only feedback inbox with status management, protected attachment downloads and CSV export.
- Added safe migration of the missing Planner quick-login setting for existing Lightsail `.env` files and a feedback-volume backup script.
- Added upload progress, feedback reference numbers and CI/API/browser coverage for the new workflow.
- Fixed map controls appearing above the preparedness investment-brief dialog and other global overlays.
- Reduced the large flood-scenario evidence card to a compact secondary information icon; RP scenario context remains in the status bar.
- Permitted an explicitly configured HTTP-only demonstration while retaining a clear warning that feedback and session traffic are not encrypted.

## 0.8.0-prototype

- Made AI generation deny-by-default with the server master lock `AI_FEATURE_ALLOWED=false`.
- Added an Admin-only AI cost-control panel; runtime access always starts OFF after backend restart.
- Added time-limited enablement (15 minutes by default), a global explanation budget (five by default), automatic shutoff and immediate Admin disable.
- Added `AI_REQUIRE_HTTPS=true`: local 127.0.0.1 testing is allowed, while AI generation over public HTTP is blocked.
- Added per-account/IP request limiting in addition to the global runtime budget.
- Kept OpenAI/Langfuse keys backend-only and removed admin-only metrics/links from Planner explanation responses.
- Added clear Planner disabled state and protected Admin API routes for enable/disable controls.
- Added deployment documentation for HTTPS, AWS secret storage, `.env` permissions, provider spend limits and key rotation.
- Added secret-safe environment validation and `ai-master.sh status|allow|lock` AWS operator commands so AI state changes recreate only the backend and never print or alter provider keys.
- Deployment/update now validate account and AI configuration before rebuilding; Ubuntu bootstrap explicitly installs Python 3 for these controls.

## 0.7.0-prototype

- Added a single-active-overlay manager so opening an AOI menu, detail drawer or modal automatically closes competing overlays.
- Prevented detail drawers and upload/report/export modals from stacking over one another.
- Added Escape-key dismissal for the active modal, drawer, AOI menu, AI Assurance workspace and map-only mode.
- Added outside-click dismissal for modal backdrops and the AOI menu.
- Added a **Map only** control that hides chat, planning cards, status, legend and floating result panels while preserving the map toolbar and Leaflet controls.
- Added **Exit map only** restoration without losing the prior assessment or selected map state.
- Moved **Show planning information** from a floating map overlay into the toolbar so it cannot cover map figures or markers.
- Made the collapsed planning panel inert, hidden from accessibility navigation and unable to receive hover/click events until restored.
- Made AI Assurance and sign-out close transient planning overlays before changing workspace.
- Connected the Layers control to minimize/expand the layer legend with clear feedback.
- Added English/Thai localisation for map-only and layer-control states.

## 0.6.0-prototype

- Added an administrator-only AI Assurance Dashboard backed by the 31 August 2026 Langfuse CSV export.
- Added trace-level normalisation that deduplicates repeated observation scores and excludes the preflight trace from operational KPIs.
- Added assurance KPIs for deterministic checks, groundedness review, feedback coverage, P95 latency, tokens and estimated cost.
- Added English/Thai and workflow-completeness filters, evaluator distributions and an explicit action-required assurance state.
- Added a six-run trace explorer with operation timelines, input/output inspection, model, latency, token, cost and missing-operation details.
- Added deterministic and AI-judge evaluation details plus a prioritised human-review queue.
- Added an admin-only dashboard API; planners cannot retrieve the historical trace export.
- Added per-user AI request, feedback, token, cost, average-latency and last-active reporting for authenticated activity.
- New Langfuse traces receive the authenticated username as server-controlled `userId` and application role metadata; legacy pre-login traces remain explicitly unattributed.
- Bundled a normalised static-export dataset for the controlled team demonstration and labelled it separately from live monitoring.

## 0.5.0-prototype

- Added a SERVIR-branded sign-in page for administrator and planner accounts configured through server-side environment variables.
- Added HttpOnly, SameSite=Strict, eight-hour in-memory sessions plus sign-in throttling and sign-out.
- Added role-based destinations: administrators enter AI assurance; planners enter the planning workspace.
- Limited planner assurance navigation to the generated answer and feedback while retaining administrator assurance views.
- Protected observability status, explanation and feedback API routes from unauthenticated access.
- Added authentication configuration, validation and authenticated CI smoke coverage.

## 0.4.0-prototype

- Added the Type B-lite server-side observable AI pilot for the Phaya Thai RP100 / 1 km question.
- Added real OpenAI generation and three narrow judges for groundedness, question relevance and action usefulness.
- Added real Langfuse traces for validation, evidence retrieval, deterministic results, generation, judge calls and evaluation.
- Added four deterministic checks and Langfuse scores attached to the evaluation observation.
- Added planner feedback recording in Langfuse.
- Added bilingual answer, trace, evaluation, version-comparison and assurance-dashboard screens.
- Added a separate Node.js backend container and Caddy `/api/*` reverse proxy; provider keys remain server-side.
- Restricted the live workflow to the approved scenario and added an in-memory five-request/ten-minute pilot rate limit.
- Added browser-test screenshots and updated deployment, CI, handover and environment documentation.
- Added editable C1 System Context and C2 Container diagrams in draw.io format with PNG pictures and reproducible Graphviz sources.

## 0.3.0-prototype

- Replaced the mocked SVG basemap with a real interactive OpenStreetMap basemap.
- Added locally hosted Leaflet 1.9.4 with no API key or external JavaScript dependency.
- Added AOI fly-to behaviour and map-bound illustrative flood, candidate, vulnerability and H/M/L layers.
- Preserved explicit separation between the real basemap and mocked analytical overlays.
- Added container CSP and smoke-test coverage for OpenStreetMap tiles and map assets.

## 0.2.0-prototype

- Applied the 27 August SERVIR presentation colour and typography theme.
- Added the SERVIR Global Collaborative logo extracted from the presentation source.
- Added application-wide English/Thai switching for static and dynamically generated interface content.
- Persisted the selected language in browser local storage.

## 0.1.9-prototype

- Removed analyst-validation status, comments, modal, KPI and action controls from the first phase.
- Removed candidate “Partial”, “Unknown” and “Needs validation” labels.
- Reframed the five candidates around nearby vulnerable zones and movement-support information.
- Simplified candidate details to location comparison, movement focus and first-phase limitations.

## 0.1.8-prototype

- Added a labelled horizontal bar chart to the Vulnerable people map view.
- Chart values and bar lengths update consistently for RP20, RP50 and RP100, including scenario changes after an assessment.
- Added explicit category-overlap and people-versus-households unit warnings.

## 0.1.7-prototype

- Renamed the output to **Preparedness investment brief**.
- Reframed report generation as building a strategic case for preparedness investment.
- Added the eight requested evidence, action, investment, limitation and map sections.
- Updated the editable document content, filename, interface button and assistant wording.

## 0.1.6-prototype

- Replaced the centre-per-population density ratio with **Shelter proximity and population gaps**.
- Added selectable 500 m, 1 km and 2 km illustrative thresholds.
- Added people-by-distance-band results, priority areas, supporting figures and map-layer guidance.
- Added explicit straight-line, capacity, accessibility, route-safety and approval limitations.

## 0.1.5-prototype

- Added upload guidance for GeoTIFF raster data.
- Listed supported vector formats: zipped Shapefile, GeoJSON, KML, KMZ and zipped FileGDB.
- Clarified CRS, Shapefile component and simulated-ingestion requirements.

## 0.1.4-prototype

- Replaced user-facing “Tambon” terminology with “sub-district”.
- Updated the Kham Nam Saep example and AOI level labels consistently.

## 0.1.3-prototype

- Replaced the one-way result-panel close action with reversible hide/show controls.
- Added a clear **Show planning information** button when the map is expanded.
- Preserved the active candidate/vulnerable-people view while toggling the panel.

## 0.1.2-prototype

- Fixed `undefined` appearing when selecting Prepare a budget case after deployment.
- Added versioned CSS/JavaScript URLs and revalidation headers to prevent stale mixed releases.
- Added a safe fallback for unknown planning-purpose values.

## 0.1.1-prototype

- Restored the systematic 25 August evacuation-planning interface.
- Added four aggregated vulnerable-population map zones to the Vulnerable people tab.
- Added zone evidence drawers, privacy/overlap warnings and a dedicated legend state.
- Retained the broader automated proximity concept as archived research rather than the active UI.

## 0.1.0-prototype

- Added nationwide Thailand district/Tambon AOI examples.
- Added candidate-place and vulnerable-people planning viewpoints.
- Added editable preparedness budget-report generation.
- Added supporting H/M/L risk-map view and SVG/GeoJSON/JSON downloads.
- Added self-contained Caddy container and AWS Lightsail deployment files.
