// Servidor local mínimo (sem dependências externas) para o Protocolo DISC-24.
// Serve o app e persiste resultados em data/resultados.json.
// Uso: node server.js  ->  http://localhost:3000

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const HTML_FILE = path.join(ROOT_DIR, 'protocolo-disc24.html');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DATA_FILE = path.join(DATA_DIR, 'resultados.json');

function ensureDataFile(){
  if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, {recursive:true});
  if(!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

function readResultados(){
  ensureDataFile();
  try{
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const list = JSON.parse(raw || '[]');
    return Array.isArray(list) ? list : [];
  }catch(e){
    return [];
  }
}

function writeResultados(list){
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function sendJSON(res, status, obj){
  const body = JSON.stringify(obj);
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8'});
  res.end(body);
}

function readBody(req){
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', c => {
      size += c.length;
      if(size > 1e6){ reject(new Error('Corpo muito grande')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try{
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      }catch(e){ reject(e); }
    });
    req.on('error', reject);
  });
}

function isNonEmptyString(v){
  return typeof v === 'string' && v.trim().length > 0;
}
function isFiniteNumber(v){
  return typeof v === 'number' && Number.isFinite(v);
}

const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];

  if(req.method === 'GET' && urlPath === '/api/resultados'){
    const list = readResultados();
    list.sort((a, b) => new Date(b.data) - new Date(a.data));
    sendJSON(res, 200, list);
    return;
  }

  if(req.method === 'POST' && urlPath === '/api/resultados'){
    try{
      const body = await readBody(req);
      const nome = isNonEmptyString(body.nome) ? body.nome.trim().slice(0, 120) : null;
      const cargo = isNonEmptyString(body.cargo) ? body.cargo.trim().slice(0, 120) : null;
      const scores = body.scores || {};
      const scoresValid = ['D','I','S','C'].every(k => isFiniteNumber(scores[k]));
      if(!nome || !cargo || !scoresValid){
        sendJSON(res, 400, {erro: 'Dados inválidos. Envie nome, cargo e scores D/I/S/C numéricos.'});
        return;
      }
      const registro = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        nome, cargo,
        scores: {D: scores.D, I: scores.I, S: scores.S, C: scores.C},
        perfilPrimario: isNonEmptyString(body.perfilPrimario) ? body.perfilPrimario : null,
        perfilSecundario: isNonEmptyString(body.perfilSecundario) ? body.perfilSecundario : null,
        data: new Date().toISOString()
      };
      const list = readResultados();
      list.push(registro);
      writeResultados(list);
      sendJSON(res, 201, registro);
    }catch(e){
      sendJSON(res, 400, {erro: 'JSON inválido.'});
    }
    return;
  }

  if(req.method === 'GET' && (urlPath === '/' || urlPath === '/protocolo-disc24.html')){
    fs.readFile(HTML_FILE, (err, data) => {
      if(err){ res.writeHead(500); res.end('Erro ao carregar o app.'); return; }
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
      res.end(data);
    });
    return;
  }

  res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
  res.end('Não encontrado');
});

server.listen(PORT, () => {
  ensureDataFile();
  console.log(`Protocolo DISC-24 rodando em http://localhost:${PORT}`);
  console.log(`Resultados salvos em ${DATA_FILE}`);
});
