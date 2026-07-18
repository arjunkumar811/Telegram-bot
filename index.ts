import { Markup, Telegraf } from "telegraf";
import type { Context } from "telegraf";
import { config } from "dotenv";
import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
} from "@solana/web3.js";
import { message } from "telegraf/filters";
config();

const token = process.env.BOT_TOKEN;
if(!token) throw new Error("Bot Token not found .env");
console.log("TOKEN =", process.env.BOT_TOKEN);

const bot = new Telegraf(token);
const connection = new Connection(process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com", "confirmed");

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


function getUserId(ctx: Context) {
    return ctx.from?.id ? String(ctx.from.id) : undefined;
}


function isValidPublicKey(value: string): boolean {
    try {
        new PublicKey(value);
        return true;
    } catch {
        return false;
    }
}


function parseSolAmount(value: string): number | null {
    const amount = Number.parseFloat(value);
    if (!Number.isFinite(amount) || amount <= 0) {
        return null;
    }

    return Math.round(amount * LAMPORTS_PER_SOL) > 0 ? amount : null;
}


bot.action("generate_wallet", (ctx) => {
    ctx.answerCbQuery("Generating Wallet....");
    const keypair = Keypair.generate()
    const userId = getUserId(ctx);
    if(userId) USERS[userId] = keypair;

    ctx.reply(`New wallet created for you with a public key ${keypair.publicKey.toBase58()}`, {
        parse_mode: "Markdown",
        ...postWalletCreationKeyboard
    });
})



bot.action("view_address", (ctx) => {
    ctx.answerCbQuery("Showing your address");
    const userId = getUserId(ctx);
    const keypair = userId ? USERS[userId] : undefined;

if(!keypair) {
    ctx.reply("We dont have you wallet so create one here👇", {
        parse_mode: "Markdown",
        ...generate_wallet_keyboard
    });
    return;
}

   ctx.reply(`Here is your public key ${keypair.publicKey.toBase58()}`, {
        parse_mode: "Markdown",
        ...postWalletCreationKeyboard
    });
})



bot.action("send_sol", (ctx) => {
    const userId = getUserId(ctx);
    ctx.answerCbQuery()
    if (!userId || !USERS[userId]) {
        ctx.reply("Create a wallet first so I can send SOL from it.", {
            parse_mode: "Markdown",
            ...generate_wallet_keyboard,
        });
        return;
    }

    ctx.reply("Can you share the address to send to?")
    PENDING_REQUESTS[userId] = {
        type: "SEND_SOL"
    }
});


bot.on(message("text"), async (ctx) => {
    const userId = getUserId(ctx);
    if(!userId || PENDING_REQUESTS[userId]?.type !== "SEND_SOL") {
        return;
    }

    const request = PENDING_REQUESTS[userId];
    const text = ctx.message.text.trim();

    if (!request.to) {
        if (!isValidPublicKey(text)) {
            await ctx.reply("That is not a valid Solana address. Send a valid public key.");
            return;
        }

        request.to = text;
        await ctx.reply("How much SOL do you want to send?");
        return;
    }

    const amount = parseSolAmount(text);
    if (amount === null) {
        await ctx.reply("Send a valid SOL amount greater than 0.");
        return;
    }

    const sender = USERS[userId];
    if (!sender) {
        delete PENDING_REQUESTS[userId];
        await ctx.reply("Your wallet is missing. Create a new one first.", {
            parse_mode: "Markdown",
            ...generate_wallet_keyboard,
        });
        return;
    }

    const destination = new PublicKey(request.to);
    const lamports = Math.round(amount * LAMPORTS_PER_SOL);
    const balance = await connection.getBalance(sender.publicKey, "confirmed");

    if (balance < lamports) {
        await ctx.reply(`Insufficient balance. Your wallet has ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL.`);
        return;
    }

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: sender.publicKey,
            toPubkey: destination,
            lamports,
        })
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [sender]);
    await ctx.reply(`Initiated a txn for ${amount} SOL to ${request.to}\nSignature: ${signature}`, {
        parse_mode: 'Markdown',
        ...postWalletCreationKeyboard
    });
    delete PENDING_REQUESTS[userId];
})


await bot.launch();
