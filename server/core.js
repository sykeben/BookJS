// BookJS Server Core
// "It all starts here."

// Library import(s).
const express = require('express')
const path = require('path')
const fs = require('fs')
const slash = require('slash')

// Check if running on Heroku
if (process.env.isHeroku == 'true') {
    console.log('Running on Heroku, config will be automatically adjusted.')
}

// Directory listing functions.
const isDirectory = source => fs.lstatSync(source).isDirectory()
const getDirectories = source => fs.readdirSync(source).map(name => slash(path.join(source, name))).filter(isDirectory)

// Configuration.
const config = require(path.join(__dirname, '/config.json'))
const database = slash(path.join(__dirname, config.database))
console.log(`Base dir is ${database}.`)

// Initialize the app.
const app = express()
app.set('view engine', 'ejs')

// Configure styles.
app.get('/libraries/:id/:part', (req, res) => {
    res.sendFile(path.join(database, `libraries/${req.params.id}/library.${req.params.part}`))
})

// Prep book list.
var bookdirs = getDirectories(path.join(database, '/books'))
var bookinfo = []
for (var i=0; i<bookdirs.length; i++) {
    var currentbook = bookdirs[i].split('/')[bookdirs[i].split('/').length-1]
    bookinfo[currentbook] = require(path.join(bookdirs[i], '/info.json'))
}
console.log(`${bookdirs.length} book(s) found.`)

// Configure the index page.
app.get('/', (req, res) => res.redirect('/list'))
app.get('/list', (req, res) => {

    // Init.
    let content = ''

    // Book list.
    for (var i=0; i<bookdirs.length; i++) {
        var currentbook = bookdirs[i].split('/')[bookdirs[i].split('/').length-1]
        if ((i%4) == 0 && (i != 0)) content += '</div>'
        if ( ((i%4)==0) || (i==0) ) content += '<div class="row mb-5">'
        content += '<div class="col-3 text-center">'
        content += `<a class=\"larger text-body\" href=\"${'/book/' + currentbook}\">`
        content += `<img class=\"img-fluid\" src=\"/book/${currentbook}/cover\"><br>`
        content += `${bookinfo[currentbook].title}, <span class="font-italic">${bookinfo[currentbook].author}</span>`
        content += '</a>'
        content += '</div>'
        if (i == bookdirs.length-1) content += '</div>'
    }

    // Load it up!
    res.render(path.join(database, '/booklist'), {
        title: config.servername,
        books: content
    })

})

// Configure book indeicies.
app.get('/book/:id', (req, res) => {

    // Init.
    let content = ''

    if (bookinfo[req.params.id] != undefined) {

        // Page list.
        for (var i=0; i<bookinfo[req.params.id].pages.length; i++) {
            content += `<li>`
            content += `<a class=\"larger text-body\" href=\"${'/book/' + req.params.id + '/' + (i+1).toString()}\">`
            content += `${bookinfo[req.params.id].pages[i][0]}`
            content += '</a>'
            content += '</li>'
        }

        // Send it!
        res.render(path.join(database, '/pagelist'), {
            title: config.servername, book: bookinfo[req.params.id].title,
            author: bookinfo[req.params.id].author,
            website: bookinfo[req.params.id].website,
            cover: `/book/${req.params.id}/cover`,
            desc: bookinfo[req.params.id].desc,
            pages: content
        })

    } else {
        res.render(path.join(database, '/invalid'), {
            title: config.servername,
            type: 'book',
            message: 'This book does not exist or has been moved.'
        })
    }

})

// Configure book content.
app.get('/book/:id/content/:file', function(req, res) {

    if (bookinfo[req.params.id] != undefined) {

        if (fs.existsSync(path.join(database, `/books/${req.params.id}/content/${req.params.file}`))) {

            res.sendFile(path.join(database, `/books/${req.params.id}/content/${req.params.file}`))

        } else {
            res.render(path.join(database, '/invalid'), {
                title: config.servername,
                type: 'book',
                message: 'This book does not exist or has been moved.'
            })
        }

    } else {
        res.render(path.join(database, '/invalid'), {
            title: config.servername,
            type: 'resource',
            message: 'This file does not exist or has been moved.'
        })
    }

})

// Configure book covers.
app.get('/book/:id/cover', (req, res) => {

    if (bookinfo[req.params.id] != undefined) {

        if (fs.existsSync(path.join(database, `/books/${req.params.id}/cover.png`))) {
            res.sendFile(path.join(database, `/books/${req.params.id}/cover.png`))
        } else {
            res.sendFile(path.join(database, 'nocover.png'))
        }

    } else {
        res.render(path.join(database, '/invalid'), {
            title: config.servername,
            type: 'book',
            message: 'This book does not exist or has been moved.'
        })
    }

})

// Configure book pages.
app.get('/book/:id/:pg', (req, res) => {

    if (bookinfo[req.params.id] != undefined) {

        if (bookinfo[req.params.id].pages[req.params.pg-1] != undefined) {

            var prev_link = '#'; var prev_class = ''
            if (bookinfo[req.params.id].pages[req.params.pg-2] != undefined) {
                prev_link = `/book/${req.params.id}/${parseInt(req.params.pg)-1}`
            } else {
                prev_class = 'disabled'
            }

            var next_link = '#'; var next_class = ''
            if (bookinfo[req.params.id].pages[req.params.pg] != undefined) {
                next_link = `/book/${req.params.id}/${parseInt(req.params.pg)+1}`
            } else {
                next_class = 'disabled'
            }

            res.render(path.join(database, '/bookpage'), {
                back: '/book/' + req.params.id,
                title: config.servername,
                book: bookinfo[req.params.id].title,
                page: bookinfo[req.params.id].pages[req.params.pg-1][0],
                cover: `/book/${req.params.id}/cover`,
                content: path.join(database, `/books/${req.params.id}/${bookinfo[req.params.id].pages[req.params.pg-1][1]}`),
                prev_link: prev_link, prev_class: prev_class,
                next_link: next_link, next_class: next_class
            })

        } else {
            res.render(path.join(database, '/invalid'), {
                title: config.servername,
                type: 'page',
                message: 'This page does not exist or has been moved.'
            })
        }
    } else {
        res.render(path.join(database, '/invalid'), {
            title: config.servername,
            type: 'book',
            message: 'This book does not exist or has been moved.'
        })
    }

})

// Start the server.
if (process.env.isHeroku == 'true') {
    app.listen(process.env.PORT, () => console.log(`Server ready on port ${process.env.PORT}.`))
} else {
    app.listen(config.port, () => console.log(`Server ready on port ${config.port}.`))
}