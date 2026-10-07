
  // Coverage area map
  (function(){
    var coverageOutline = [[51.9329,0.15144],[52.01973,0.13417],[52.20553,0.30293],[52.23782,0.3134],[52.26244,0.33486],[52.26152,1.05062],[52.25333,1.07936],[52.23615,1.09417],[52.13917,1.08337],[52.09483,1.09246],[52.05579,1.11055],[51.98532,1.17029],[51.91994,1.26528],[51.89236,1.28425],[51.86867,1.2885],[51.84573,1.2811],[51.77496,0.91281],[51.61793,1.0179],[51.59274,1.0012],[51.57488,0.96297],[51.56209,0.8965],[51.55588,0.78597],[51.56093,0.61506],[51.57966,0.38966],[51.5736,0.32655],[51.63318,0.19133],[51.6602,0.16627],[51.9329,0.15144]];

    var towns = [
      { name:"Chelmsford", coords:[51.7356, 0.4685] },
      { name:"Cambridge", coords:[52.2053, 0.1218] },
      { name:"Bury St Edmunds", coords:[52.2474, 0.7183] },
      { name:"Haverhill", coords:[52.0820, 0.4380] },
      { name:"Clare", coords:[52.0780, 0.5810] },
      { name:"Castle Hedingham", coords:[51.9900, 0.6000] },
      { name:"Halstead", coords:[51.9451, 0.6390] },
      { name:"Stowmarket", coords:[52.1899, 0.9998] },
      { name:"Ipswich", coords:[52.0567, 1.1482] },
      { name:"Hadleigh", coords:[52.0440, 0.9520] },
      { name:"Colchester", coords:[51.8959, 0.9035] },
      { name:"Clacton-on-Sea", coords:[51.7899, 1.1560] },
      { name:"Southend-on-Sea", coords:[51.5459, 0.7077] },
      { name:"Romford", coords:[51.5812, 0.1837] },
      { name:"Enfield", coords:[51.6521, -0.0807] },
      { name:"Sudbury", coords:[52.0400, 0.7300], accent:true }
    ];

    function initEssexMap(){
      var mapEl = document.getElementById('essex-map');
      if (!mapEl || !window.L) return;

      var hiddenTowns = {
        'Cambridge': true,
        'Clacton-on-Sea': true,
        'Southend-on-Sea': true,
        'Romford': true,
        'Enfield': true,
        'Ipswich': true,
        'Clare': true,
        'Castle Hedingham': true
      };

      var highlightedTowns = {
        'Sudbury': true,
        'Chelmsford': true,
        'Halstead': true,
        'Colchester': true,
        'Bury St Edmunds': true,
        'Haverhill': true,
        'Stowmarket': true
      };

      var mapTowns = towns
        .filter(function(t){ return !hiddenTowns[t.name]; })
        .map(function(t){
          if (highlightedTowns[t.name]) {
            return { name:t.name, coords:t.coords, accent:true };
          }
          return t;
        });

      var map = L.map('essex-map', {
        scrollWheelZoom:false,
        zoomControl:true,
        attributionControl:true
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom:18,
        subdomains:'abcd'
      }).addTo(map);

      map.fitBounds(L.latLngBounds(mapTowns.map(function(t){ return t.coords; })), { padding:[34,34] });

      // let scroll-zoom kick in only once someone actually interacts with the map,
      // so the map doesn't trap the page scroll
      map.on('click', function(){ map.scrollWheelZoom.enable(); });
      mapEl.addEventListener('mouseleave', function(){ map.scrollWheelZoom.disable(); });

      mapTowns.forEach(function(t){
        var icon = L.divIcon({
          className:'',
          html:'<div class="map-pin' + (t.accent ? ' accent' : '') + '"></div>',
          iconSize: t.accent ? [16,16] : [11,11],
          iconAnchor: t.accent ? [8,8] : [5.5,5.5]
        });
        L.marker(t.coords, { icon:icon, keyboard:false })
          .addTo(map)
          .bindTooltip(t.name, { permanent:true, direction:'right', offset:[9,0], className:'map-tooltip' });
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initEssexMap);
    } else {
      initEssexMap();
    }
  })();
