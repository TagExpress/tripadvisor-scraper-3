const Apify = require('apify')

const { utils } = Apify
const { utils: { log } } = Apify

const monthByName = {
    jan: '01',
    fev: '02',
    mar: '03',
    abr: '04',
    mai: '05',
    jun: '06',
    jul: '07',
    ago: '08',
    set: '09',
    out: '10',
    nov: '11',
    dez: '12'
}

const config = {
    selector: {
        selector: 'body',
        config: {
            name: { 
                selector: '#HEADING'
            },
            rawRanking: {
                selector: '.KeVaw',
                convert: value => {
                    if (value) {
                        const regexNumber = /([0-9\.,]+)[^0-9]+([0-9\.,]+)/g
                        const matchNumber = regexNumber.exec(value)
                        if (matchNumber && matchNumber[1] && matchNumber[2]) {
                            const rankingPosition = Number(matchNumber[1].replace(',','.'))
                            const rankingDenominator = Number(matchNumber[2].replace(',','.'))
                            return (5 - (rankingPosition / rankingDenominator * 5)).toString()
                        }
                    }
                    return null
                }
            },
            rankingPosition: {
                selector: '.rank',
                convert: value => {
                    if (value) {
                        const regexNumber = /([0-9\.,]+)/g
                        const matchNumber = regexNumber.exec(value)
                        if (matchNumber && matchNumber[1]) {
                            return matchNumber[1].replace(',','.')
                        }
                    }
                    return null
                }
            },
            rankingDenominator: {
                selector: '.KeVaw',
                convert: value => {
                    if (value) {
                        const regexNumber = /([0-9\.,]+)[^0-9]+([0-9\.,]+)/g
                        const matchNumber = regexNumber.exec(value)
                        if (matchNumber && matchNumber[2]) {
                            return matchNumber[2].replace(',','.')
                        }
                    }
                    return null
                }
            },
            rankingString: {
                selector: '.KeVaw'
            },
            rating: {
                selector: '.bvcwU.P',
                convert: value => (value||'').replace(',','.')
            },
            ratingExcellent: {
                selector: '.ui_checkbox.dQNlC',
                select: (doc, selector) => {
                    const list = doc.querySelectorAll(selector)
                    for (const group of list) {
                        if (group.querySelector('#ReviewRatingFilter_5')) {
                            return group.querySelector('.cpqJw')
                        }
                    }
                    return null
                }
            },
            ratingGood: {
                selector: '.ui_checkbox.dQNlC',
                select: (doc, selector) => {
                    const list = doc.querySelectorAll(selector)
                    for (const group of list) {
                        if (group.querySelector('#ReviewRatingFilter_4')) {
                            return group.querySelector('.cpqJw')
                        }
                    }
                    return null
                }
            },
            ratingAverage: {
                selector: '.ui_checkbox.dQNlC',
                select: (doc, selector) => {
                    const list = doc.querySelectorAll(selector)
                    for (const group of list) {
                        if (group.querySelector('#ReviewRatingFilter_3')) {
                            return group.querySelector('.cpqJw')
                        }
                    }
                    return null
                }
            },
            ratingPoor: {
                selector: '.ui_checkbox.dQNlC',
                select: (doc, selector) => {
                    const list = doc.querySelectorAll(selector)
                    for (const group of list) {
                        if (group.querySelector('#ReviewRatingFilter_2')) {
                            return group.querySelector('.cpqJw')
                        }
                    }
                    return null
                }
            },
            ratingTerrible: {
                selector: '.ui_checkbox.dQNlC',
                select: (doc, selector) => {
                    const list = doc.querySelectorAll(selector)
                    for (const group of list) {
                        if (group.querySelector('#ReviewRatingFilter_1')) {
                            return group.querySelector('.cpqJw')
                        }
                    }
                    return null
                }
            },
            hotelClass: {
                selector: '.TkRkB.d.H0',
                value: element => element.getAttribute('title'),
                convert: value => {
                    if (value) {
                        const regexValue = /([0-9\.,]+)/g
                        const matchValue = regexValue.exec(value)
                        if (matchValue && matchValue[1]) {
                            return matchValue[1].replace(',','.')
                        }
                    }
                    return null
                }
            },
            awards: {
                selector: '.fZdJf.P',
                select: (doc, selector) => doc.querySelectorAll(selector),
                value: elements => {
                    const currentYear = new Date().getFullYear().toString()
                    return Array.prototype.map.call(elements, element => ({name: element.textContent, year: currentYear}))
                }
            },
            numberOfReviews: {
                selector: '.cdKMr.Mc._R.b'
            },
            reviewsCount: {
                selector: '.cdKMr.Mc._R.b',
                convert: value => value ? Number(value.replace(',','.')) : null
            },
            reviews: {
                selector: {
                    selector: '[data-test-target="HR_CC_CARD"]',
                    config: {
                        title: {
                            selector: '[data-test-target="review-title"] > a'
                        },
                        text: {
                            selector: '.XllAv'
                        },
                        rating: {
                            selector: '[data-test-target="review-rating"] > span',
                            value: ratingValue
                        },
                        stayDate: {
                            selector: '.euPKI',
                            convert: value => {
                                if (value && value.includes(':')) {
                                    const regexDate = /:\s+(.+)\s+\w+\s+(\d+)$/g
                                    const matchDate = regexDate.exec(value)
                                    if (matchDate && matchDate[1] && matchDate[2]) {
                                        const mes = matchDate[1]
                                        const ano = matchDate[2]
                                        for (const m in monthByName) {
                                            if (mes.startsWith(m)) {
                                                return ano + '-' + monthByName[m] + '-01'
                                            }
                                        }
                                    }
                                }
                                return value
                            }
                        },
                        publishedDate: {
                            selector: '.bcaHz',
                            convert: value => {
                                if (value) {
                                    const monthList = Object.keys(monthByName).join('|')
                                    
                                    const regexDate = new RegExp(`(${monthList})\.?\\s+\\w+\\s+(\\d+)$`, 'g')
                                    const matchDate = regexDate.exec(value)
                                    if (matchDate && matchDate[1] && matchDate[2]) {
                                        const mes = matchDate[1]
                                        const ano = matchDate[2]
                                        for (const m in monthByName) {
                                            if (mes.startsWith(m)) {
                                                return ano + '-' + monthByName[m] + '-01'
                                            }
                                        }
                                    }
                
                                    const currentYear = new Date().getFullYear().toString()
                                    const regexDate2 = new RegExp(`(\\d+)\\s+\\w+\\s+(${monthList})\.?$`, 'g')
                                    const matchDate2 = regexDate2.exec(value)
                                    if (matchDate2 && matchDate2[1] && matchDate2[2]) {
                                        const dia = matchDate2[1]
                                        const mes = matchDate2[2]
                                        for (const m in monthByName) {
                                            if (mes.startsWith(m)) {
                                                return currentYear + '-' + monthByName[m] + '-' + ('0'+dia).substring(dia.length-1)
                                            }
                                        }
                                    }
                
                                    if (value.toLowerCase().endsWith('ontem')) {
                                        const currentDate = new Date()
                                        currentDate.setDate(currentDate.getDate()-1)
                                        const day = '0'+currentDate.getDate()
                                        const month = '0'+(currentDate.getMonth()+1)
                                        const year = currentDate.getFullYear()
                                        return year + '-' + month.substring(month.length-2) + '-' + day.substring(day.length-2)
                                    }
                                }
                                return value
                            }
                        },
                        connectionToSubjectMgmtResponse: {
                            selector: '.fKqeL',
                            value: element => {
                                const value = element.textContent
                                const regexName = /,\s+(.+)\s+do\s+estabelecimento/ig
                                const matchName = regexName.exec(value)
                                return matchName && matchName[1] ? matchName[1] : null
                            }
                        },
                        usernameMgmtResponse: {
                            selector: '.fKqeL',
                            value: element => {
                                const value = element.textContent
                                const regexName = /Resposta\s+de\s+(.+)\s+,/ig
                                const matchName = regexName.exec(value)
                                return matchName && matchName[1] ? matchName[1] : null
                            }
                        },
                        publishedDateMgmtResponse: {
                            selector: '.mzAim',
                            value: element => element.getAttribute('title')
                        },
                        textMgmtResponse: {
                            selector: '.eBsXT'
                        },
                        userLocation: {
                            selector: '.ShLyt'
                        },
                        userContributions: {
                            selector: '.ckXjS'
                        },
                        userUrl: {
                            selector: 'a.ui_social_avatar',
                            value: element => element.getAttribute('href')
                        },
                        userPhotoUrl: {
                            selector: 'a.ui_social_avatar img',
                            value: element => element.getAttribute('src')
                        },
                        userDisplayName: {
                            selector: '.ui_header_link'
                        },
                        absoluteUrl: {
                            selector: '[data-test-target="review-title"] > a',
                            value: element => {
                                let url = element.getAttribute('href')
                                if (!url.startsWith('http')) {
                                    url = new URL(url, globalThis.SITE_URL).href
                                }
                                return url
                            }
                        },
                        additionalRatings: {
                            selector: {
                                selector: '.fFwef.S2.H2.cUidx',
                                config: {
                                    rating: {
                                        selector: '.ui_bubble_rating',
                                        value: ratingValue,
                                        convert: value => value ? Number(value) : null
                                    },
                                    ratingLabel: {
                                        selector: 'span',
                                        select: (doc, selector) => {
                                            const list = doc.querySelectorAll(selector)
                                            for (const item of list) {
                                                if (!item.classList || item.classList.length === 0) {
                                                    return item
                                                }
                                            }
                                            return null
                                        }
                                    }
                                }
                            },
                            select: selectArray,
                            value: valueArray
                        }
                    }
                },
                select: selectArray,
                value: valueArray
            },
            amenities: {
                selector: '.bUmsU.f.ME.H3._c',
                select: (doc, selector) => doc.querySelectorAll(selector),
                value: elements => {
                    const values = []
                    for (const element of elements) {
                        if (element.textContent) {
                            values.push({descr: element.textContent})
                        }
                    }
                    return values
                }
            },
            ratings: {
                selector: {
                    selector: '.cmZRz',
                    config: {
                        rating: {
                            selector: '.ui_bubble_rating',
                            value: ratingValue
                        },
                        ratingLabel: {
                            selector: '.bjRcr'
                        }
                    }
                },
                select: selectArray,
                value: valueArray
            }
        }
    },
    select: selectObject,
    value: valueObject
}

