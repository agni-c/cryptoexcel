const express = require('express')
const app = express()
const xlsx = require('xlsx')
const axios = require('axios')
const fs = require('fs')
const cron = require('node-cron')

require('dotenv').config()

app.use(express.json())
// app.use(express.urlencoded())

app.get('/', async (req, res) => {
	res.json({ data: 'Hello World' })
})

cron.schedule('*/1 * * * *', async () => {
	const [data, error] = await getCryptoData()
	if (error) {
		console.log({ error })
		return
	}
	const cryptoData = projectData(data)
	appendJsonDataToXlsx(cryptoData)
	console.table(cryptoData)
})

async function getCryptoData() {
	try {
		const res = await axios.get(
			'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=10&convert=USD',
			{
				headers: { 'X-CMC_PRO_API_KEY': process.env.CRYPTO_API_KEY },
			}
		)
		return [res.data.data, null]
	} catch (error) {
		return [null, error]
	}
}
function projectData(jsonData = []) {
	// create a object from json data which only contains relevent information
	const dataForExcel = []
	jsonData.length > 0 &&
		jsonData.forEach(data => {
			const newData = {
				id: data.id,
				name: data.name,
				max_supply: data.max_supply,
				price: data.quote.USD.price,
			}
			dataForExcel.push(newData)
		})
	return dataForExcel
}
function appendJsonDataToXlsx(jsonData = []) {
	try {
		const path = './crypto_data.xlsx'
		if (fs.existsSync(path)) {
			const newWB = xlsx.utils.book_new()

			const newWS = xlsx.utils.json_to_sheet(jsonData)

			xlsx.utils.book_append_sheet(newWB, newWS, 'crypto') //workbook name as param

			xlsx.writeFile(newWB, path) //file name as param
		}
	} catch (error) {
		console.log(error)
		res.status(500).json(error)
	}
}
const port = 5000 || process.env.PORT

app.listen(port, () => {
	console.log('server started at ', port)
})
