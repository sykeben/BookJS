// BookJS Server Core
// "It all starts here."

// Library import(s).
const express = require('express')
const path = require('path')
const fs = require('fs')

// Directory listing functions.
const isDirectory = source => fs.lstatSync(source).isDirectory()
const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory)

// Configuration.
const config = require(path.join(__dirname, '/config.json'))
const wwwbase = path.join(__dirname, config.wwwbase)
console.log(`Base dir is ${wwwbase}.`)

// Prep book list.
var bookdirs = getDirectories(path.join(wwwbase, '/books'))
var bookinfo = []
for (var i=0; i<bookdirs.length; i++) {
    var currentbook = bookdirs[i].split('\\')[bookdirs[i].split('\\').length-1]
    bookinfo[currentbook] = require(path.join(bookdirs[i], '/info.json'))
}
console.log(`${bookdirs.length} book(s) found.`)

// Initialize the app.
const app = express()
app.set('view engine', 'ejs')

// Configure styles.
app.get('/style', (req, res) => {
    res.sendFile(path.join(wwwbase, '/common.css'))
})

// Configure the index page.
app.get('/', (req, res) => res.redirect('/list'))
app.get('/list', (req, res) => {

    // Init.
    let content = ''

    // Book list.
    for (var i=0; i<bookdirs.length; i++) {
        var currentbook = bookdirs[i].split('\\')[bookdirs[i].split('\\').length-1]
        content += `<li><a class=\"larger text-body\" href=\"${'/book/' + currentbook}\">${bookinfo[currentbook].title}, <span class="font-italic">${bookinfo[currentbook].author}</span></a></li>`
    }

    // Load it up!
    res.render(path.join(wwwbase, '/booklist'), { title: config.servername, books: content })

})

// Configure book indeicies.
app.get('/book/:id', (req, res) => {

    // Init.
    let content = ''

    if (bookinfo[req.params.id] != undefined) {

        // Page list.
        for (var i=0; i<bookinfo[req.params.id].pages.length; i++) {
            content += `<li><a class=\"larger text-body\" href=\"${'/book/' + req.params.id + '/' + (i+1).toString()}\">${bookinfo[req.params.id].pages[i][0]}</a></li>`
        }

        // Send it!
        res.render(path.join(wwwbase, '/pagelist'), { title: config.servername, book: bookinfo[req.params.id].title, author: bookinfo[req.params.id].author, pages: content })

    } else {
        res.render(path.join(wwwbase, '/invalid'), { title: config.servername, type: 'book', message: 'This book does not exist or has been moved.' })
    }

})

// Configure book pages.
app.get('/book/:id/:pg', (req, res) => {

    if (bookinfo[req.params.id] != undefined) {
        if (bookinfo[req.params.id].pages[req.params.pg-1] != undefined) {
            res.render(path.join(wwwbase, '/bookpage'), { title: config.servername, book: bookinfo[req.params.id].title, page: bookinfo[req.params.id].pages[req.params.pg-1][0], content: path.join(wwwbase, `/books/${req.params.id}/${bookinfo[req.params.id].pages[req.params.pg-1][1]}`) })
        } else {
            res.render(path.join(wwwbase, '/invalid'), { title: config.servername, type: 'page', message: 'This page does not exist or has been moved.' })
        }
    } else {
        res.render(path.join(wwwbase, '/invalid'), { title: config.servername, type: 'book', message: 'This book does not exist or has been moved.' })
    }

})

// Start the server.
app.listen(config.port, () => console.log(`Server ready on port ${config.port}.`))