function selectObject(doc, selector) {
    
    const item = doc.querySelector(selector.selector)
    const value = {}
    
    if (!item) {
        return null
    }

    for (const field in selector.config) {
        const config = selector.config[field]
        const element = config.select(item, config.selector)

        if (element) {
            value[field] = config.convert(config.value(element))
        } else {
            log.warning('field not found in document: ' + field)
        }
    }
    
    return value
}

function selectArray(doc, selector) {
    
    const elements = doc.querySelectorAll(selector.selector)
    const values = []
    
    for (const item of elements) {
        const value = {}

        for (const field in selector.config) {
            const config = selector.config[field]
            const element = config.select(item, config.selector)

            if (element) {
                value[field] = config.convert(config.value(element))
            } else {
                log.warning('field not found in document: ' + field)
            }
        }

        values.push(value)
    }

    return values
}

function valueArray(element) {
    return element
}

function valueObject(element) {
    return element
}

function select(doc, selector) {
    return doc.querySelector(selector)
}

function value(element) {
    return element.textContent
}

function convert(value) {
    return value
}

function ratingValue(element) {
    if (element.classList) {
        const regexNumber = /bubble_([0-9]+)/g
        for (const className of element.classList) {
            const matchNumber = regexNumber.exec(className)
            if (matchNumber && matchNumber[1]) {
                return (Number(matchNumber[1])/10).toString()
            }
        }
    }
    
    return null
}

async function initialize() {
    await initilizeConfig(config.selector.config)
}

async function initilizeConfig(config) {
    for (const field in config) {
        config[field].select = config[field].select || select
        config[field].value = config[field].value || value
        config[field].convert = config[field].convert || convert

        if (typeof config[field].selector !== 'string') {
            await initilizeConfig(config[field].selector.config)
        }
    }
}

module.exports = {
    page: {
        nextReviewSelector: '.ui_pagination a.ui_button.nav.next.primary'
    },
    config,
    initialize,
    selectObject,
    selectArray
}