// BookJS Server Core
// "It all starts here."

// Library import(s).
const express = require('express')
const ejs = require('ejs')
const path = require('path')
const fs = require('fs')
const slash = require('slash')
const createDOMPurify = require('dompurify')
const { JSDOM } = require('jsdom')
const sanitizeHTML = require('sanitize-html')

// Check if running on Heroku
if (process.env.isHeroku == 'true') {
    logMsg('init\t ::\t running on Heroku, config will be automatically adjusted')
}

// Directory listing functions.
const isDirectory = source => fs.lstatSync(source).isDirectory()
const getDirectories = source => fs.readdirSync(source).map(name => slash(path.join(source, name))).filter(isDirectory)

// Configuration.
const config = require(path.join(__dirname, '/config.json'))
const database = slash(path.join(__dirname, config.database))
const logRequests = config.logrequests
const purifyPages = config.purifypages
const sanitizeMetadata = config.sanitizemetadata
logMsg(`init\t ::\t database directory is ${database}`)

// Set up page purification (loaded even if disabled, just in case).
const window = new JSDOM('').window
const DOMPurify = createDOMPurify(window)
if (purifyPages) {
    logMsg('init\t ::\t page purification is enabled')
} else {
    logMsg('init\t ::\t PAGE PURIFICATION IS DISABLED! THIS MAY BE UNSAFE, CONTINUE AT YOUR OWN RISK')
}

// Set up metadata sanitization (loaded even if disabled, just in case).
function doSanitizeMetadata(dirtyMeta) {
    return sanitizeHTML(dirtyMeta, {
        allowedTags: [],
        allowedAttributes: {}
    })
}
if (sanitizeMetadata) {
    logMsg('init\t ::\t metadata sanitization is enabled')
} else {
    logMsg('init\t ::\t METADATA SANITIZATION IS DISABLED! THIS MAY BE UNSAFE, CONTINUE AT YOUR OWN RISK')
}

// Logger scripts.
function logReq(req, loc) { // Request.
    if (logRequests) {
        let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
        if (ip == '::ffff:127.0.0.1' | ip == '127.0.0.1' | ip == '::1') ip = 'localhost'
        console.log(`[${ip}]\t ${loc}`)
    }
}
function logMsg(msg) { // Server message.
    if (logRequests) msg = '<server>\t ' + msg
    console.log(msg)
}

// Initialize the app.
const app = express()
app.set('view engine', 'ejs')

// Configure web libraries.
app.get('/libraries/:id/:part', (req, res) => {
    if (req.params.part.substr(req.params.part.length - 4) == '.map') { // No debugging allowed!
        res.status(410).send('410')
    } else { // That's better.
        logReq(req, `lib\t ::\t ${req.params.id} > ${req.params.part}`)
        res.sendFile(path.join(database, `/libraries/${req.params.id}/library.${req.params.part}`))
    }
})

// Prep book list.
var bookdirs = getDirectories(path.join(database, '/books'))
var bookinfo = []
for (var i=0; i<bookdirs.length; i++) {

    // Get current book info.
    var currentbook = bookdirs[i].split('/')[bookdirs[i].split('/').length-1]
    bookinfo[currentbook] = require(path.join(bookdirs[i], '/info.json'))

    // Sanaitize it (yes, this looks clunky but it's better to do it now than every time it's loaded).
    bookinfo[currentbook].title = doSanitizeMetadata(bookinfo[currentbook].title)
    bookinfo[currentbook].author = doSanitizeMetadata(bookinfo[currentbook].author)
    bookinfo[currentbook].website = doSanitizeMetadata(bookinfo[currentbook].website)
    bookinfo[currentbook].desc = doSanitizeMetadata(bookinfo[currentbook].desc)
    for (var j=0; j<bookinfo[currentbook].pages.length; j++) {
        bookinfo[currentbook].pages[j][0] = doSanitizeMetadata(bookinfo[currentbook].pages[j][0])
        bookinfo[currentbook].pages[j][1] = doSanitizeMetadata(bookinfo[currentbook].pages[j][1])
    }

}
logMsg(`init\t ::\t ${bookdirs.length} book(s) found`)

// Configure the index page.
app.get('/', (req, res) => res.redirect('/list'))
app.get('/list', (req, res) => {

    // Init.
    let content = ''
    logReq(req, 'list\t ::\t booklist')

    // Book list.
    for (var i=0; i<bookdirs.length; i++) {
        var currentbook = bookdirs[i].split('/')[bookdirs[i].split('/').length-1]
        if ((i%4) == 0 && (i != 0)) content += '</div>'
        if ( ((i%4)==0) || (i==0) ) content += '<div class="row mb-5">'
        content += '<div class="col-3 text-center">'
        content += `<a class=\"larger text-body\" href=\"/book/${currentbook}/index\">`
        content += `<img class=\"img-fluid\" src=\"/book/${currentbook}/cover\"><br>`
        content += `${bookinfo[currentbook].title}, <span class="font-italic">${bookinfo[currentbook].author}</span>`
        content += '</a>'
        content += '</div>'
        if (i == bookdirs.length-1) content += '</div>'
    }

    // Load it up!
    res.render(path.join(database, '/templates/booklist'), {
        title: config.servername,
        books: content
    })

})

