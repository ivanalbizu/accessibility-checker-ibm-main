const express = require('express')
const puppeteer = require('puppeteer')
const aChecker = require("accessibility-checker")
const app = express()
const bodyParser = require('body-parser')
app.set('view engine', 'pug')
app.set("views", __dirname + "/views")
const port = 3000

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  console.log(2222222222);
  
  res.render('index', { title: 'IBM - Equal Access Checker for Node', message: 'IBM - Equal Access Checker for Node' })
})

app.post('/', async (req, res) => {
  const url = req.body.url
  let domain
  if (!url) {
    return res.status(400).send('url no enviada')
  }
  console.log(url)
  if (url) {
    const url2 = new URL(url)
    domain = url2.hostname
  } else {
    console.log("Invalid URL")
  }
  
  //res.render('report', { title: 'Checker', message: 'Checker',  url })

  try {
    aChecker.getCompliance(url, domain).then((results) => {
      const report = results.report

      // Call the aChecker.assertCompliance API which is used to compare the results with the baseline object if we can find one that
      // matches the same label which was provided.
      const returnCode = aChecker.assertCompliance(report)

      // In the case that the violationData is not defined then trigger an error right away.
      // expect(returnCode).toBe(0, "Scanning " + 'testLabel' + " failed.")
      console.log("returnCode:", returnCode)
      res.render('index', report)
    })
  } catch (err) {
    console.error(err)
    res.send('dentro de catch', err)
  } finally {
    await aChecker.close()
  }
})

app.get('/screenshot', async (req, res) => {
  const browser = await puppeteer.launch()
  console.log('browser::::', browser)

  const page = await browser.newPage()
  //await page.goto(req.query.url) // URL is given by the "user" (your client-side application)
  await page.goto('http://localhost:3000') // URL is given by the "user" (your client-side application)
  const screenshotBuffer = await page.screenshot()

  // Respond with the image
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': screenshotBuffer.length
  })
  res.end(screenshotBuffer)

  await browser.close()
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
    }, 1000);
  } else {
    console.log("Invalid URL")
    res.render('screen', { title: 'Screenshot', message: domain })
  }
  
})

app.listen(process.env.PORT || port, () => {
  console.log(`Example app listening on port ${port}`)
})
