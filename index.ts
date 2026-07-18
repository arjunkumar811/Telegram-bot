import { Markup, Telegraf } from "telegraf";
import { config } from "dotenv";
import { Keypair } from "@solana/web3.js";
config();

const token = process.env.BOT_TOKEN;
if(!token) throw new Error("Bot Token not found .env");
console.log("TOKEN =", process.env.BOT_TOKEN);

const bot = new Telegraf(token);

const USERS: Record<string, Keypair> = {}

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
        ...keyboard
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
        ...keyboard
    });
})

await bot.launch();
