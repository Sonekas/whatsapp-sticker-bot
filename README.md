<div align="center">
  <h1>Bot Fig Sonekas 🤖</h1>
  <p>Um Bot de WhatsApp minimalista e levíssimo feito em Node.js (ECMAScript Modules) com a biblioteca Baileys. O objetivo único deste robô é converter instantaneamente imagens, vídeos curtos e GIFs em figurinhas com alta performance, permitindo que você hospede de forma eficiente e duradoura (24/7) em instâncias gratuitas de nuvem (como a plataforma Railway).</p>
</div>

## 🛠️ As Engrenagens (Otimizações Extremas Integradas)

O bot foi arquitetado desde as primeiras linhas para ignorar mensagens inúteis e não derrubar a memória RAM de servidores compactos.

- **Processamento via Buffer:** Imagens estáticas são convertidas quase instantaneamente pro formato `.webp` puramente na memória base (sem leitura ou gravação fantasma no seu disco rígido e sem SSD) pelo módulo em C++ chamado `sharp`.
- **Vídeos e Animações Milimetricamente Ajustados:** Usa o `fluent-ffmpeg` encapsulado por um binário estático no comando NPM. As compressões reduzem vídeos pesados pra moldes rígidos de figurinhas do WhatsApp (10 FPS limitados, dimensões quadradas e limadas de 512x512). O limite máximo permitido para conversão é de estritos 6 segundos. Se houver alguma falha ou tamanho grande o bot recusa enviando apenas um alerta via texto.
- **Injeção de Metadados (A Salvação contra Crash de Conexão):** O WhatsApp tem um bloqueio severo e desliga o roteador virtual do bot (WebSocket erro `428 - Precondition Required`) de sopetão quando você envia um arquivo WebP animado com falta de assinatura. Então usamos e modificamos o pacote `node-webpmux` injetando silenciosamente `bot fig sonekas • 🤖` dentro do código de frames dos GIFs, legitimando seu arquivo e garantindo envios transparentes e corretos que abrem sem problema.
- **Modo Assíncrono Sem Puxar o Tráfego Inteiro:** Não varre conversas antigas e se isenta de baixar mensagens não lidas. Sem processamento de links com previews visuais para esbanjar sua CPU ou RAM de graça — O bot escaneia exatamente palavras com "!fig" economizando 99% das execuções paralelas de Javascript ao logar pela manhã no servidor.
- **QR Code Blindado pra Terminal Universal:** Deixamos de usar mini-blocos em fontes (`small: true`) para o leitor de QR Code para varrer do mapa o erro bizarro de "Core Invertidas" caso alguém use o Windows Terminal ou Power Shell escuro para testes no Windows. Usa blocos puros com cores ANSI.  

## 🚀 Instalando Localmente no Computador Pessoal

1. Confirme que você já carrega as ferramentas **Node.js** (v18 pra cima!) ou atualizado no PC e um CMD aberto na pasta base `Bot fig/`.
2. Baixe os pacotes essenciais do banco de dados (que engolirão todas dependências) jogando isso:
   ```bash
   npm install
   ```
3. Crie um arquivo `.env` na pasta base do projeto (use o `.env.example` como base) e defina as variáveis (caso queira usar as funções de controle do PC):
   ```env
   ADMIN_NUMBER=5511999999999  # Seu número com DDI e DDD sem o '+'
   PC_MAC_ADDRESS=04:7C:16:4B:28:10
   ```
4. Inicie conectando seu novo e reluzente server:
   ```bash
   npm start
   ```
4. Se espante com a leitura relâmpago! Veja no painel do Node.js um terminal preto renderizar o seu  **QR Code**. Dê o play no celular, abra as Configs -> Aparelhos Conectados, e faça scan como se tivesse entrando pelo WhatsApp Web de verdade.
5. Sinta toda a segurança. Uma pasta nativa `/auth` criará arquivos confidenciais guardando suas chaves e sessão e vai dispensar uma segunda leitura do Código pelo resto da vida – mesmo se você reiniciar tudo na sua máquina (a não ser que apague a pastinha `auth`).

## ☁️ Tutorial Mágico de Deploy Total na Nuvem (Railway.app)

O arquivo `.gitignore` base que incluímos tem super poderes blindando a pasta `node_modules`, os pacotes escondidos e principalmente a `auth`. Então seu login secreto estorvando na rua pelo GitHub não tem riscos de hackers.

1. Insira os arquivos restantes todos e o pacote em um **Repositório Privado no GitHub**.
2. Abra a plataforma do servidor e crie um **New Project > "Deploy from GitHub Repo"** dentro do [Railway](https://railway.app/).
3. A mágica da leitura por scripts vai ver em 10 segundos o arquivo `package.json`, auto-preparar a maquina Virtual Node Linux executando o mesmo `npm install` sem esforço das suas mãos e acionando o gatilho `npm start` definitivo pelo painel de variáveis daquele projeto lá em cima.
4. **⚠️ SCANNER PARA OS SERVIDORES DA NUVEM:** Em 3 minutos a máquina fica online! Pra parear pela primeiríssima (e principal) vez: Vasculhe a plataforma do projeto e clique nas abas **"Deployments > Logs"**, role um pouco e observe a janela preta de fundo rodando igualzinha local onde aparecerá o QR Code lindo pra você ler em tempo real via celular e oficializar no App que o Bot subiu!  
5. **(PASSO OBRIGATÓRIO PARA A NUVEM - SOBREVIVÊNCIA DO MODO FREE TIER):** Se atente muito ao detalhe na Railway das construções (Se o servidor da nuvem for dormir na cota mensal de Free tier seu login apagará porque o contêiner não fixa HDs normais ou pastas físicas como a pasta `/auth` permanentemente). Navegue em "Settings" no seu Railway e crie um "Volume" novíssimo. Você DEVE e TEM que apontar fisicamente esse seu disco rígido virtual do Volume como montagem lá pro caminho (`Mount Path`): exatamente batizado de  `/auth`. Tudo ficará perpetuamente guardado para renascer vivo quando o site acordar depois da pausa.

## 💬 Resumo Rápido — Usando na Prática 

Tendo configurado sua engenhoca, você (o dono mestre do bote) ou seus amigos dos grupos de Zap afora com quem tem interação com o Bot, testarão ao vivo pra criar da seguinte maneira:

### 🎨 Criação de Figurinhas (Público)
- **Imagem 2D estática de sempre:** Atrele junto a foto na legenda exata do balãozinho ou responda com texto na foto enviada citando o robô: `!fig`
- **Vídeos engraçados e GIFs malucos:** Tem a mesma forma suprema de reagir, cole e dispare ao post o mesmo título: `!fig` no chat da roda de amigos de preferência em 6s e que a força do figurinho te acompanhe nos combates digitais afora na terra da web!

### 💻 Controle Remoto de PC (Restrito)
Comandos exclusivos para o número de administrador definido no arquivo `.env` (em `ADMIN_NUMBER`):
- **Ligar o PC:** Envie a mensagem `!pc ligar` para o bot. Ele disparará um pacote mágico *Wake-on-LAN* para o endereço MAC cadastrado.
- **Desligar o PC:** Envie `!pc desligar` para o bot e ele vai acionar o desligamento da máquina onde o bot estiver rodando (ou conectado).
