# Protocolo DISC-24

Avaliação comportamental DISC (modelo público de William Moulton Marston,
1928) para uso interno da equipe comercial. App single-page em HTML/JS puro,
servido por um servidor Node local sem dependências externas.

## Como rodar

Requer apenas Node.js (sem `npm install` — o servidor usa só módulos nativos).

```
node server.js
```

Abra `http://localhost:3000` no navegador. Cada pessoa preenche nome e cargo,
responde aos 24 blocos e o resultado é salvo automaticamente.

## Onde ficam os dados

Os resultados são gravados em `data/resultados.json` (criado automaticamente
na primeira execução). Esse arquivo é local — nada é enviado para fora do
computador onde o servidor está rodando. O arquivo é ignorado pelo git
(`.gitignore`) porque contém dados pessoais dos avaliados.

## Ver resultados do piloto

Na tela inicial (ou ao final de um teste), clique em **"Ver resultados
salvos"** para listar todas as avaliações já registradas: nome, cargo,
perfil predominante, pontuação D/I/S/C e data.

## Escopo atual (piloto)

Implementado: formulário de identificação, aplicação do teste, cálculo de
pontuação líquida, gravação local e listagem de resultados salvos.

Deliberadamente fora de escopo por enquanto (fase 2, após validar o piloto):
autenticação, dashboard de administração, exportação em PDF dedicada e tela
de consentimento LGPD.
