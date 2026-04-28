(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=6,t=1/120,n=1/14,r=720,i=1/60,a=2200,o=6,s=[.25,1,5,10,25,50,100],c=[{id:`parking-orbit`,name:`Parking Orbit`,summary:`A stable low orbit around the ocean planet. Use small burns to shape the ellipse without leaving the planet well.`,objective:`Raise apoapsis or circularize after a short retro/prograde test burn.`,anchorId:`planet`,parentId:`star`,orbitRadius:28,phaseDeg:110,speedFactor:1,burnMagnitude:.35,burnAngleDeg:0,recommendedZoom:1.28,recommendedFocus:`planet`,recommendedTimeScaleIndex:2},{id:`moon-transfer`,name:`Moon Transfer`,summary:`Start from low orbit around the planet with a stronger prograde burn aimed at a lunar encounter.`,objective:`Thread the transfer so the moon becomes the dominant body before apoapsis drifts away.`,anchorId:`planet`,parentId:`star`,orbitRadius:28,phaseDeg:164,speedFactor:1,burnMagnitude:3.4,burnAngleDeg:-2,recommendedZoom:1.05,recommendedFocus:`planet`,recommendedTimeScaleIndex:3},{id:`free-return`,name:`Free Return`,summary:`A slightly canted burn that can loop the probe around the moon and bend it back toward the planet.`,objective:`Keep the burn light enough to remain planet-bound while still clipping the moon sphere of influence.`,anchorId:`planet`,parentId:`star`,orbitRadius:28,phaseDeg:152,speedFactor:1,burnMagnitude:3.05,burnAngleDeg:9,recommendedZoom:1.05,recommendedFocus:`planet`,recommendedTimeScaleIndex:3},{id:`escape-shot`,name:`Escape Shot`,summary:`A hard burn from low orbit that kicks the probe loose from the planet and into a solar trajectory.`,objective:`Tune the burn until the dominant body flips to the star and the predicted orbit stays cleanly hyperbolic.`,anchorId:`planet`,parentId:`star`,orbitRadius:28,phaseDeg:206,speedFactor:1,burnMagnitude:6.8,burnAngleDeg:-4,recommendedZoom:.92,recommendedFocus:`probe`,recommendedTimeScaleIndex:4},{id:`lunar-capture`,name:`Lunar Capture`,summary:`Begin high around the moon and pull the orbit tighter with a retrograde burn.`,objective:`Drop periapsis toward the moon without turning the path into an impact trajectory.`,anchorId:`moon`,parentId:`planet`,orbitRadius:14,phaseDeg:-36,speedFactor:1,burnMagnitude:.65,burnAngleDeg:180,recommendedZoom:1.4,recommendedFocus:`moon`,recommendedTimeScaleIndex:2}],l=c[0].id;function u(e,t){return{x:e,y:t}}function d(e,t){return{x:e.x+t.x,y:e.y+t.y}}function f(e,t){return{x:e.x-t.x,y:e.y-t.y}}function p(e,t){return{x:e.x*t,y:e.y*t}}function m(e){return Math.hypot(e.x,e.y)}function h(e){let t=m(e);return t<=1e-9?{x:1,y:0}:p(e,1/t)}function ee(e,t){let n=Math.cos(t),r=Math.sin(t);return{x:e.x*n-e.y*r,y:e.x*r+e.y*n}}function te(e){return{x:-e.y,y:e.x}}function ne(e,t){return e.x*t.x+e.y*t.y}function re(e,t){return e.x*t.y-e.y*t.x}function ie(e,t,n){return Math.max(t,Math.min(n,e))}function g(e){return{x:e.x,y:e.y}}function ae(e){return{...e,position:g(e.position),velocity:g(e.velocity),trail:e.trail.map(g)}}function oe(e){return{...e,position:g(e.position),velocity:g(e.velocity),trail:e.trail.map(g)}}function se(e){return e*Math.PI/180}function ce(){let e={id:`star`,name:`Helios`,mass:9e4,radius:34,color:`#f3b35f`,glow:`#ffd08b`,position:u(0,0),velocity:u(0,0),trail:[u(0,0)],fixed:!0},t=Math.sqrt(e.mass/320),n={id:`planet`,name:`Tethys`,mass:8e3,radius:14,color:`#71d3d7`,glow:`#b8f3f3`,position:u(320,0),velocity:u(0,t),trail:[u(320,0)]},r=Math.sqrt(n.mass/74);return[e,n,{id:`moon`,name:`Nysa`,mass:900,radius:8,color:`#d7dbf9`,glow:`#ffffff`,position:u(394,0),velocity:u(0,t+r),trail:[u(394,0)]}]}function _(e){return c.find(t=>t.id===e)??c[0]}function v(e,t){let n=e.find(e=>e.id===t);if(!n)throw Error(`Missing body: ${t}`);return n}function le(e,t){let n=v(e,t.anchorId),r=v(e,t.parentId),i=ee(h(f(n.position,r.position)),se(t.phaseDeg)),a=Math.sign(re(f(n.position,r.position),f(n.velocity,r.velocity)))||1,o=p(te(i),a),s=Math.sqrt(n.mass/t.orbitRadius)*t.speedFactor;return{name:`Aster`,radius:5,color:`#ff8d72`,glow:`#ffc8b8`,position:d(n.position,p(i,t.orbitRadius)),velocity:d(n.velocity,p(o,s)),trail:[],impactBodyId:null}}function ue(e=l){let t=_(e),n=ce(),r=le(n,t);return{presetId:t.id,bodies:n,probe:r,burnPlan:{magnitude:t.burnMagnitude,angleDeg:t.burnAngleDeg},time:0,burnsExecuted:0,trailAccumulator:0}}function de(t,n){let r=u(0,0);for(let i of n){let n=f(i.position,t),a=n.x*n.x+n.y*n.y+e*e,o=1/Math.sqrt(a),s=i.mass*o*o*o;r=d(r,p(n,s))}return r}function fe(t){let n=new Map;for(let r of t){if(r.fixed){n.set(r.id,u(0,0));continue}let i=u(0,0);for(let n of t){if(n.id===r.id)continue;let t=f(n.position,r.position),a=t.x*t.x+t.y*t.y+e*e,o=1/Math.sqrt(a),s=n.mass*o*o*o;i=d(i,p(t,s))}n.set(r.id,i)}return n}function pe(e,t){for(let n of t){let t=n.radius+e.radius;if(m(f(e.position,n.position))<=t)return n.id}return null}function me(e,t,n){let r=fe(e),i=de(t.position,e);for(let t of e){if(t.fixed)continue;let e=r.get(t.id);e&&(t.position=d(t.position,d(p(t.velocity,n),p(e,.5*n*n))))}t.position=d(t.position,d(p(t.velocity,n),p(i,.5*n*n)));let a=fe(e),o=de(t.position,e);for(let t of e){if(t.fixed)continue;let e=r.get(t.id),i=a.get(t.id);!e||!i||(t.velocity=d(t.velocity,p(d(e,i),.5*n)))}t.velocity=d(t.velocity,p(d(i,o),.5*n))}function he(e,t){e.push(g(t)),e.length>r&&e.splice(0,e.length-r)}function y(e,r){if(e.probe.impactBodyId)return;let i=r;for(;i>1e-9;){let r=Math.min(t,i);if(me(e.bodies,e.probe,r),e.time+=r,e.trailAccumulator+=r,e.trailAccumulator>=n){for(let t of e.bodies)he(t.trail,t.position);he(e.probe.trail,e.probe.position),e.trailAccumulator=0}let a=pe(e.probe,e.bodies);if(a){e.probe.impactBodyId=a,e.probe.velocity=u(0,0);break}i-=r}}function ge(e){let t=e.bodies[0],n=-1/0;for(let r of e.bodies){let i=f(r.position,e.probe.position),a=r.mass/Math.max(1,ne(i,i));a>n&&(n=a,t=r)}return t}function _e(e,t){return t>=0?e>1.02?`escape`:`borderline escape`:e<.08?`near-circular`:e<1?`elliptic`:`unstable`}function ve(e){let t=ge(e),n=f(e.probe.position,t.position),r=f(e.probe.velocity,t.velocity),i=t.mass,a=m(n),o=m(r),s=m(e.probe.velocity),c=o*o/2-i/Math.max(a,1),l=re(n,r),u=m(f(p(n,(o*o-i/Math.max(a,1))/i),p(r,ne(n,r)/i))),d=null,h=null;if(c<0){let e=-i/(2*c);d=e*(1-u),h=u<1?e*(1+u):null}else Math.abs(l)>1e-6&&(d=l*l/(i*(1+u)));return{dominantBodyId:t.id,dominantBodyName:t.name,altitude:a-t.radius,distance:a,speed:s,relativeSpeed:o,energy:c,eccentricity:u,periapsis:d,apoapsis:h,orbitClass:_e(u,c)}}function ye(e,t){e.burnPlan={magnitude:ie(t.magnitude,0,8),angleDeg:ie(t.angleDeg,-180,180)}}function b(e){let t=ge(e),n=f(e.probe.velocity,t.velocity);return p(ee(m(n)>1e-5?h(n):h(te(f(e.probe.position,t.position))),se(e.burnPlan.angleDeg)),e.burnPlan.magnitude)}function x(e){e.probe.impactBodyId||(e.probe.velocity=d(e.probe.velocity,b(e)),e.burnsExecuted+=1)}function S(e,t){let n=e.bodies.map(ae),r=oe(e.probe);t&&!r.impactBodyId&&(r.velocity=d(r.velocity,b(e)));let s=[g(r.position)];for(let e=0;e<a&&(me(n,r,i),e%o===0&&s.push(g(r.position)),!(pe(r,n)||m(r.position)>2400));e+=1);return s}function C(e,t){return g(t===`probe`?e.probe.position:v(e.bodies,t).position)}function w(e,t){return t===`probe`?e.probe.name:v(e.bodies,t).name}function be(e){return e.probe.impactBodyId?v(e.bodies,e.probe.impactBodyId).name:null}function T(e,t=2){let n=10**t;return Math.round(e*n)/n}function xe(e){return()=>{e|=0,e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}function Se(e=160){let t=xe(84271),n=[];for(let r=0;r<e;r+=1){let e=180+t()*40;n.push({x:t(),y:t(),radius:.4+t()*1.8,alpha:.18+t()*.52,tint:`hsla(${e}, 70%, 88%, ${.25+t()*.5})`})}return n}function E(e,t,n,r,i){return{x:n/2+(e.x-t.center.x)*i,y:r/2-(e.y-t.center.y)*i}}function Ce(e,t,n,r){let i=e.createLinearGradient(0,0,t,n);i.addColorStop(0,`#07121f`),i.addColorStop(.55,`#10263c`),i.addColorStop(1,`#122f39`),e.fillStyle=i,e.fillRect(0,0,t,n);let a=e.createRadialGradient(t*.82,n*.12,10,t*.82,n*.12,t*.72);a.addColorStop(0,`rgba(247, 194, 126, 0.32)`),a.addColorStop(.35,`rgba(58, 127, 134, 0.16)`),a.addColorStop(1,`rgba(0, 0, 0, 0)`),e.fillStyle=a,e.fillRect(0,0,t,n);for(let i of r)e.beginPath(),e.fillStyle=i.tint,e.globalAlpha=i.alpha,e.arc(i.x*t,i.y*n,i.radius,0,Math.PI*2),e.fill();e.globalAlpha=1}function we(e,t,n){e.strokeStyle=`rgba(174, 219, 223, 0.07)`,e.lineWidth=1;for(let r=0;r<=t;r+=68)e.beginPath(),e.moveTo(r,0),e.lineTo(r,n),e.stroke();for(let r=0;r<=n;r+=68)e.beginPath(),e.moveTo(0,r),e.lineTo(t,r),e.stroke()}function Te(e,t,n,r,i,a,o,s){if(!(t.length<2)){e.beginPath();for(let n=0;n<t.length;n+=1){let s=E(t[n],r,i,a,o);n===0?e.moveTo(s.x,s.y):e.lineTo(s.x,s.y)}e.strokeStyle=n,e.lineWidth=s,e.stroke()}}function Ee(e,t,n,r,i,a){if(!(t.length<2)){e.save(),e.beginPath();for(let o=0;o<t.length;o+=1){let s=E(t[o],n,r,i,a);o===0?e.moveTo(s.x,s.y):e.lineTo(s.x,s.y)}e.setLineDash([8,7]),e.lineWidth=2,e.strokeStyle=`rgba(255, 242, 214, 0.72)`,e.stroke(),e.restore()}}function De(e,t,n,r,i,a,o){let s=E(t.position,n,r,i,a),c=Math.max(3,t.radius*a);e.save(),e.shadowBlur=o?26:18,e.shadowColor=t.glow,e.fillStyle=t.color,e.beginPath(),e.arc(s.x,s.y,c,0,Math.PI*2),e.fill(),o&&(e.shadowBlur=0,e.strokeStyle=`rgba(255, 245, 221, 0.92)`,e.lineWidth=2,e.beginPath(),e.arc(s.x,s.y,c+8,0,Math.PI*2),e.stroke()),e.shadowBlur=0,e.fillStyle=`rgba(236, 245, 248, 0.88)`,e.font=`600 13px "Space Grotesk", sans-serif`,e.fillText(t.name,s.x+c+8,s.y-c-6),e.restore()}function Oe(e,t,n,r,i,a,o){let s=E(t.position,n,r,i,a),c=Math.max(5,t.radius*a*1.3);e.save(),e.translate(s.x,s.y),e.rotate(Math.atan2(-t.velocity.y,t.velocity.x)),e.shadowBlur=o?18:12,e.shadowColor=t.glow,e.fillStyle=t.color,e.beginPath(),e.moveTo(c,0),e.lineTo(-c*.9,c*.55),e.lineTo(-c*.45,0),e.lineTo(-c*.9,-c*.55),e.closePath(),e.fill(),o&&(e.shadowBlur=0,e.strokeStyle=`rgba(255, 244, 212, 0.9)`,e.lineWidth=2,e.beginPath(),e.arc(0,0,c+8,0,Math.PI*2),e.stroke()),e.restore(),e.fillStyle=`rgba(255, 243, 229, 0.9)`,e.font=`600 12px "Space Grotesk", sans-serif`,e.fillText(t.name,s.x+c+8,s.y+c+16)}function ke(e,t,n,r,i,a,o){let s=Math.hypot(n.x,n.y);if(s<=.001)return;let c=E(t.position,r,i,a,o),l={x:n.x/s,y:n.y/s},u=24+s*12,d={x:c.x+l.x*u,y:c.y-l.y*u};e.save(),e.strokeStyle=`rgba(255, 153, 112, 0.95)`,e.fillStyle=`rgba(255, 153, 112, 0.95)`,e.lineWidth=2.5,e.beginPath(),e.moveTo(c.x,c.y),e.lineTo(d.x,d.y),e.stroke();let f=Math.atan2(d.y-c.y,d.x-c.x);e.translate(d.x,d.y),e.rotate(f),e.beginPath(),e.moveTo(0,0),e.lineTo(-10,5),e.lineTo(-10,-5),e.closePath(),e.fill(),e.restore()}function Ae(e,t,n,r,i,a){Ce(e,a.width,a.height,t),we(e,a.width,a.height);let o=Math.min(a.width,a.height)/760*i.zoom;if(a.showPrediction&&Ee(e,a.prediction,i,a.width,a.height,o),a.showTrails){for(let t of n){let n=t.id===`star`?`rgba(255, 213, 159, 0.22)`:`rgba(170, 238, 238, 0.24)`;Te(e,t.trail,n,i,a.width,a.height,o,t.id===`star`?1.3:1.8)}Te(e,r.trail,`rgba(255, 147, 117, 0.46)`,i,a.width,a.height,o,2)}for(let t of n)De(e,t,i,a.width,a.height,o,t.id===a.highlightId);Oe(e,r,i,a.width,a.height,o,a.highlightId===`probe`),ke(e,r,a.burnVector,i,a.width,a.height,o)}var je=document.querySelector(`#app`);if(!je)throw Error(`Missing app root`);function D(e){let t=document.querySelector(e);if(!t)throw Error(`Missing element: ${e}`);return t}je.innerHTML=`
  <div class="shell">
    <aside class="control-panel">
      <div class="panel-copy">
        <p class="eyebrow">Orbital Sandbox</p>
        <h1>2D Orbital Mechanics Simulator</h1>
        <p class="lede">Plan a burn, inspect the projected path, and push the probe through star, planet, and moon gravity wells.</p>
      </div>

      <div class="card">
        <label class="field">
          <span>Scenario</span>
          <select id="preset-select"></select>
        </label>
        <p id="preset-summary" class="muted"></p>
        <p id="preset-objective" class="objective"></p>
      </div>

      <div class="card">
        <div class="field">
          <div class="field-row">
            <span>Burn magnitude</span>
            <strong id="burn-magnitude-value">0.00</strong>
          </div>
          <input id="burn-magnitude" type="range" min="0" max="8" step="0.05" />
        </div>
        <div class="field">
          <div class="field-row">
            <span>Burn angle</span>
            <strong id="burn-angle-value">0°</strong>
          </div>
          <input id="burn-angle" type="range" min="-180" max="180" step="1" />
        </div>
        <div class="field">
          <div class="field-row">
            <span>Time warp</span>
            <strong id="time-scale-value">1x</strong>
          </div>
          <input id="time-scale" type="range" min="0" max="${s.length-1}" step="1" />
        </div>
        <div class="field">
          <div class="field-row">
            <span>Camera focus</span>
            <select id="focus-select">
              <option value="star">Star</option>
              <option value="planet">Planet</option>
              <option value="moon">Moon</option>
              <option value="probe">Probe</option>
            </select>
          </div>
        </div>
        <div class="field">
          <div class="field-row">
            <span>Zoom</span>
            <strong id="zoom-value">1.00x</strong>
          </div>
          <input id="zoom" type="range" min="0.65" max="2.25" step="0.01" />
        </div>
      </div>

      <div class="button-row">
        <button id="burn-btn" class="primary" type="button">Execute Burn</button>
        <button id="pause-btn" type="button">Run</button>
        <button id="step-btn" type="button">Step +5s</button>
        <button id="reset-btn" type="button">Reset</button>
      </div>

      <div class="toggles">
        <label><input id="prediction-toggle" type="checkbox" checked /> Show prediction</label>
        <label><input id="trails-toggle" type="checkbox" checked /> Show trails</label>
      </div>

      <div class="card stats-grid">
        <div>
          <span class="stat-label">Dominant body</span>
          <strong id="metric-body">Helios</strong>
        </div>
        <div>
          <span class="stat-label">Altitude</span>
          <strong id="metric-altitude">0</strong>
        </div>
        <div>
          <span class="stat-label">Probe speed</span>
          <strong id="metric-speed">0</strong>
        </div>
        <div>
          <span class="stat-label">Relative speed</span>
          <strong id="metric-relative-speed">0</strong>
        </div>
        <div>
          <span class="stat-label">Periapsis</span>
          <strong id="metric-periapsis">-</strong>
        </div>
        <div>
          <span class="stat-label">Apoapsis</span>
          <strong id="metric-apoapsis">-</strong>
        </div>
        <div>
          <span class="stat-label">Eccentricity</span>
          <strong id="metric-eccentricity">0</strong>
        </div>
        <div>
          <span class="stat-label">Orbit class</span>
          <strong id="metric-class">-</strong>
        </div>
      </div>

      <div class="card shortcuts">
        <p><strong>Keys</strong> Space pause or run, <span class="mono">B</span> burn, <span class="mono">R</span> reset, <span class="mono">F</span> fullscreen, wheel zoom.</p>
        <p id="status-line" class="muted"></p>
      </div>
    </aside>

    <section class="viewport-panel">
      <div class="viewport-header">
        <div>
          <p class="eyebrow">Live View</p>
          <h2 id="focus-label">Focused on Tethys</h2>
        </div>
        <div class="header-metrics">
          <div>
            <span class="stat-label">Sim time</span>
            <strong id="sim-time">0.0s</strong>
          </div>
          <div>
            <span class="stat-label">Burns</span>
            <strong id="burn-count">0</strong>
          </div>
        </div>
      </div>
      <div class="canvas-shell">
        <canvas id="sim-canvas" aria-label="2D orbital mechanics simulator"></canvas>
      </div>
    </section>
  </div>
`;var O=D(`#preset-select`),Me=D(`#preset-summary`),Ne=D(`#preset-objective`),k=D(`#burn-magnitude`),Pe=D(`#burn-magnitude-value`),A=D(`#burn-angle`),Fe=D(`#burn-angle-value`),j=D(`#time-scale`),Ie=D(`#time-scale-value`),M=D(`#focus-select`),N=D(`#zoom`),P=D(`#zoom-value`),Le=D(`#burn-btn`),Re=D(`#pause-btn`),ze=D(`#step-btn`),Be=D(`#reset-btn`),F=D(`#prediction-toggle`),Ve=D(`#trails-toggle`),He=D(`#metric-body`),Ue=D(`#metric-altitude`),We=D(`#metric-speed`),Ge=D(`#metric-relative-speed`),Ke=D(`#metric-periapsis`),qe=D(`#metric-apoapsis`),Je=D(`#metric-eccentricity`),Ye=D(`#metric-class`),Xe=D(`#status-line`),Ze=D(`#focus-label`),Qe=D(`#sim-time`),$e=D(`#burn-count`),I=D(`#sim-canvas`),et=I.getContext(`2d`);if(!et)throw Error(`Canvas 2D context unavailable`);var tt=et,nt=Se(),L=ue(),R=!1,z=_(L.presetId).recommendedTimeScaleIndex,B=_(L.presetId).recommendedFocus,V=_(L.presetId).recommendedZoom,H=0,U=0,W=!0,G=0,K=S(L,!0),q={center:C(L,B),zoom:V};function J(e){return e===null?`open`:`${T(e,1)} u`}function rt(e){return`${T(e,2)} u/s`}function it(){O.innerHTML=c.map(e=>`<option value="${e.id}">${e.name}</option>`).join(``)}function at(){let e=_(L.presetId);O.value=e.id,Me.textContent=e.summary,Ne.textContent=e.objective,k.value=`${L.burnPlan.magnitude}`,A.value=`${L.burnPlan.angleDeg}`,Pe.textContent=`${T(L.burnPlan.magnitude,2)} u/s`,Fe.textContent=`${T(L.burnPlan.angleDeg,0)}°`,z=e.recommendedTimeScaleIndex,j.value=`${z}`,Ie.textContent=`${s[z]}x`,B=e.recommendedFocus,M.value=B,V=e.recommendedZoom,N.value=`${V}`,P.textContent=`${T(V,2)}x`}function Y(){return s[z]}function ot(e){ye(L,e),k.value=`${L.burnPlan.magnitude}`,A.value=`${L.burnPlan.angleDeg}`,Pe.textContent=`${T(L.burnPlan.magnitude,2)} u/s`,Fe.textContent=`${T(L.burnPlan.angleDeg,0)}°`,W=!0}function X(e){L=ue(e),R=!1,at(),q.center=C(L,B),q.zoom=V,K=S(L,!0),W=!1,Z()}function st(){let e=I.getBoundingClientRect(),t=Math.max(1,Math.round(e.width)),n=Math.max(1,Math.round(e.height));if(t===H&&n===U)return;H=t,U=n;let r=window.devicePixelRatio||1;I.width=Math.round(t*r),I.height=Math.round(n*r),tt.setTransform(r,0,0,r,0,0)}function Z(){let e=ve(L),t=be(L);He.textContent=e.dominantBodyName,Ue.textContent=`${T(e.altitude,1)} u`,We.textContent=rt(e.speed),Ge.textContent=rt(e.relativeSpeed),Ke.textContent=J(e.periapsis),qe.textContent=J(e.apoapsis),Je.textContent=`${T(e.eccentricity,3)}`,Ye.textContent=e.orbitClass,Re.textContent=R?`Pause`:`Run`,Ze.textContent=`Focused on ${w(L,B)}`,Qe.textContent=`${T(L.time,1)}s`,$e.textContent=`${L.burnsExecuted}`,t?Xe.textContent=`Impact detected on ${t}. Reset the scenario to fly again.`:Xe.textContent=`Probe under ${e.dominantBodyName} influence. Planned burn is referenced to local prograde.`}function ct(){let e=ve(L);return JSON.stringify({coordinateSystem:`origin at star center, +x right, +y up`,mode:R?`running`:`paused`,preset:_(L.presetId).name,simTime:T(L.time,2),burnsExecuted:L.burnsExecuted,timeScale:Y(),focus:B,burnPlan:{magnitude:T(L.burnPlan.magnitude,2),angleDeg:T(L.burnPlan.angleDeg,0)},probe:{x:T(L.probe.position.x,2),y:T(L.probe.position.y,2),vx:T(L.probe.velocity.x,2),vy:T(L.probe.velocity.y,2),impactBodyId:L.probe.impactBodyId},telemetry:{dominantBody:e.dominantBodyName,altitude:T(e.altitude,2),speed:T(e.speed,2),relativeSpeed:T(e.relativeSpeed,2),periapsis:e.periapsis===null?null:T(e.periapsis,2),apoapsis:e.apoapsis===null?null:T(e.apoapsis,2),eccentricity:T(e.eccentricity,3),orbitClass:e.orbitClass},bodies:L.bodies.map(e=>({id:e.id,x:T(e.position.x,2),y:T(e.position.y,2),vx:T(e.velocity.x,2),vy:T(e.velocity.y,2)}))})}function Q(e=!1){G+=e?999:0,!(!W&&G<.25)&&(K=S(L,F.checked),W=!1,G=0)}function lt(e){y(L,e),W=!0,Q(!0),Z()}function ut(){if(document.fullscreenElement){document.exitFullscreen();return}I.parentElement?.requestFullscreen()}function $(){st();let e=C(L,B);q.center={x:q.center.x+(e.x-q.center.x)*.1,y:q.center.y+(e.y-q.center.y)*.1},q.zoom+=(V-q.zoom)*.12,Ae(tt,nt,L.bodies,L.probe,q,{width:H,height:U,showTrails:Ve.checked,showPrediction:F.checked,prediction:K,burnVector:F.checked?b(L):{x:0,y:0},highlightId:B})}it(),at(),Z(),Q(!0),O.addEventListener(`change`,()=>{X(O.value)}),k.addEventListener(`input`,()=>{ot({magnitude:Number(k.value),angleDeg:L.burnPlan.angleDeg}),Z()}),A.addEventListener(`input`,()=>{ot({magnitude:L.burnPlan.magnitude,angleDeg:Number(A.value)}),Z()}),j.addEventListener(`input`,()=>{z=Number(j.value),Ie.textContent=`${s[z]}x`}),M.addEventListener(`change`,()=>{B=M.value,Ze.textContent=`Focused on ${w(L,B)}`}),N.addEventListener(`input`,()=>{V=Number(N.value),P.textContent=`${T(V,2)}x`}),F.addEventListener(`change`,()=>{W=!0,Q(!0)}),Ve.addEventListener(`change`,()=>{$()}),Le.addEventListener(`click`,()=>{x(L),R=!0,W=!0,Q(!0),Z()}),Re.addEventListener(`click`,()=>{R=!R,Z()}),ze.addEventListener(`click`,()=>{R=!1,lt(5)}),Be.addEventListener(`click`,()=>{X(L.presetId)}),I.addEventListener(`wheel`,e=>{e.preventDefault();let t=e.deltaY>0?.92:1.08;V=Math.max(.65,Math.min(2.25,V*t)),N.value=`${V}`,P.textContent=`${T(V,2)}x`},{passive:!1}),document.addEventListener(`keydown`,e=>{e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement||(e.key===` `?(e.preventDefault(),R=!R,Z()):e.key.toLowerCase()===`b`?(x(L),R=!0,W=!0,Q(!0),Z()):e.key.toLowerCase()===`r`?X(L.presetId):e.key.toLowerCase()===`f`&&(e.preventDefault(),ut()))}),window.render_game_to_text=ct,window.advanceTime=e=>{y(L,e/1e3*Y()),W=!0,Q(!0),Z(),$()};var dt=performance.now();function ft(e){let t=Math.min(.05,(e-dt)/1e3);dt=e,R&&(y(L,t*Y()),G+=t,W||=G>=.25,L.probe.impactBodyId&&(R=!1)),Q(),Z(),$(),window.requestAnimationFrame(ft)}window.requestAnimationFrame(ft);