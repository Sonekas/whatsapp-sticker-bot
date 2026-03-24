import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    downloadContentFromMessage,
    fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode';
import { COMMAND, MAX_VIDEO_DURATION, AUTH_DIR } from './config.js';
import { createStickerFromImage, createStickerFromVideo } from './utils/sticker.js';

// Log apenas de erros para manter terminal limpo e economizar recursos na nuvem
const logger = pino({ level: 'error' });

async function startBot() {
    // Busca a versão mais recente e os dados de autenticação armazenados em 'auth/'
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    const sock = makeWASocket({
        version,
        auth: state,
        logger,
        browser: ['Bot Fig', 'Chrome', '1.0.0'], // Identificação do bot
        syncFullHistory: false, // Essencial não baixar histórico antigo para economizar RAM
        markOnlineOnConnect: false, // Economiza requests para a API
        generateHighQualityLinkPreviews: false // Evita uso extra de CPU processando URLs
    });

    // Salva status da sessão automaticamente
    sock.ev.on('creds.update', saveCreds);

    // Sistema de reconexão automática
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            // Gera QR Code exclusivamente no terminal para leitura rápida na nuvem (Railway)
            qrcode.toString(qr, { type: 'terminal', small: true }, (err, url) => {
                if (!err) {
                    console.log('\n==================================================================');
                    console.log('⚠️ LEITURA NECESSÁRIA PARA AUTENTICAÇÃO ⚠️');
                    console.log('Se você fez deploy na nuvem (Railway), escaneie o código abaixo pelo celular:');
                    console.log(url);
                    console.log('==================================================================\n');
                }
            });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(`Conexão fechada. Tentando reconectar: ${shouldReconnect}`);
            
            if (shouldReconnect) {
                startBot();
            } else {
                console.log('Você deslogou o Bot do WhatsApp. Remova a pasta auth/ e inicie novamente para scanear um novo QR Code.');
            }
        } else if (connection === 'open') {
            console.log('✅ Bot conectado e pronto para receber comandos!');
        }
    });

    // Ouve todas as novas mensagens recebidas
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        // Ignora histórico antigo e processa apenas novas mensagens
        if (type !== 'notify') return;
        
        const msg = messages[0];
        
        // Otimização: Ignora mensagens vazias do sistema, mas permite que o próprio dono do bot use !fig
        if (!msg.message) return;

        // Extrai o texto da mensagem (pode vir de vários campos possíveis dependendo se tem mídia)
        const text = msg.message.conversation ||
                     msg.message.extendedTextMessage?.text ||
                     msg.message.imageMessage?.caption ||
                     msg.message.videoMessage?.caption || "";
        
        // Se a mensagem não contiver EXATAMENTE "!fig", ignorar e parar processamento imediatamente
        if (text.trim() !== COMMAND) return;

        const remoteJid = msg.key.remoteJid;
        
        // Verifica de onde puxar a mídia: da própria mensagem ou de uma menção/resposta
        const isReply = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const msgToCheck = isReply ? msg.message.extendedTextMessage.contextInfo.quotedMessage : msg.message;

        // 1. Processar Imagem (Figurinha Estática)
        if (msgToCheck.imageMessage) {
            console.log(`[!] Processando imagem de ${remoteJid}...`);
            try {
                const stream = await downloadContentFromMessage(msgToCheck.imageMessage, 'image');
                let buffer = Buffer.from([]);
                for await(const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                const stickerBuffer = await createStickerFromImage(buffer);
                await sock.sendMessage(remoteJid, { sticker: stickerBuffer }, { quoted: msg });
                console.log(`[✓] Figurinha (imagem) enviada!`);
            } catch (error) {
                console.error('Erro ao processar imagem:', error);
                await sock.sendMessage(remoteJid, { text: '❌ Erro ao criar figurinha da imagem.' }, { quoted: msg });
            }
            return;
        }

        // 2. Processar Vídeo ou GIF (Figurinha Animada)
        if (msgToCheck.videoMessage) {
            const videoMessage = msgToCheck.videoMessage;
            console.log(`[!] Processando vídeo/GIF de ${remoteJid}...`);
            
            // Restrição de duração para evitar travar ou gastar RAM no server free
            if (videoMessage.seconds > MAX_VIDEO_DURATION) {
                await sock.sendMessage(remoteJid, { text: `❌ Video longo demais. O máximo permitido é de ${MAX_VIDEO_DURATION} segundos.` }, { quoted: msg });
                return;
            }

            try {
                const stream = await downloadContentFromMessage(videoMessage, 'video');
                let buffer = Buffer.from([]);
                for await(const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }

                const stickerBuffer = await createStickerFromVideo(buffer);
                await sock.sendMessage(remoteJid, { sticker: stickerBuffer }, { quoted: msg });
                console.log(`[✓] Figurinha animada enviada!`);
            } catch (error) {
                console.error('Erro na conversão do vídeo:', error);
                await sock.sendMessage(remoteJid, { text: '❌ Erro ao criar figurinha animada. O arquivo pode ser muito complexo ou estar corrompido.' }, { quoted: msg });
            }
            return;
        }

        // Se o comando foi enviado, mas não havia mídia e nenhuma mensagem original (com mídia) foi citada
        await sock.sendMessage(remoteJid, { text: `❌ Envie uma imagem ou vídeo diretamente com a legenda *${COMMAND}* \nOu *responda* a uma mídia usando *${COMMAND}*.` }, { quoted: msg });
    });
}

// Inicia o sistema
startBot();
