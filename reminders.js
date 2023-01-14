const util = require('util');
const fetch = require('node-fetch')
const Config = require('./config');
const debug = Config.debug

async function getStatus() {
    //confirm telegram settings
    if (Config.BOT_TOKEN == '' || Config.TELEGRAM_CHANNEL == '') throw new Error (`Must provide Telegram variables`)
    let status = await (fetch(Config.STATUS_URL).then(response => response.json()))
    if (status.setTemp >= Config.REMINDER_THRESHOLD) {
        let message = `Current setTemp: ${status.setTemp}`
        let url = `https://api.telegram.org/bot${Config.BOT_TOKEN}/sendMessage?chat_id=${Config.TELEGRAM_CHANNEL}&text=${message}`; 
        console.log('yup')
        await fetch(url)
    }
}

getStatus()
