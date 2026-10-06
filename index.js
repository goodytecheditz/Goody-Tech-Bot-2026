import http from "http";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";
import pino from "pino";

// ==============================
// ONEBIT HEALTH SERVER
// ==============================

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain"
  });

  res.end("Goody Tech WhatsApp Bot is running!");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Health server running on port ${PORT}`);
});

// ==============================
// BOT SETTINGS
// ==============================

const PREFIX = ".";
const PHONE_NUMBER = "2348136045102";

// ==============================
// START BOT
// ==============================

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Goody Tech Bot", "Chrome", "1.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  let pairingRequested = false;

  // ==============================
  // CONNECTION
  // ==============================

  sock.ev.on("connection.update", async (update) => {
    const {
      connection,
      lastDisconnect,
      qr
    } = update;

    if (connection === "connecting") {
      console.log("🔄 Connecting Goody Tech Bot...");
    }

    // ==============================
    // PAIRING CODE
    // ==============================

    if (
      qr &&
      !state.creds.registered &&
      !pairingRequested
    ) {
      pairingRequested = true;

      try {
        console.log(
          "🔐 WhatsApp is ready for pairing..."
        );

        const code =
          await sock.requestPairingCode(
            PHONE_NUMBER
          );

        console.log("");
        console.log(
          "================================="
        );
        console.log(
          "🔐 GOODY TECH BOT PAIRING CODE"
        );
        console.log(
          "================================="
        );
        console.log(
          `PAIRING CODE: ${code}`
        );
        console.log(
          "================================="
        );
        console.log("");

        console.log(
          "WhatsApp → Linked Devices →"
        );

        console.log(
          "Link a device → Link with phone number"
        );

        console.log("");
      } catch (error) {
        console.error(
          "❌ Pairing code error:",
          error
        );

        pairingRequested = false;
      }
    }

    // ==============================
    // BOT ONLINE
    // ==============================

    if (connection === "open") {
      console.log("");
      console.log(
        "================================="
      );
      console.log(
        "✅ GOODY TECH BOT IS ONLINE!"
      );
      console.log(
        "================================="
      );
      console.log("");
    }

    // ==============================
    // DISCONNECTED
    // ==============================

    if (connection === "close") {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode;

      console.log(
        "❌ WhatsApp connection closed."
      );

      console.log(
        "Status code:",
        statusCode
      );

      if (
        statusCode === DisconnectReason.loggedOut
      ) {
        console.log(
          "⚠️ WhatsApp account logged out."
        );

        return;
      }

      pairingRequested = false;

      console.log(
        "🔄 Reconnecting in 5 seconds..."
      );

      setTimeout(() => {
        startBot();
      }, 5000);
    }
  });

  // ==============================
  // COMMANDS
  // ==============================

  sock.ev.on(
    "messages.upsert",
    async ({ messages }) => {
      try {
        const msg = messages[0];

        if (!msg?.message || msg.key.fromMe) {
          return;
        }

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          "";

        if (!text.startsWith(PREFIX)) {
          return;
        }

        const command = text
          .slice(PREFIX.length)
          .trim()
          .toLowerCase();

        const jid = msg.key.remoteJid;

        // ==============================
        // MENU
        // ==============================

        if (
          command === "menu" ||
          command === "help"
        ) {
          await sock.sendMessage(jid, {
            text: `
╭━━━〔 GOODY TECH BOT 〕━━━╮
┃
┃ 👋 Welcome to Goody Tech Bot
┃
┃ 👤 Owner: Goody Tech
┃ ⚡ Prefix: .
┃
┣━━〔 GENERAL 〕━━
┃ .menu
┃ .help
┃ .ping
┃ .owner
┃ .info
┃
┣━━〔 AI 〕━━
┃ .ai
┃
┣━━〔 DOWNLOAD 〕━━
┃ .yt
┃ .tiktok
┃ .facebook
┃ .instagram
┃
┣━━〔 STICKER 〕━━
┃ .sticker
┃
┣━━〔 GROUP 〕━━
┃ .tagall
┃ .admins
┃ .groupinfo
┃
┣━━〔 FUN 〕━━
┃ .joke
┃ .quote
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🚀 Powered by Goody Tech Editz
`
          });
        }

        // ==============================
        // PING
        // ==============================

        else if (command === "ping") {
          await sock.sendMessage(jid, {
            text:
              "🏓 Pong!\n\n" +
              "✅ Goody Tech Bot is online."
          });
        }

        // ==============================
        // OWNER
        // ==============================

        else if (command === "owner") {
          await sock.sendMessage(jid, {
            text:
              "👑 Owner: Goody Tech\n" +
              "🎨 Goody Tech Editz"
          });
        }

        // ==============================
        // INFO
        // ==============================

        else if (command === "info") {
          await sock.sendMessage(jid, {
            text:
              "🤖 Goody Tech Bot\n\n" +
              "Version: 1.0.0\n" +
              "Prefix: .\n" +
              "Status: Online"
          });
        }

      } catch (error) {
        console.error(
          "❌ Message error:",
          error
        );
      }
    }
  );
}

// =================
