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

const isSameOrigin = (origin, destination) => origin.protocol === destination.protocol && origin.host === destination.host && origin.port === destination.port;

app.post('/', async (req, res) => {
  const depths = req.body.depths
  let urls = req.body.url
  let report = []
  let urlArr

  if (!urls.length) {
    return res.render('index', {message: 'URLs no válida'})
  }

  if (depths == 'on') {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    await page.goto(urls, {
      waitUntil: 'networkidle2',
    })
    urlArr = await page.evaluate(() => {
      const anchors = document.querySelectorAll('a')
      return [].map.call(anchors, a => a.href)
    })

    urlArr = [...new Set(urlArr)].filter(item => {
      if (isSameOrigin(new URL(item), new URL(urls))) {
        return item
      }
    })

    await browser.close()
  } else {
    urlArr = urls.split(',').map(item => item.trim())
  
    if (!urlArr.length) {
      urls = req.body.url
      urlArr = urls.split(',').map(item => item.trim())
      return res.render('index', {message: 'URLs no válida'})
    }
  }

  for await (const item of urlArr) {
    const resultados = await aChecker.getCompliance(item, item.replaceAll('/', '_')).then((results) => {
      const report = results.report
      return report
    })
    report.push(invertObj(resultados))
  }

  await aChecker.close()
  res.render('index', {report})
})

app.get('/screenshot', async (req, res) => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  await page.goto('https://ivanalbizu.eu/experimentos/hlx/', {
    waitUntil: 'networkidle2',
  })
  const hrefs = await page.evaluate(() => {
    const anchors = document.querySelectorAll('a');
    return [].map.call(anchors, a => a.href);
  });
  console.log('hrefs:',hrefs);

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
    await page.goto(url2, {
      waitUntil: 'networkidle2',
    }) // URL is given by the "user" (your client-side application)
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
