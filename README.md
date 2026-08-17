# Protocolo DISC-24

Avaliação comportamental DISC (modelo público de William Moulton Marston,
1928) para uso interno da equipe comercial. App single-page em HTML/JS puro,
servido por um servidor Node local sem dependências externas.

## Como rodar

Requer apenas Node.js (sem `npm install` — o servidor usa só módulos nativos).

O acesso ao app inteiro é protegido por senha única (HTTP Basic Auth, usuário
fixo `disc`). Defina a senha na variável de ambiente `DISC_APP_PASSWORD`
antes de iniciar — o servidor recusa subir sem ela:

```
DISC_APP_PASSWORD="sua-senha-aqui" node server.js
```

Abra `http://localhost:3000` no navegador — o navegador vai pedir usuário
(`disc`) e a senha definida. Depois de autenticado, cada pessoa preenche
nome, cargo e perfil do teste, responde aos 24 blocos e o resultado é salvo
automaticamente.

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

Para configurar a senha de acesso no Render:

1. Abra o serviço no [dashboard do Render](https://dashboard.render.com).
2. Vá em **Environment** (menu lateral do serviço).
3. Em **Environment Variables**, clique em **Add Environment Variable**.
4. Preencha `Key` com `DISC_APP_PASSWORD` e `Value` com a senha escolhida.
5. Clique em **Save Changes** — o Render reinicia o serviço automaticamente
   com a nova variável.

Sem essa variável definida, o servidor não sobe (falha proposital, pra evitar
publicar o app sem proteção).

## Ver resultados do piloto

Na tela inicial (ou ao final de um teste), clique em **"Ver resultados
salvos"** para listar todas as avaliações já registradas: nome, cargo,
perfil predominante, pontuação D/I/S/C e data.

## Escopo atual (piloto)

Implementado: formulário de identificação, seleção de perfil do teste
(televendas/liderança), aplicação do teste, cálculo de pontuação líquida,
gravação dos resultados, listagem em "Resultados salvos" e trava de acesso
por senha única compartilhada (HTTP Basic Auth).

Deliberadamente fora de escopo por enquanto (fase 2, após validar o piloto):
login individual por usuário, dashboard de administração, exportação em PDF
dedicada e tela de consentimento LGPD.
