

// Pedidos por mês (jan/17 até ago/18)
const meses   = ['Jan/17','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez','Jan/18','Fev','Mar','Abr','Mai','Jun','Jul','Ago'];
const pedidos = [800, 1120, 2100, 2800, 3200, 3300, 3700, 4400, 4900, 5700, 7100, 5900, 7300, 6800, 8600, 9200, 9400, 9800, 10000, 7800];

// Pedidos por estado (top 8)
const estados   = ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'DF'];
const qtdEstado = [41746, 12852, 11635, 5466, 5045, 3637, 3380, 2140];

// Formas de pagamento
const formasPag = ['Cartão de Crédito', 'Boleto', 'Voucher', 'Cartão de Débito'];
const qtdPag    = [76795, 19784, 5775, 1529];


/* =============================================
   CHART.JS — 3 GRÁFICOS
   ============================================= */

// 1. LINHA — Pedidos por mês
new Chart(document.getElementById('graficoLinha'), {
  type: 'line',
  data: {
    labels: meses,
    datasets: [{
      label: 'Pedidos',
      data: pedidos,
      borderColor: '#e94560',
      backgroundColor: 'rgba(233,69,96,0.1)',
      borderWidth: 2.5,
      pointBackgroundColor: '#e94560',
      pointRadius: 4,
      tension: 0.4,
      fill: true
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: v => v.toLocaleString('pt-BR') }
      }
    }
  }
});

