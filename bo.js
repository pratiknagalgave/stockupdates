const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const puppeteer = require('puppeteer');
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual bot token
const token = '7336138572:AAFSevgE5UKP4QCCH8rDqCJenIZoo1aHJak';
const bot = new TelegramBot(token, { polling: true });
const port = process.env.PORT || 3000;
const url1 = process.env.APP_URL || 'https://a242-103-191-202-166.ngrok-free.app/';
const webhookUrl = `${url1}/bot${token}`;
bot.setWebHook(webhookUrl);




// Function to remove all numbers and symbols from text
function removeNumbersAndSymbols(text) {
    return text.replace(/[^\w\s]/g, '').replace(/\d/g, '');
  }
// Listen for any kind of message. There are different kinds of messages.
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Simple command handler
  if (text === '/start') {
    bot.sendMessage(chatId, 'Welcome to the bot! Use /help to see available commands.');
  } else if (text === '/help') {
    bot.sendMessage(chatId, 'Available commands:\n/start - Start the bot\n/help - Show this help message\n/stockupdate - show stock updates');
  } else if (text === '/he') {
    bot.sendMessage(chatId, 'Available commands:\n/start - Start the bot\n/help - Show this help message');
  } else if (text === '/stockupdate') {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let response = "Stock Updates:\n\n";
    await page.goto('https://www.livemint.com/market/stock-market-news');

    try {
      const stockhandles = await page.$$('#lhsgainerloser > .dblock');

      if (stockhandles === null) {
        console.log("No stock data found");
      } else {
        const stockData = [];
        for (const stockhandle of stockhandles) {
          try {
            const singleStock = await page.evaluate(el => el.querySelector("a > ol ").textContent, stockhandle);
            console.log("Stock: " + singleStock);
            response += singleStock + "\n";
            stockData.push(singleStock.trim());
          } catch (e) {
            console.log("Error: " + e);
          }
        }
  // Create an image from the stock data
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');

  // Draw the header
  ctx.fillStyle = '#333';
  ctx.fillRect(0, 0, 800, 50);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 40px Arial';
  ctx.fillText('Stock Updates', 10, 35);

  // Draw the background for stock data
  ctx.fillStyle = '#f8f8f8';
  ctx.fillRect(0, 50, 800, 550);

  // Draw the stock data
  ctx.fillStyle = 'black';
  ctx.font = '26px Arial';
  for (let i = 0; i < stockData.length; i++) {
    const yPosition = 80 + i * 30;
    const text = stockData[i];
    const texttitle = removeNumbersAndSymbols(stockData[i]);


    ctx.fillText(texttitle, 10, yPosition);

    // Draw the thin line below each line of text
    ctx.strokeStyle = '#ddd';
    ctx.beginPath();
    ctx.moveTo(10, yPosition + 5);
    ctx.lineTo(790, yPosition + 5);
    ctx.stroke();

    // Extract numbers and write them to the right side with a different color
    const numbers = text.match(/[\d.,]+/g);
    if (numbers) {
      const percentageMatch = text.match(/[-]?\d+(\.\d+)?%/);
      let percentageText = percentageMatch[0];
      if (percentageMatch) {
        if(!percentageText.includes('-')){
            percentageText = percentageMatch[0].slice(2);

        }
       
        const percentageIndex = text.lastIndexOf(percentageText);
        
       if(!percentageText.includes('-')){
         const mainText = text.slice(0, percentageIndex);
         ctx.fillStyle = 'black';
         ctx.fillText(mainText, 10, yPosition);
         ctx.fillStyle = percentageText.includes('-') ? 'red' : 'blue';
         ctx.fillText(percentageText, 600, yPosition);
       }else{
         const mainText = text.slice(0, percentageIndex);
         ctx.fillStyle = 'black';
         ctx.fillText(mainText, 10, yPosition);
         ctx.fillStyle = percentageText.includes('-') ? 'red' : 'blue';
         ctx.fillText(percentageText, 600, yPosition);
       }
       // const mainText = text.slice(0, percentageIndex);
       
      } else {
        ctx.fillStyle = 'blue';
        ctx.fillText(numbers.join(', '), 600, yPosition);
      }
    }

    ctx.fillStyle = 'black'; // Reset fill style to black for the next line
  }

        const buffer = canvas.toBuffer('image/png');
        const imagePath = path.join(__dirname, 'stock-data.png');
        fs.writeFileSync(imagePath, buffer);

        // Send the image to the bot user
        await bot.sendPhoto(chatId, imagePath, { caption: 'Stock data' });

        // Clean up
        fs.unlinkSync(imagePath);
      }
    } catch (e) {
      console.error(e);
    } finally {
      await browser.close();
    }
  }else{
    bot.sendMessage(chatId, 'Welcome to the bot! Use /help to see available commands.');
  }
});

// Start the Express server (if needed)
const app = express();
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
