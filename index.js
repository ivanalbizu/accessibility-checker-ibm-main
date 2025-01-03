const express = require('express')
const puppeteer = require('puppeteer')
const aChecker = require("accessibility-checker")
const app = express()
const bodyParser = require('body-parser')
app.set('view engine', 'pug')
app.set("views", __dirname + "/views")
const port = 3000

app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.render('index', { title: 'IBM - Equal Access Checker for Node', message: 'IBM - Equal Access Checker for Node' })
})

function invertObj(obj) {
  const ordered = {
    results: obj.results,
    nls: obj.nls,
    ...obj,
  };
  let invert_obj = {};
  reverse_obj = Object.keys(ordered).reverse();
  reverse_obj.forEach(function (x) {
    invert_obj[x] = ordered[x];
  });
  return invert_obj;
}

app.post('/', async (req, res) => {
  let urls = req.body.url

  if (!urls.length) {
    return res.render('index', {message: 'URLs no válida'})
  }

  let urlArr = urls.split(',').map(item => item.trim())
  let report = []

  if (!urlArr.length) {
    urls = req.body.url
    urlArr = urls.split(',').map(item => item.trim())
    return res.render('index', {message: 'URLs no válida'})
  }

  for (const element of urlArr) {
    try {
      new URL(element)
    } catch (error) {
      console.log(error, '\n', element)
      delete urlArr[element]
    }
  }

  for await (const item of urlArr) {
    console.log(item)
    const resultados = await aChecker.getCompliance(item, item.replaceAll('/', '_')).then((results) => {
      const report = results.report
      //const returnCode = aChecker.assertCompliance(report)
      //console.log("returnCode:", returnCode)
      return report
    })
    report.push(invertObj(resultados))
  }

  await aChecker.close()
  console.log({report});

  res.render('index', {report})
})

app.get('/screenshot', async (req, res) => {
  const browser = await puppeteer.launch()
  console.log('browser::::', browser)

  const page = await browser.newPage()
  //await page.goto(req.query.url) // URL is given by the "user" (your client-side application)
  await page.goto('http://localhost:3000') // URL is given by the "user" (your client-side application)
  const screenshotBuffer = await page.screenshot()
  await browser.close()

  // Respond with the image
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': screenshotBuffer.length
  })
  res.end(screenshotBuffer)

})

app.get('/screen', async (req, res) => {  
  res.render('screen', { title: 'Screenshot', message: 'Screenshot' })
})

app.post('/screen', async (req, res) => {
  const url = req.body.url
  let domain
  if (!url) {
    return res.status(400).send('url no enviada')
  }
  console.log(url)
  if (url) {
    const url2 = new URL(url)
    domain = url2.hostname

    const browser = await puppeteer.launch()

    const page = await browser.newPage()
    //await page.goto(req.query.url) // URL is given by the "user" (your client-side application)
    await page.goto(url2) // URL is given by the "user" (your client-side application)
    setTimeout(async () => {
      const screenshotBuffer = await page.screenshot()
  
      // Respond with the image
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': screenshotBuffer.length
      })
      res.end(screenshotBuffer)
  
      await browser.close()
    }, 1000)
  } else {
    console.log("Invalid URL")
    res.render('screen', { title: 'Screenshot', message: domain })
  }
  
})

app.listen(process.env.PORT || port, () => {
  console.log(`Example app listening on port ${port}`)
})
