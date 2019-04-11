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
console.log('Loading config...')
const config = require(path.join(__dirname, '/config.json'))
const wwwbase = path.join(__dirname, config.wwwbase)
console.log(`Base dir is ${wwwbase}`)

// Prep book list.
console.log('Loading books...')
var bookdirs = getDirectories(path.join(wwwbase, '/books'))
var bookinfo = []
for (var i=0; i<bookdirs.length; i++) {
    var currentbook = bookdirs[i].split('\\')[bookdirs[i].split('\\').length-1]
    bookinfo[currentbook] = require(path.join(bookdirs[i], '/info.json'))
}
console.log(`${bookdirs.length} book(s) found.`)

// Initialize the app.
console.log(`Initializing BookJS server, \"${config.servername}\"...`)
const app = express()

// Configure styles.
app.get('/style', (req, res) => {
    res.sendFile(path.join(wwwbase, '/common.css'))
})

// Configure the index page.
console.log('Configuring the index page...')
app.get('/', (req, res) => res.redirect('/list'))
app.get('/list', (req, res) => {

    // Header.
    var content = `<!DOCTYPE html>${config.header}<html><body>`

    // Title.
    content += `<h1 class=\"title\">${config.servername}: Book List</h1>`

    // Book list.
    for (var i=0; i<bookdirs.length; i++) {
        var currentbook = bookdirs[i].split('\\')[bookdirs[i].split('\\').length-1]
        content += `&bullet; <a class=\"larger\" href=\"${'/book/' + currentbook}\"><strong>${bookinfo[currentbook].author}:</strong> ${bookinfo[currentbook].title}</a><br>`
    }

    // Footer.
    content += `${config.footer}</body></html>`
    res.send(content)

})

// Configure book indeicies.
app.get('/book/:id', (req, res) => {

    if (bookinfo[req.params.id] != undefined) {
        res.sendFile(path.join(wwwbase, `/books/${req.params.id}/${bookinfo[req.params.id].index}`))
    } else {
        res.sendFile(path.join(wwwbase, '/invalid/book.html'))
    }

})

// Configure book pages.
app.get('/book/:id/:pg', (req, res) => {

    if (bookinfo[req.params.id] != undefined) {
        if (bookinfo[req.params.id].pages[req.params.pg-1] != undefined) {
            res.sendFile(path.join(wwwbase, `/books/${req.params.id}/${bookinfo[req.params.id].pages[req.params.pg-1]}`))
        } else {
            res.sendFile(path.join(wwwbase, '/invalid/page.html'))
        }
    } else {
        res.sendFile(path.join(wwwbase, '/invalid/book.html'))
    }

})

// Start the server.
console.log('Starting the server...')
app.listen(config.port)