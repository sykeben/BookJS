# BookJS
*NodeJS Server to host Web Books.*

<br>

## Book Structure
Books are stored in `database/books`. A typical BookJS-formatted book is structured like this:
```
[example]
│   info.json
│   cover.png
└───[pages]
    ├───[intro]
    │   │   page.ejs
    │   └───[content]
    │           author.png
    │           rainbow-text.css
    └───[chapter-1]
            page.ejs
```
- `[example]` is the topmost directory of the book.
- `cover.png` is the book cover in PNG format, if there is none, the server will simply display a placeholder.
- `info.json` is the book info file. For more info on this one, keep reading.
- `[intro]` and `[chapter-1]` are page folders, names and IDs for these folders are are defined in `info.json`.
- `page.ejs` contains the content for each page.
- `[content]` folders are folder used to serve additional content displayed in the book (like images) for each page, and can be referenced by setting an elements source to `content/[filename]`. You can put (almost) anything you like here.

<br>

## Book Info File Format
For the above "example" book, it's `info.json` file is formatted like this:
```javascript
{
    "title": "Example Book",
    "author": "Cool Guy",
    "website": "https://coolguy.example.com",

    "desc": "Super epic example book!",

    "pages": [
        ["Introduction", "intro"],
        ["chapter 1: Hello, World", "chapter-1"]
    ]
}
```
- `title` & `author` are, obviously, the title and author of the book.
- `website` is an optional link to the author's webpage.
- `desc` is a short description of the book, displayed on the page list.
- `pages` is an array of page titles and directory names. Each item in the array must be structured as `["Title", "dir"]`.
Note: All books MUST follow this info format, no matter what.

<br>

## Configuration Options
BookJS is configurable through `server/config.json`.
- `port`: Pretty self-explanitory, tells the webserver which port to run on, which is `80` by default.
- `servername`: This is the name of your BookJS server, which appears in the title of every page. Make sure to change this so your server isn't generic.
- `database`: The directory of all the server data (libraries, books, etc). Changing this allows for the database to be placed elsewhere (for example, an alternate network location).
- `logrequests`: Whether or not valid requests to the server will be logged. This is only intended for debugging.
- `purifypages`: Whether or not to purify the DOM content for book pages. It is highly recommended that this remains set to `true` for security and compatibility.
- `sanitizemetadata`: Whether or not to sanitize book metadata. Once again, it is highly recommended this remains `true`.

<br>

## Security Notes
For those who are concerned about security, here are a couple of my notes:
- BookJS never, ever phones home. Even if I had the money to employ a data collection service, I still would not do that.
- When page purification is enabled (which it should be), [DOMPurify](https://github.com/cure53/DOMPurify) is used to clean and sanitize book page DOMs.
- When metadata sanitation is enabled (which it should be), [sanitize-html](https://github.com/apostrophecms/sanitize-html) is used to sanitize book metadata.
- As of now, HTTPS is not supported or implemented yet. I will be adding it in the near future.

<br>

## Shameless Self-Plug
As these docs may be confusing, I may soon post tutorials on my YouTube channel, [Ben Codes](https://www.youtube.com/channel/UCZ0SO5pj7U3TfCmZqvuAG6Q).