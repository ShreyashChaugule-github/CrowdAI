const API_BASE = 'http://localhost:3000/api';

const fills = {
  critical: 'rgba(224,75,48,0.82)',
  high: 'rgba(186,117,23,0.70)',
  medium: 'rgba(29,158,117,0.55)',
  low: 'rgba(29,158,117,0.18)',
};

let zones = {};
let waitData = [];
let alertData = [];
let routes = [];
let sparkData = { hours: [], values: [] };
let stats = {};

async function fetchData() {
  try {
    const [zonesRes, waitRes, alertsRes, routesRes, sparkRes, statsRes] = await Promise.all([
      fetch(`${API_BASE}/zones`),
      fetch(`${API_BASE}/wait-times`),
      fetch(`${API_BASE}/alerts`),
      fetch(`${API_BASE}/routes`),
      fetch(`${API_BASE}/sparkline`),
      fetch(`${API_BASE}/stats`)
    ]);

    zones = await zonesRes.json();
    waitData = await waitRes.json();
    alertData = await alertsRes.json();
    routes = await routesRes.json();
    sparkData = await sparkRes.json();
    stats = await statsRes.json();

    renderAll();
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

function renderAll() {
  renderHeatmap();
  renderWait();
  renderAlerts();
  renderRoutes();
  renderSpark();
  updateStats();
}

function renderWait() {
  const c = document.getElementById('waitRows');
  c.innerHTML = waitData.map(w => {
    let color = '#1D9E75';
    if (w.time > 15) color = '#E24B4A';
    else if (w.time > 8) color = '#EF9F27';
    return `
      <div class="wait-row">
        <span class="wait-name">${w.name}</span>
        <div class="wait-bar-wrap"><div class="wait-bar" style="width:${Math.round(w.time/w.max*100)}%;background:${color}"></div></div>
        <span class="wait-time" style="color:${color}">${w.time}m</span>
      </div>`;
  }).join('');
}

function renderAlerts() {
  const c = document.getElementById('alertRows');
  c.innerHTML = alertData.map(a => {
    const bg = a.level === 'critical' ? 'var(--alert-red-bg)' : a.level === 'warn' ? 'var(--alert-amber-bg)' : 'var(--alert-green-bg)';
    const col = a.level === 'critical' ? 'var(--alert-red)' : a.level === 'warn' ? 'var(--alert-amber)' : 'var(--alert-green)';
    return `
      <div class="alert-item">
        <div class="alert-icon" style="background:${bg};color:${col}">${a.level === 'critical' ? '!' : a.level === 'warn' ? '~' : 'i'}</div>
        <span class="alert-text">${a.msg}</span>
        <span class="alert-time">${a.time}</span>
      </div>`;
  }).join('');
}

function renderRoutes() {
  const c = document.getElementById('navRoutes');
  c.innerHTML = routes.map(r => {
    const statusColor = r.status === 'clear' ? '#1D9E75' : r.status === 'moderate' ? '#BA7517' : '#A32D2D';
    const statusBg = r.status === 'clear' ? '#E1F5EE' : r.status === 'moderate' ? '#FAEEDA' : '#FCEBEB';
    return `
      <div class="route-row" onclick="sendPrompt('How do I get from ${r.from} to Section D quickly right now?')">
        <span class="route-badge" style="background:${statusBg};color:${statusColor}">${r.status}</span>
        <span class="route-desc">${r.label}</span>
        <span class="route-eta">${r.eta} ↗</span>
      </div>`;
  }).join('');
}

function renderSpark() {
  const row = document.getElementById('sparkRow');
  const labs = document.getElementById('sparkLabels');
  const current = 3;
  row.innerHTML = sparkData.values.map((v, i) => `<div class="spark-bar${i === current ? ' active' : ''}" style="height:${v}%"></div>`).join('');
  labs.innerHTML = sparkData.hours.map((h, i) => `<span class="spark-label${i === current ? ' active' : ''}">${h}:00</span>`).join('');
}

function renderHeatmap() {
  Object.entries(zones).forEach(([k, z]) => {
    const el = document.getElementById(`z-${k}`);
    if (el) el.setAttribute('fill', fills[z.level]);
  });
}

function updateStats() {
  document.getElementById('s1').textContent = stats.occupancy;
  document.getElementById('s2').innerHTML = stats.avgWait;
  document.getElementById('s3').textContent = stats.activeAlerts;
  document.getElementById('s4').textContent = stats.crowdScore;
}

async function sendPrompt(prompt) {
  const responseDiv = document.getElementById('chatResponse');
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const data = await res.json();
    responseDiv.textContent = data.response;
    responseDiv.style.display = 'block';
    document.getElementById('chatInput').value = '';
  } catch (error) {
    console.error('Error sending chat:', error);
    responseDiv.textContent = 'Sorry, I couldn\'t process your request.';
    responseDiv.style.display = 'block';
  }
}

function askAI() {
  const v = document.getElementById('chatInput').value.trim();
  if (v) sendPrompt(v);
}

document.getElementById('chatInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') askAI();
});

let tsCounter = 0;

function updateTs() {
  document.getElementById('heatTs').textContent = `Updated ${tsCounter}s ago`;
  tsCounter++;
}

// Fetch data on load and periodically
fetchData();
setInterval(fetchData, 2800);
setInterval(updateTs, 1000);