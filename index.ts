import { Markup, Telegraf } from "telegraf";
import { config } from "dotenv";
import { Keypair } from "@solana/web3.js";
import { message } from "telegraf/filters";
config();

const token = process.env.BOT_TOKEN;
if(!token) throw new Error("Bot Token not found .env");
console.log("TOKEN =", process.env.BOT_TOKEN);

const bot = new Telegraf(token);

const USERS: Record<string, Keypair> = {}
interface PendingRequestType {
    type: "SEND_SOL" | "SEND_TOKEN",
    amount?: number,
    to?: string
}

const PENDING_REQUESTS: Record<string, PendingRequestType> = {};

const keyboard = Markup.inlineKeyboard([
    [
        Markup.button.callback(' 🔑 Generate new wallets', 'generate_wallet'),
        Markup.button.callback(' 👁️ View Address ', 'view_address'),
    ],
])


const generate_wallet_keyboard = Markup.inlineKeyboard([
    [
        Markup.button.callback(' 🔑 Generate new wallets', 'generate_wallet'),
    ],
])


const postWalletCreationKeyboard = Markup.inlineKeyboard([
    [
        Markup.button.callback(' 🔑 Send a SOL', 'send_sol'),
        Markup.button.callback(' 👁️ View Address ', 'view_address'),
    ],
])

bot.start(async(ctx) => {
    const userid = ctx.from?.id;
    if(!userid) return;

    let welcomeMessage = `Welcome to solona telegram bot wallet build by Arjun❤️`;
    return ctx.reply(welcomeMessage, {
        parse_mode: "Markdown",
        ...keyboard
    });   
});


bot.action("generate_wallet", (ctx) => {
    ctx.answerCbQuery("Generating Wallet....");
    const keypair = Keypair.generate()
    const userId = ctx.from?.id;
    if(userId) USERS[userId] = keypair;

    ctx.sendMessage(`New wallet created for you with a public key ${keypair.publicKey.toBase58()}`, {
        parse_mode: "Markdown",
        ...postWalletCreationKeyboard
    });
})



bot.action("view_address", (ctx) => {
    ctx.answerCbQuery("Showing your address");
    const userId = ctx.from?.id;
    const keypair =  USERS[userId];

if(!keypair) {
    ctx.sendMessage("We dont have you wallet so create one here👇", {
        parse_mode: "Markdown",
        ...generate_wallet_keyboard
    });
    return;
}

   ctx.sendMessage(`Here is your public key ${keypair.publicKey.toBase58()}`, {
        parse_mode: "Markdown",
        ...postWalletCreationKeyboard
    });
})



bot.action("send_sol", (ctx) => {
    const userId = ctx.from?.id;
    ctx.answerCbQuery()
    ctx.sendMessage("Can you Share the address to send to")
    PENDING_REQUESTS[userId] = {
        type: "SEND_SOL"
    }
});


bot.on(message("text"), (ctx) => {
    const userId = ctx.from?.id;
    if(PENDING_REQUESTS[userId]?.type == "SEND_SOL") {
        if (PENDING_REQUESTS[userId] && !PENDING_REQUESTS[userId].to) {
            // TODO: Check here if it is a valid public key

            PENDING_REQUESTS[userId].to = ctx.message.text;
            ctx.sendMessage("How much SOL do you want to send");
        } else {
            const amount = ctx.message.text;
            //TODO: Check if this is a valid amount
            // TODO: Check if user has this much SOL in their wallet.
            // TODO: Create a txn and forward it to the blockchain

            ctx.sendMessage(`Initiated a txn for ${amount} SOL to ${PENDING_REQUESTS[userId].to}`, {
                parse_mode: 'Markdown',
                ...postWalletCreationKeyboard
            });
            delete PENDING_REQUESTS[userId];


        }
    }
})


await bot.launch();
