import { Telegraf } from "telegraf";
import { config } from "dotenv";
config();

const token = process.env.BOT_TOKEN;
if(!token) throw new Error("Bot Token not found .env");

const bot = new Telegraf(token);

bot.start((ctx) => {
    
})