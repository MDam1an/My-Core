/* ================================================================
   utils.js — Shared utilities
   ================================================================ */

/* ── Toast ── */
let _toastTimer;
function showToast(msg, icon = '✅') {
  const t = document.getElementById('toast');
  if (!t) return;
  document.getElementById('toast-msg').textContent = msg;
  document.getElementById('toast-icon').textContent = icon;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ── Modal ── */
function openModal(html) {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');
  if (!overlay || !box) return;
  box.innerHTML = html;
  overlay.classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay')?.classList.remove('open');
}

function initModalOverlay() {
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });
}

/* ── Currency ── */
function fmtCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

/* ── Date ── */
function today() { return new Date().toISOString().split('T')[0]; }

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR');
}

function daysLeft(deadline) {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline) - new Date()) / 86400000);
}

/* ── Topbar date ── */
function updateTopbarDate() {
  const el = document.getElementById('topbar-date');
  if (!el) return;
  el.textContent = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

/* ── Topbar greeting ── */
function updateTopbarUser(user) {
  const el = document.getElementById('topbar-username');
  if (el) el.textContent = user.name.split(' ')[0];
}

/* ── Life Score ── */
function calcLifeScore(data) {
  const d = data;

  // Financial health (0-25 pts): positive balance ratio
  const rec = d.transactions.filter(t => t.type === 'receita').reduce((s, t) => s + t.val, 0);
  const dep = d.transactions.filter(t => t.type === 'despesa').reduce((s, t) => s + t.val, 0);
  let finScore = 15; // base if no data
  if (rec > 0) {
    const ratio = Math.max(0, Math.min(1, (rec - dep) / rec));
    finScore = Math.round(ratio * 25);
  }

  // Goals (0-25 pts): average goal progress
  let goalScore = 12;
  if (d.goals.length > 0) {
    const avg = d.goals.reduce((s, g) => s + g.progress, 0) / d.goals.length;
    goalScore = Math.round((avg / 100) * 25);
  }

  // Habits (0-25 pts): % habits done today
  let habitScore = 10;
  if (d.habits.length > 0) {
    const td = today();
    const done = d.habits.filter(h => h.checkedDates?.includes(td)).length;
    habitScore = Math.round((done / d.habits.length) * 25);
    // Streak bonus (up to 5 pts)
    const maxStreak = Math.max(...d.habits.map(h => h.streak || 0), 0);
    habitScore = Math.min(25, habitScore + Math.min(5, Math.floor(maxStreak / 5)));
  }

  // Development (0-25 pts): skills avg + diary entries
  let devScore = 8;
  if (d.skills.length > 0) {
    const avgSkill = d.skills.reduce((s, sk) => s + sk.level, 0) / d.skills.length;
    devScore = Math.round((avgSkill / 100) * 20);
  }
  devScore += Math.min(5, d.diary.length);

  const total = Math.min(99, Math.max(20, finScore + goalScore + habitScore + devScore));
  return { total, finScore, goalScore, habitScore, devScore };
}

/* ── Sidebar toggle ── */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('main');
  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  const toggleIcon = document.getElementById('sidebar-toggle-icon');
  const hamburger = document.getElementById('hamburger-btn');
  const backdrop = document.getElementById('sidebar-backdrop');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      main.classList.toggle('expanded');
      if (toggleIcon) toggleIcon.style.transform = sidebar.classList.contains('collapsed') ? 'rotate(180deg)' : '';
    });
  }

  if (hamburger) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.add('mobile-open');
      backdrop?.classList.add('show');
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      backdrop.classList.remove('show');
    });
  }
}

function closeMobileSidebar() {
  document.getElementById('sidebar')?.classList.remove('mobile-open');
  document.getElementById('sidebar-backdrop')?.classList.remove('show');
}

/* ── Smooth scroll ── */
function initSmoothScroll(containerId = 'main-content') {
  const el = document.getElementById(containerId);
  if (!el) return;

  let target = el.scrollTop;
  let current = el.scrollTop;
  let rafId = null;

  el.addEventListener('wheel', e => {
    e.preventDefault();
    target += e.deltaY * 0.85;
    target = Math.max(0, Math.min(target, el.scrollHeight - el.clientHeight));
    if (!rafId) animate();
  }, { passive: false });

  function animate() {
    const diff = target - current;
    if (Math.abs(diff) < 0.5) {
      el.scrollTop = target;
      current = target;
      rafId = null;
      return;
    }
    current += diff * 0.1;
    el.scrollTop = current;
    rafId = requestAnimationFrame(animate);
  }
}

/* ── Chart defaults ── */
function setChartDefaults() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.color = 'rgba(144,144,176,0.8)';
  Chart.defaults.font.family = 'DM Sans';
}

function destroyChart(inst) {
  try { inst?.destroy(); } catch(e) {}
}

/* ── Chip selector ── */
function selectChip(el, groupId) {
  document.querySelectorAll(`#${groupId} .chip`).forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
}

/* ── Sync range + number input ── */
function syncRange(rangeId, numberId) {
  const r = document.getElementById(rangeId);
  const n = document.getElementById(numberId);
  if (!r || !n) return;
  r.addEventListener('input', () => { n.value = r.value; });
  n.addEventListener('input', () => {
    const v = Math.max(+n.min || 0, Math.min(+n.max || 100, +n.value || 0));
    r.value = v;
    n.value = v;
  });
}

/* ── Nav highlight ── */
function setActiveNav(pageId) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === pageId);
  });
}