// Configure book indeicies.
app.get('/book/:id', (req, res) => { res.redirect(`/book/${req.params.id}/index`) })
app.get('/book/:id/index', (req, res) => {

    // Init.
    let content = ''
    logReq(req, `book\t ::\t ${req.params.id} > index`)

    if (bookinfo[req.params.id] != undefined) {

        // Page list.
        for (var i=0; i<bookinfo[req.params.id].pages.length; i++) {
            content += `<li>`
            content += `<a class=\"larger text-body\" href=\"/book/${req.params.id}/page/${(i+1).toString()}/view\">`
            content += `${bookinfo[req.params.id].pages[i][0]}`
            content += '</a>'
            content += '</li>'
        }

        // Send it!
        res.render(path.join(database, '/templates/pagelist'), {
            title: config.servername, book: bookinfo[req.params.id].title,
            author: bookinfo[req.params.id].author,
            website: bookinfo[req.params.id].website,
            cover: `/book/${req.params.id}/cover`,
            desc: bookinfo[req.params.id].desc,
            pages: content
        })

    } else {
        res.render(path.join(database, '/templates/invalid'), {
            title: config.servername,
            type: 'book',
            message: 'This book does not exist or has been moved.'
        })
    }

})

// Configure book content.
app.get('/book/:id/page/:pg/content/:file', function(req, res) {

    logReq(req, `book\t ::\t ${req.params.id} > page > ${req.params.pg}\t ::\t content > ${req.params.file}`)

    if (bookinfo[req.params.id] != undefined) {

        if (fs.existsSync(path.join(database, `/books/${req.params.id}/pages/${bookinfo[req.params.id].pages[req.params.pg-1][1]}/content/${req.params.file}`))) {

            res.sendFile(path.join(database, `/books/${req.params.id}/pages/${bookinfo[req.params.id].pages[req.params.pg-1][1]}/content/${req.params.file}`))

        } else {
            res.render(path.join(database, '/templates/invalid'), {
                title: config.servername,
                type: 'book',
                message: 'This book does not exist or has been moved.'
            })
        }

    } else {
        res.render(path.join(database, '/templates/invalid'), {
            title: config.servername,
            type: 'resource',
            message: 'This file does not exist or has been moved.'
        })
    }

})

// Configure book covers.
app.get('/book/:id/cover', (req, res) => {

    logReq(req, `book\t ::\t ${req.params.id} > cover`)

    if (bookinfo[req.params.id] != undefined) {

        if (fs.existsSync(path.join(database, `/books/${req.params.id}/cover.png`))) {
            res.sendFile(path.join(database, `/books/${req.params.id}/cover.png`))
        } else {
            res.sendFile(path.join(database, '/nocover.png'))
        }

    } else {
        res.render(path.join(database, '/templates/invalid'), {
            title: config.servername,
            type: 'book',
            message: 'This book does not exist or has been moved.'
        })
    }

})

// Configure book pages.
app.get('/book/:id/page/:pg', (req, res) => res.redirect(`/book/${req.params.id}/page/${req.params.pg}/view`))
app.get('/book/:id/page/:pg/view', (req, res) => {

    logReq(req, `book :: ${req.params.id} > page > ${req.params.pg}`)

    if (bookinfo[req.params.id] != undefined) {

        if (bookinfo[req.params.id].pages[req.params.pg-1] != undefined) {
            
            // Previous page link.
            var prev_link = '#'; var prev_class = ''
            if (bookinfo[req.params.id].pages[req.params.pg-2] != undefined) {
                prev_link = `/book/${req.params.id}/page/${parseInt(req.params.pg)-1}/view`
            } else {
                prev_class = 'disabled'
            }

            // Next page link.
            var next_link = '#'; var next_class = ''
            if (bookinfo[req.params.id].pages[req.params.pg] != undefined) {
                next_link = `/book/${req.params.id}/page/${parseInt(req.params.pg)+1}/view`
            } else {
                next_class = 'disabled'
            }

            // Serve page.
            ejs.renderFile(path.join(database, `/books/${req.params.id}/pages/${bookinfo[req.params.id].pages[req.params.pg-1][1]}/page.ejs`), (err, str) => {

                // Purify.
                if (purifyPages) {
                    str = DOMPurify.sanitize(str)
                }
    
                // Render it up!
                res.render(path.join(database, '/templates/bookpage'), {
                    back: `/book/${req.params.id}/index`,
                    title: config.servername,
                    book: bookinfo[req.params.id].title,
                    page: bookinfo[req.params.id].pages[req.params.pg-1][0],
                    cover: `/book/${req.params.id}/cover`,
                    content: str,
                    prev_link: prev_link, prev_class: prev_class,
                    next_link: next_link, next_class: next_class
                })

            })

        } else {
            res.render(path.join(database, '/templates/invalid'), {
                title: config.servername,
                type: 'page',
                message: 'This page does not exist or has been moved.'
            })
        }
    } else {
        res.render(path.join(database, '/templates/invalid'), {
            title: config.servername,
            type: 'book',
            message: 'This book does not exist or has been moved.'
        })
    }

})

// Configure other 404 page.
app.use((req, res) => {
    res.status(404).render(path.join(database, '/templates/invalid'), {
        title: config.servername,
        type: 'URL',
        message: 'A 404 error occured while trying to serve this URL.'
    })
})

// Start the server.
if (process.env.isHeroku == 'true') {
    app.listen(process.env.PORT, () => logMsg(`init\t ::\t server ready on port ${process.env.PORT}`))
} else {
    app.listen(config.port, () => logMsg(`init\t ::\t server ready on port ${config.port}`))
}