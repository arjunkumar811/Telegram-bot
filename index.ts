import { Telegraf } from "telegraf";
import { config } from "dotenv";
config();

const token = process.env.BOT_TOKEN;
if(!token) throw new Error("Bot Token not found .env");
console.log("TOKEN =", process.env.BOT_TOKEN);

const bot = new Telegraf(token);

bot.start(async(ctx) => {
    const userid = ctx.from?.id;
    if(!userid) return;

    let welcomeMessage = `Welcome to solona telegram bot wallet build by Arjun❤️`;
    return ctx.reply(welcomeMessage);

    
})


await bot.launch();