/* ── Report helpers ── */
function buildReportContent(type, data) {
  const now = new Date().toLocaleDateString('pt-BR', { day:'numeric', month:'long', year:'numeric' });
  const rec = data.transactions.filter(t => t.type === 'receita').reduce((s, t) => s + t.val, 0);
  const dep = data.transactions.filter(t => t.type === 'despesa').reduce((s, t) => s + t.val, 0);
  const inv = data.transactions.filter(t => t.type === 'investimento').reduce((s, t) => s + t.val, 0);
  const saldo = rec - dep;
  const avgGoal = data.goals.length
    ? Math.round(data.goals.reduce((s, g) => s + g.progress, 0) / data.goals.length)
    : 0;
  const score = calcLifeScore(data).total;

  const reports = {
    financeiro: {
      title: `RELATÓRIO FINANCEIRO — MyCore`,
      rows: [
        ['Data', now],
        ['Usuário', data.config.name],
        [''],
        ['=== RESUMO ==='],
        ['Receitas totais', fmtCurrency(rec)],
        ['Despesas totais', fmtCurrency(dep)],
        ['Investimentos', fmtCurrency(inv)],
        ['Saldo líquido', fmtCurrency(saldo)],
        [''],
        [`=== TRANSAÇÕES (${data.transactions.length}) ===`],
        ...data.transactions.map(t => [t.date, t.type.toUpperCase(), t.desc, t.cat, fmtCurrency(t.val)])
      ]
    },
    metas: {
      title: `RELATÓRIO DE METAS — MyCore`,
      rows: [
        ['Data', now],
        ['Usuário', data.config.name],
        [''],
        ['=== METAS ==='],
        ['Total de metas', data.goals.length],
        ['Progresso médio', avgGoal + '%'],
        ['Concluídas', data.goals.filter(g => g.progress >= 100).length],
        [''],
        ...data.goals.map(g => [
          g.emoji + ' ' + g.name,
          g.progress + '%',
          'Alvo: ' + (g.target > 0 ? fmtCurrency(g.target) : 'N/A'),
          'Guardado: ' + fmtCurrency(g.saved || 0),
          'Prazo: ' + (g.deadline || 'Sem prazo')
        ])
      ]
    },
    desenvolvimento: {
      title: `RELATÓRIO DE DESENVOLVIMENTO — MyCore`,
      rows: [
        ['Data', now],
        ['Usuário', data.config.name],
        [''],
        [`=== HÁBITOS (${data.habits.length}) ===`],
        ...data.habits.map(h => [h.emoji + ' ' + h.name, 'Streak: ' + h.streak + ' dias', h.cat]),
        [''],
        [`=== HABILIDADES (${data.skills.length}) ===`],
        ...data.skills.map(s => [s.emoji + ' ' + s.name, 'Nível: ' + s.level + '/100']),
        [''],
        [`=== DIÁRIO (${data.diary.length} registros) ===`],
        ...data.diary.slice(0, 10).map(e => [e.date, e.text.substring(0, 120)])
      ]
    },
    completo: {
      title: `RELATÓRIO COMPLETO — MyCore`,
      rows: [
        ['Data', now],
        ['Usuário', data.config.name],
        ['Life Score', score + '/99'],
        [''],
        ['=== FINANÇAS ==='],
        ['Receitas', fmtCurrency(rec)],
        ['Despesas', fmtCurrency(dep)],
        ['Saldo', fmtCurrency(saldo)],
        [''],
        ['=== METAS ==='],
        ['Total', data.goals.length],
        ['Progresso médio', avgGoal + '%'],
        ...data.goals.map(g => [g.emoji + ' ' + g.name, g.progress + '%']),
        [''],
        ['=== HÁBITOS ==='],
        ...data.habits.map(h => [h.emoji + ' ' + h.name, h.streak + ' dias']),
        [''],
        ['=== CONQUISTAS ==='],
        ['Desbloqueadas', (data.achievements || []).length]
      ]
    }
  };

  return reports[type] || reports.completo;
}

function exportPDF(report) {
  const rows = report.rows.map(r => {
    if (!r || r.length === 0) return '<tr><td colspan="5" style="padding:8px 0"></td></tr>';
    if (r.length === 1) return `<tr><td colspan="5" style="padding:6px 0;font-weight:700;color:#6C63FF">${r[0]}</td></tr>`;
    return `<tr>${r.map((c, i) => `<td style="padding:5px 10px 5px ${i===0?'0':'10px'};border-bottom:1px solid #222;font-size:13px">${c}</td>`).join('')}</tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>${report.title}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:40px;color:#E8E8F0;background:#080810;max-width:860px;margin:0 auto}
    h1{color:#6C63FF;border-bottom:2px solid #6C63FF;padding-bottom:12px;font-size:22px}
    table{width:100%;border-collapse:collapse}
    .footer{margin-top:40px;color:#5a5a7a;font-size:12px;border-top:1px solid #1a1a2e;padding-top:10px}
    @media print{body{background:white;color:#333}h1{color:#6C63FF}}
  </style></head>
  <body>
    <h1>${report.title}</h1>
    <table>${rows}</table>
    <div class="footer">Gerado pelo MyCore — ${new Date().toLocaleString('pt-BR')}</div>
    <script>setTimeout(()=>window.print(),600)<\/script>
  </body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

function exportCSV(report) {
  const csv = report.rows.map(r => {
    if (!r || !r.length) return '';
    return r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',');
  }).join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const fname = report.title.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + today() + '.csv';
  a.href = url; a.download = fname; a.click();
  URL.revokeObjectURL(url);
}
