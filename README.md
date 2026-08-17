# Protocolo DISC-24

Avaliação comportamental DISC (modelo público de William Moulton Marston,
1928) para uso interno da equipe comercial. App single-page em HTML/JS puro,
servido por um servidor Node local sem dependências externas.

## Como rodar

Requer apenas Node.js (sem `npm install` — o servidor usa só módulos nativos).

O acesso é protegido por duas senhas separadas (HTTP Basic Auth), pra quem
responde o teste não conseguir ver o resultado de todo mundo:

- `DISC_APP_PASSWORD` (usuário fixo `disc`) — dá acesso ao teste em si:
  telas de identificação, quiz e resultado individual, e ao envio do
  resultado (`POST /api/resultados`).
- `DISC_ADMIN_PASSWORD` (usuário fixo `admin`) — dá acesso só à tela
  "Resultados salvos" (`/resultados`) e à listagem de todos os testes
  (`GET /api/resultados`). Quem só tem `DISC_APP_PASSWORD` não enxerga essa
  tela nem essa rota.

Defina as duas variáveis antes de iniciar — o servidor recusa subir se
alguma faltar:

```
DISC_APP_PASSWORD="senha-do-teste" DISC_ADMIN_PASSWORD="senha-do-admin" node server.js
```

Abra `http://localhost:3000` no navegador — o navegador vai pedir usuário
(`disc`) e a senha do teste. Depois de autenticado, cada pessoa preenche
nome, cargo e perfil do teste, responde aos 24 blocos e o resultado é salvo
automaticamente. Use senhas diferentes uma da outra — se forem iguais, quem
faz o teste também consegue abrir `/resultados`.

## Onde ficam os dados

Os resultados são gravados em `data/resultados.json` (criado automaticamente
na primeira execução). O arquivo é ignorado pelo git (`.gitignore`) porque
contém dados pessoais dos avaliados. Rodando localmente, esse arquivo fica só
na máquina onde o servidor está ativo; se o app estiver publicado (ex.:
Render), os dados ficam no servidor da aplicação, acessível apenas a quem
tem a senha.

## Deploy no Render

O servidor já lê a porta de `process.env.PORT` (padrão do Render) e não
precisa de build step — o comando de start é `node server.js`.

Para configurar as senhas de acesso no Render:

1. Abra o serviço no [dashboard do Render](https://dashboard.render.com).
2. Vá em **Environment** (menu lateral do serviço).
3. Em **Environment Variables**, clique em **Add Environment Variable**.
4. Adicione `DISC_APP_PASSWORD` com a senha do teste.
5. Adicione também `DISC_ADMIN_PASSWORD` com a senha de admin (diferente da
   anterior).
6. Clique em **Save Changes** — o Render reinicia o serviço automaticamente
   com as novas variáveis.

Sem as duas variáveis definidas, o servidor não sobe (falha proposital, pra
evitar publicar o app sem proteção).

## Ver resultados do piloto

Não há mais link na interface pra isso — de propósito, pra quem está
respondendo o teste não ver esse caminho. Acesse diretamente
`http://localhost:3000/resultados` (ou `<seu-domínio-no-render>/resultados`)
e autentique com o usuário `admin` e a senha `DISC_ADMIN_PASSWORD`. A tela
lista todas as avaliações já registradas: nome, cargo, perfil do teste,
perfil DISC predominante, pontuação D/I/S/C e data.

## Escopo atual (piloto)

Implementado: formulário de identificação, seleção de perfil do teste
(televendas/liderança), aplicação do teste, cálculo de pontuação líquida,
gravação dos resultados, listagem em "Resultados salvos" e duas travas de
acesso separadas por senha (HTTP Basic Auth): uma pra fazer o teste, outra
só pra ver os resultados de todo mundo.

Deliberadamente fora de escopo por enquanto (fase 2, após validar o piloto):
login individual por usuário, dashboard de administração, exportação em PDF
dedicada e tela de consentimento LGPD.