// 2. BARRA — Pedidos por estado
new Chart(document.getElementById('graficoBarra'), {
  type: 'bar',
  data: {
    labels: estados,
    datasets: [{
      label: 'Pedidos',
      data: qtdEstado,
      backgroundColor: [
        '#e94560','#0f3460','#f5a623','#1a1a2e',
        '#e94560aa','#0f3460aa','#f5a623aa','#1a1a2eaa'
      ],
      borderRadius: 6
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { ticks: { callback: v => (v / 1000).toFixed(0) + 'k' } }
    }
  }
});

// 3. PIZZA — Formas de pagamento
new Chart(document.getElementById('graficoPizza'), {
  type: 'pie',
  data: {
    labels: formasPag,
    datasets: [{
      data: qtdPag,
      backgroundColor: ['#e94560', '#0f3460', '#f5a623', '#16213e'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 10 } }
    }
  }
});


/*
   API PÚBLICA — Open-Meteo (clima SP)
  */
async function buscarClima() {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=-23.55&longitude=-46.63&current=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=America/Sao_Paulo&forecast_days=1';
    
    const res = await fetch(url);
    const data = await res.json();

    const temp = Math.round(data.current.temperature_2m);
    const umid = data.current.relative_humidity_2m;
    const vento = data.current.wind_speed_10m;
    const max = Math.round(data.daily.temperature_2m_max[0]);
    const min = Math.round(data.daily.temperature_2m_min[0]);

    const climaBox = document.getElementById('climaBox');

    climaBox.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <div class="clima-temp" id="temp-val"></div>
          <div class="clima-cidade">São Paulo, SP — hoje</div>
          <div class="clima-info">
            <span id="max-min-val"></span>
            <span id="umid-val"></span>
            <span id="vento-val"></span>
          </div>
        </div>
        <div style="font-size:11px;opacity:.5;text-align:right;">
          Fonte: Open-Meteo API<br/>Gratuita
        </div>
      </div>
    `;

    document.getElementById('temp-val').innerText = `${temp}°C ☁️`;
    document.getElementById('max-min-val').innerText = `🌡️ Máx ${max}° / Mín ${min}°`;
    document.getElementById('umid-val').innerText = `💧 Umidade ${umid}%`;
    document.getElementById('vento-val').innerText = `💨 Vento ${vento} km/h`;

  } catch (e) {
    const climaBox = document.getElementById('climaBox');
    
    climaBox.innerHTML = `<div style="opacity:.6;font-size:13px;" id="erro-val"></div>`;
    document.getElementById('erro-val').innerText = '⚠️ Não consegui buscar o clima agora.';
  }
}
buscarClima();


/* 
   BACK4APP (Parse REST API) — CRUD DE NOTAS

*/
const APP_ID   = '9SWFMhAcOdrXDi7MHpisuBEKLQELue6nqVHLsbdH';
const REST_KEY = 'ByjymZJzw7pTPBXrTz4jkluXSp6wj8NGjQDdkwKn';
const URL_B4A  = 'https://parseapi.back4app.com/classes/NotasDashboard';

// Detecta se o Back4App foi configurado
const b4aAtivo = APP_ID !== '';

// Fallback: salva no localStorage do navegador 
function notasLocal() {
  return JSON.parse(localStorage.getItem('notas_dashboard') || '[]');
}
function salvarLocal(notas) {
  localStorage.setItem('notas_dashboard', JSON.stringify(notas));
}

// READ — carrega as notas
async function carregarNotas() {
  if (b4aAtivo) {
    try {
      const res  = await fetch(URL_B4A + '?order=-createdAt', {
        headers: {
          'X-Parse-Application-Id': APP_ID,
          'X-Parse-REST-API-Key':   REST_KEY
        }
      });
      const data = await res.json();
      renderNotas(data.results || []);
      return;
    } catch (e) { /* cai no fallback */ }
  }
  renderNotas(notasLocal());
}

// CREATE / UPDATE — salva ou edita uma nota
async function salvarNota() {
  const titulo = document.getElementById('notaTitulo').value.trim();
  const texto  = document.getElementById('notaTexto').value.trim();
  const tipo   = document.getElementById('notaTipo').value;
  const editId = document.getElementById('editId').value;

  if (!titulo) { mostrarToast('⚠️ Escreve um título!'); return; }

  const corpo = { titulo, texto, tipo, criadoEm: new Date().toISOString() };

  if (b4aAtivo) {
    try {
      const method  = editId ? 'PUT' : 'POST';
      const urlFull = editId ? URL_B4A + '/' + editId : URL_B4A;
      await fetch(urlFull, {
        method,
        headers: {
          'X-Parse-Application-Id': APP_ID,
          'X-Parse-REST-API-Key':   REST_KEY,
          'Content-Type':           'application/json'
        },
        body: JSON.stringify(corpo)
      });
      limparForm();
      carregarNotas();
      mostrarToast(editId ? '✅ Nota atualizada!' : '✅ Nota salva no Back4App!');
      return;
    } catch (e) { /* cai no fallback */ }
  }

  // fallback localStorage
  let notas = notasLocal();
  if (editId) {
    notas = notas.map(n => n.objectId === editId ? { ...n, ...corpo } : n);
  } else {
    notas.unshift({ ...corpo, objectId: 'local_' + Date.now() });
  }
  salvarLocal(notas);
  limparForm();
  carregarNotas();
  mostrarToast('💾 Salvo no localStorage (Back4App não configurado)');
}

// DELETE — apaga uma nota
async function deletarNota(id) {
  if (!confirm('Apagar esta nota?')) return;

  if (b4aAtivo && !id.startsWith('local_')) {
    try {
      await fetch(URL_B4A + '/' + id, {
        method: 'DELETE',
        headers: {
          'X-Parse-Application-Id': APP_ID,
          'X-Parse-REST-API-Key':   REST_KEY
        }
      });
      carregarNotas();
      mostrarToast('🗑️ Nota deletada!');
      return;
    } catch (e) { /* cai no fallback */ }
  }

  let notas = notasLocal().filter(n => n.objectId !== id);
  salvarLocal(notas);
  carregarNotas();
  mostrarToast('🗑️ Nota removida!');
}

// UPDATE — preenche o formulário para editar
function editarNota(nota) {
  document.getElementById('notaTitulo').value = nota.titulo;
  document.getElementById('notaTexto').value  = nota.texto;
  document.getElementById('notaTipo').value   = nota.tipo;
  document.getElementById('editId').value     = nota.objectId;
  window.scrollTo({
    top: document.querySelector('.notas-section').offsetTop - 20,
    behavior: 'smooth'
  });
}

function limparForm() {
  document.getElementById('notaTitulo').value = '';
  document.getElementById('notaTexto').value  = '';
  document.getElementById('editId').value     = '';
}

// Renderiza os cards de notas na tela
function renderNotas(lista) {
  const el = document.getElementById('notasLista');
  if (!lista.length) {
    el.innerHTML = '<div style="color:#aaa;font-size:13px;padding:8px;">Nenhuma nota ainda. Cria a primeira aí! 👆</div>';
    return;
  }
  const cores = { observação: '#0f3460', análise: '#e94560', melhoria: '#2e7d32', bug: '#bf360c' };
  el.innerHTML = lista.map(n => `
    <div class="nota-card" style="border-left-color:${cores[n.tipo] || '#e94560'}">
      <button class="btn-del" onclick="deletarNota('${n.objectId}')">✕</button>
      <h4>${n.titulo}</h4>
      <p>${n.texto || '<em style="color:#ccc">sem descrição</em>'}</p>
      <div class="nota-meta">
        <span style="background:${cores[n.tipo] || '#e94560'}22;color:${cores[n.tipo] || '#e94560'};padding:1px 7px;border-radius:4px;font-size:10px;font-weight:600;">${n.tipo}</span>
        &nbsp;·&nbsp; ${new Date(n.criadoEm || Date.now()).toLocaleDateString('pt-BR')}
        &nbsp;·&nbsp; <span onclick='editarNota(${JSON.stringify(n)})' style="cursor:pointer;color:#0f3460;">✏️ editar</span>
      </div>
    </div>`).join('');
}

// Toast de feedback
function mostrarToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// Inicia carregando as notas
carregarNotas();
