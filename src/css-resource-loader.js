
const { ResourceLoader } = require('jsdom')
const Apify = require('apify')

const { utils } = Apify
const { utils: { log } } = Apify

class CssResourceLoader extends ResourceLoader {
    
    constructor(options) {
        super(options)
        this.url = new URL(options.url)
    }

    fetch(url, options) {
        try {
            if (options.element.nodeName.toLowerCase() === 'link') {
                log.info('ignoring url:' + url)

                // if (options.element.hasAttribute('src')) {
                //     options.element.removeAttribute('src')
                // }
                
                // if (options.element.hasAttribute('href')) {
                //     options.element.removeAttribute('href')
                // }

                return null
            }

            if (!url.startsWith('http')) {
                url = new URL(url, this.url).href
            }

            if (options.element.getAttribute('src') !== url) {
                options.element.setAttribute('src', url)
            } else if (options.element.getAttribute('href') !== url) {
                options.element.setAttribute('href', url)
            }
    
            log.info('loading url: ' + url)
    
            return super.fetch(url, options)
        } catch (e) {
            log.error('Error loading resource:', e)
            return null
        }
    }
}

module.exports = CssResourceLoader
