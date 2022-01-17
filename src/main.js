const fs = require('fs')
const Apify = require('apify')
const selectors = require('./selectors')
const jsdom = require('jsdom')
const JSDOM = jsdom.JSDOM

const { utils } = Apify
const { utils: { log } } = Apify

Apify.main(async () => {
    
    if (process.env.DEV_MODE === 'true') {
        log.info('development mode')

        if (fs.existsSync(process.env.APIFY_LOCAL_STORAGE_DIR)) {
            fs.rmdirSync(process.env.APIFY_LOCAL_STORAGE_DIR, {recursive: true, force: true})
        }

        await Apify.setValue('INPUT', {
            firstReviewOnly: true,
            url: 'https://www.tripadvisor.com.br/Hotel_Review-g303506-d536032-Reviews-Hotel_Mar_Palace_Copacabana-Rio_de_Janeiro_State_of_Rio_de_Janeiro.html'
        })
    } else {
        log.info('production mode')
    }

    const input = await Apify.getValue('INPUT')

    log.info('INPUT', input)

    globalThis.SITE_URL = new URL(input.url)
    
    const requestList = await Apify.openRequestList('queue',[{
        url: input.url,
        userData: {
            initializeHotel: true
        }
    }])

    const requestQueue = await Apify.openRequestQueue()
    const dataset = await Apify.openDataset()

    const config = selectors.config
    const configReviews = config.selector.config.reviews.selector
    
    await selectors.initialize()
    
    async function loadPageComplete(doc, hotel) {

        const nextReviewSelector = selectors.page.nextReviewSelector
        const nextReviewElement = doc.querySelector(nextReviewSelector)

        if (!input.firstReviewOnly && nextReviewElement && !nextReviewElement.classList.contains('disabled') && nextReviewElement.getAttribute('href')) {
            log.info('enqueuing load hotel reviews:' + nextReviewElement.getAttribute('href'))

            const url = new URL(nextReviewElement.getAttribute('href'), input.url)

            await requestQueue.addRequest({
                url: url.href,
                userData: {
                    loadReviews: true,
                    hotel
                }
            })
        } else {
            log.info('loaded hotel:' + hotel.name)

            if (hotel.reviews) {
                hotel.reviews.forEach(review => review.id = hotel.id)
            }

            await dataset.pushData(hotel)
        }
    }


    const crawler = new Apify.BasicCrawler({
        requestList,
        requestQueue,
        maxRequestRetries: 1,
        maxConcurrency: 10,
        handleRequestTimeoutSecs: 120,
        handleRequestFunction: async ({request}) => {

            if (request.userData.initializeHotel) {

                log.info('Processing Hotel: ' + request.url)

                const url = request.url
                const dom = await loadPage(url)
                const doc = dom.window.document

                const hotel = selectors.selectObject(doc, config.selector)

                hotel.type = 'HOTEL'
                hotel.webUrl = url
                
                const regexLocationId = /-g([0-9]+)/g
                const regexHotelId = /-d([0-9]+)/g
                
                const matchLocationId = regexLocationId.exec(url)
                const matchHotelId = regexHotelId.exec(url)

                if (matchLocationId && matchLocationId[1]) {
                    hotel.locationId = matchLocationId[1]
                }

                if (matchHotelId && matchHotelId[1]) {
                    hotel.id = matchHotelId[1]
                }

                await loadPageComplete(doc, hotel)

            } else if (request.userData.loadReviews) {

                log.info('Loading Hotel Reviews: ' + request.url)

                const hotel = request.userData.hotel
                const url = request.url;
                const dom = await loadPage(url)
                const doc = dom.window.document

                hotel.reviews = (hotel.reviews || []).concat(selectors.selectArray(doc, configReviews))

                await loadPageComplete(doc, hotel)
            }
        },
        handleFailedRequestFunction: async ({request, error}) => {
            log.error('Request failed', {url: request.url, error})
        }
    })

    log.info('start crawler')
    await crawler.run()
    log.info('finish crawler')
})

async function loadPage(url) {

    const response = await utils.requestAsBrowser({url, languageCode: 'pt', countryCode: 'BR'})

    const dom = new JSDOM(response.body, {
        url: url,
        referrer: url,
        contentType: "text/html",
        includeNodeLocations: true,
        storageQuota: 10000000
    })

    await new Promise(resolve => {
        dom.window.addEventListener('load', e => {
            log.info('loaded: ' + url)
            resolve()
        })
    })

    return dom
}