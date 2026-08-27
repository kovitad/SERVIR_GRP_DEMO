/* Real OpenStreetMap basemap integration for the static planning prototype.
 * Basemap geography is real. AOI outlines and analytical overlays remain mocked,
 * as stated throughout the interface.
 */
(() => {
  const host = document.getElementById('realMap');
  const canvas = document.getElementById('mapCanvas');
  if (!host || !canvas || typeof L === 'undefined') return;

  const locations = {
    'phaya-thai': {center:[13.7805,100.5428], zoom:13, label:'Phaya Thai District'},
    'warin-chamrap': {center:[15.1932,104.8626], zoom:12, label:'Warin Chamrap District'},
    'kham-nam-saep': {center:[15.1668,104.8848], zoom:14, label:'Kham Nam Saep sub-district'}
  };

  const map = L.map(host, {
    center:[13.2,101.1], zoom:6, zoomControl:false, minZoom:5, maxZoom:18,
    preferCanvas:true
  });

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom:19,
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  L.control.zoom({position:'bottomright'}).addTo(map);
  L.control.scale({position:'bottomright', imperial:false, maxWidth:110}).addTo(map);

  ['planning','vulnerability','risk','user'].forEach((name,index) => {
    map.createPane(`${name}Pane`);
    map.getPane(`${name}Pane`).style.zIndex = String(410 + index * 10);
  });

  const groups = {
    boundary:L.layerGroup().addTo(map), flood:L.layerGroup().addTo(map),
    candidates:L.layerGroup().addTo(map), vulnerability:L.layerGroup().addTo(map),
    risk:L.layerGroup().addTo(map), user:L.layerGroup().addTo(map)
  };

  const candidateOffsets = [[.010,.012],[.003,.020],[-.008,.010],[-.012,.024],[-.020,.015]];
  const riskOffsets = [[.010,.012],[.003,.020],[-.008,.010],[-.012,.024],[-.020,.015],[.010,-.018],[-.001,-.011],[-.010,-.022]];
  const vulnerabilityOffsets = [[.012,-.022],[.012,-.010],[.001,-.022],[.001,-.010]];
  let lastAOI = null;
  let lastSignature = '';

  function markerIcon(className, label) {
    return L.divIcon({className:`grp-map-marker ${className}`,html:`<span>${label}</span>`,iconSize:[34,34],iconAnchor:[17,17]});
  }

  function currentLocation() {
    return locations[typeof selectedAOI !== 'undefined' ? selectedAOI : ''] || null;
  }

  function scaledOffset([lat,lng], location) {
    const scale = location.zoom >= 14 ? .55 : location.zoom <= 12 ? 1.6 : 1;
    return [location.center[0] + lat * scale, location.center[1] + lng * scale];
  }

  function clearAnalysis() {
    groups.flood.clearLayers(); groups.candidates.clearLayers();
    groups.vulnerability.clearLayers(); groups.risk.clearLayers();
  }

  function drawBoundary(location) {
    groups.boundary.clearLayers();
    const s = location.zoom >= 14 ? .018 : location.zoom <= 12 ? .065 : .035;
    const [lat,lng] = location.center;
    L.polygon([
      [lat+s*.72,lng-s],[lat+s,lng+s*.28],[lat+s*.35,lng+s],
      [lat-s*.72,lng+s*.82],[lat-s,lng-s*.18],[lat-s*.18,lng-s*.92]
    ], {pane:'planningPane',color:'#2380b0',weight:3,fillColor:'#dceef7',fillOpacity:.13,dashArray:'8 5'})
      .bindTooltip(`${location.label} · illustrative AOI outline`,{sticky:true}).addTo(groups.boundary);
  }

  function drawFlood(location, scenario) {
    const factor = scenario === '20' ? .62 : scenario === '50' ? .82 : 1;
    const s = (location.zoom >= 14 ? .010 : location.zoom <= 12 ? .037 : .020) * factor;
    const [lat,lng] = location.center;
    L.polygon([
      [lat+s*1.8,lng-s*1.15],[lat+s*1.35,lng-s*.25],[lat+s*.55,lng-s*.65],
      [lat-s*.15,lng+s*.05],[lat-s*.9,lng-s*.25],[lat-s*1.65,lng+s*.45],
      [lat-s*1.9,lng-s*.4],[lat-s*.8,lng-s*1.15],[lat+s*.2,lng-s*.85]
    ], {pane:'planningPane',color:'#087fa4',weight:2,fillColor:'#1595bc',fillOpacity:.26})
      .bindTooltip(`RP${scenario} illustrative flood extent`,{sticky:true}).addTo(groups.flood);
  }

  function drawCandidates(location) {
    candidateOffsets.forEach((offset,index) => {
      const id = `P-0${index+1}`;
      L.marker(scaledOffset(offset,location),{pane:'planningPane',icon:markerIcon('candidate-marker',`C${index+1}`),title:`Candidate C${index+1}`})
        .on('click',() => openCandidatePlace(id)).addTo(groups.candidates);
    });
  }

  function drawVulnerability(location) {
    const size = location.zoom >= 14 ? .0034 : location.zoom <= 12 ? .011 : .006;
    vulnerabilityOffsets.forEach((offset,index) => {
      const center = scaledOffset(offset,location), id=`V-0${index+1}`;
      L.rectangle([[center[0]-size,center[1]-size],[center[0]+size,center[1]+size]],{
        pane:'vulnerabilityPane',className:'leaflet-vulnerability-zone',color:'#653181',weight:3,fillColor:'#8a5aa3',fillOpacity:.32,dashArray:'7 4'
      }).bindTooltip(`V${index+1}`,{permanent:true,direction:'center',className:'vulnerability-label',ariaLabel:`V${index+1} aggregated illustrative zone`})
        .on('click',() => openVulnerabilityZone(id)).addTo(groups.vulnerability);
    });
  }

  function drawRisk(location, scenario) {
    const levels = riskLevels[scenario];
    riskOffsets.forEach((offset,index) => {
      const id=`C-0${index+1}`;
      const level=levels.high.includes(id)?'high':levels.medium.includes(id)?'medium':'low';
      const code={high:'H',medium:'M',low:'L'}[level];
      L.marker(scaledOffset(offset,location),{pane:'riskPane',icon:markerIcon(`risk-marker risk-${level}`,code),title:`${level} risk point`})
        .on('click',() => openCentre(id)).addTo(groups.risk);
    });
  }

  function render(force=false) {
    const location=currentLocation();
    const scenario=typeof selectedScenario === 'undefined' ? '100' : selectedScenario;
    const results=canvas.classList.contains('results-visible');
    const vulnerability=canvas.classList.contains('vulnerable-view') && !canvas.classList.contains('risk-view');
    const risk=canvas.classList.contains('risk-view');
    const signature=`${selectedAOI || ''}|${scenario}|${results}|${vulnerability}|${risk}`;
    if (!force && signature === lastSignature) return;
    lastSignature=signature;

    if (!location) {
      groups.boundary.clearLayers(); clearAnalysis();
      if (lastAOI) map.setView([13.2,101.1],6);
      lastAOI=null; return;
    }
    if (lastAOI !== selectedAOI) {
      lastAOI=selectedAOI;
      map.flyTo(location.center,location.zoom,{duration:.7});
      drawBoundary(location);
    }
    clearAnalysis();
    if (results) {
      drawFlood(location,scenario);
      if (risk) drawRisk(location,scenario);
      else {
        drawCandidates(location);
        if (vulnerability) drawVulnerability(location);
      }
    }
    setTimeout(() => map.invalidateSize(),50);
  }

  map.on('click', event => {
    if (typeof candidateMode !== 'undefined' && candidateMode) {
      groups.user.clearLayers();
      L.marker(event.latlng,{pane:'userPane',icon:markerIcon('user-candidate-marker','▲'),title:'User candidate POI'}).addTo(groups.user);
      placeCandidate();
    }
  });

  new MutationObserver(() => requestAnimationFrame(() => render()))
    .observe(canvas,{attributes:true,attributeFilter:['class']});
  const aoiLabel=document.getElementById('globalAOI');
  if (aoiLabel) new MutationObserver(() => requestAnimationFrame(() => render(true)))
    .observe(aoiLabel,{subtree:true,childList:true,characterData:true});

  window.addEventListener('resize',() => map.invalidateSize());
  window.GRP_MAP={map,render,layers:groups};
  render(true);
})();
