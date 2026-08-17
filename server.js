// Servidor local mínimo (sem dependências externas) para o Protocolo DISC-24.
// Serve o app e persiste resultados em data/resultados.json.
// Uso: node server.js  ->  http://localhost:3000

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const HTML_FILE = path.join(ROOT_DIR, 'protocolo-disc24.html');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DATA_FILE = path.join(DATA_DIR, 'resultados.json');

const AUTH_USER = 'disc';
const AUTH_PASSWORD = process.env.DISC_APP_PASSWORD;

if(!AUTH_PASSWORD){
  console.error('ERRO: defina a variável de ambiente DISC_APP_PASSWORD antes de iniciar o servidor.');
  console.error('Ex.: DISC_APP_PASSWORD="sua-senha" node server.js');
  process.exit(1);
}

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

const PERFIS_TESTE_VALIDOS = ['televendas', 'lideranca'];

function timingSafeEqualStr(a, b){
  const bufA = Buffer.from(String(a), 'utf8');
  const bufB = Buffer.from(String(b), 'utf8');
  if(bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function isAuthorized(req){
  const header = req.headers['authorization'] || '';
  if(!header.startsWith('Basic ')) return false;
  let decoded;
  try{
    decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  }catch(e){
    return false;
  }
  const sep = decoded.indexOf(':');
  if(sep === -1) return false;
  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);
  return timingSafeEqualStr(user, AUTH_USER) && timingSafeEqualStr(pass, AUTH_PASSWORD);
}

function requireAuth(res){
  res.writeHead(401, {
    'Content-Type': 'text/plain; charset=utf-8',
    'WWW-Authenticate': 'Basic realm="Protocolo DISC-24"'
  });
  res.end('Autenticação necessária.');
}

const server = http.createServer(async (req, res) => {
  if(!isAuthorized(req)){
    requireAuth(res);
    return;
  }

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
      const perfilTeste = PERFIS_TESTE_VALIDOS.includes(body.perfilTeste) ? body.perfilTeste : null;
      const scores = body.scores || {};
      const scoresValid = ['D','I','S','C'].every(k => isFiniteNumber(scores[k]));
      if(!nome || !cargo || !perfilTeste || !scoresValid){
        sendJSON(res, 400, {erro: 'Dados inválidos. Envie nome, cargo, perfilTeste (televendas|lideranca) e scores D/I/S/C numéricos.'});
        return;
      }
      const registro = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        nome, cargo, perfilTeste,
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
  console.log(`Acesso protegido por senha — usuário: ${AUTH_USER}`);
  console.log(`Resultados salvos em ${DATA_FILE}`);
});
