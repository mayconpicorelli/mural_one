# Mural One

Portal interno com parede de avisos, calendario operacional e agente GPT. O projeto roda em Node.js/Express e entrega uma unica pagina protegida com login.

## Como iniciar

1. Duplique `.env.example` para `.env` e configure variaveis essenciais:
   - `OPENAI_API_KEY`: chave oficial da OpenAI.
   - `ALLOWED_USERS`: lista `usuario:senha` separada por virgula (ex.: `Admin:SenhaForte123,usuario:SenhaForte123`).
   - `BLOCKED_TOPICS`: termos que o bot nao deve responder.
2. Edite `data/content.json` para manter comunicados, feriados e materiais.
3. Instale dependencias: `npm install`.
4. Suba o servidor local: `npm start`. O portal ficara em `http://localhost:3000`.

## Funcionalidades

- **Autenticacao basica:** login antes de liberar a pagina. Os demais endpoints (`/api/dashboard-data`, `/api/chat`) exigem token.
- **Mural de avisos:** cards dinamicos, ordenados por data, carregados do JSON.
- **Calendario corporativo:** grade mensal com destaque de feriados e painel lateral mostrando o status de cada unidade.
- **Materiais compartilhados:** lista de arquivos/links uteis e colecoes de atalhos configuraveis no JSON.
- **Agente GPT interno:** campo de prompt do sistema, ajuste de temperatura e bloqueio de termos antes da chamada `chat/completions`. O backend age como proxy para esconder sua chave. Apenas perfis `Admin` podem alterar prompt/temperatura; usuários padrão usam os valores definidos pelo RH.
- **Conteudo cacheado:** o arquivo `data/content.json` e lido com cache (configurado via `DATA_CACHE_SECONDS`). Use `?refresh=1` para forcar recarga.

## Personalizacoes rapidas

- Ajuste identidades visuais em `public/styles.css` (cores, gradientes, logos).
- Atualize o prompt padrao do bot via `GPT_SYSTEM_PROMPT` ou diretamente no campo da interface.
- Configure tempo de sessao com `SESSION_TTL_HOURS`.
- Inclua novos blocos no mural ou calendario editando o JSON sem tocar no codigo.

## Comandos uteis

```bash
npm install   # instala dependencias
npm start     # inicia em modo producao simples
npm run dev   # reinicia automaticamente durante desenvolvimento
```

## Observacoes

- Este projeto nao inclui banco de dados; a persistencia depende do arquivo `data/content.json`.
- Para uso em producao, proteja o servidor atras de HTTPS e considere mover usuarios e comunicados para um storage dedicado.
