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
const books = getDirectories(path.join(wwwbase, '/books'))

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
    content += `<h1>${config.servername}: Book List</h1>`

    // Book list.
    for (var i=0; i<books.length; i++) {
        var bookdir = books[i].split('\\')[books[i].split('\\').length-1]
        content += `- <a class=\"larger\" href=\"${'/book/' + bookdir}\">${bookdir}</a><br>`
    }

    // Footer.
    content += `${config.footer}</body></html>`
    res.send(content)

})

// Configure the books.
var bookinfo = []
app.get('/book/:id', (req, res) => {

    if (fs.existsSync(path.join(wwwbase, `/books/${req.params.id}`))) {
        bookinfo[req.params.id] = require(path.join(wwwbase, `/books/${req.params.id}/info.json`))
        res.sendFile(path.join(wwwbase, `/books/${req.params.id}/${bookinfo[req.params.id].index}`))
    } else {
        res.sendFile(path.join(wwwbase, '/books/invalid.html'))
    }

})

// Start the server.
console.log('Starting the server...')
app.listen(config.port)