# BookJS
*NodeJS Server to host Web Books.*

<br>

## Book Format
A typical BookJS-formatted book is structured like this:
```
[example]
|   cover.png
|   info.json
|   page-1.ejs
|   page-2.ejs
|
└── [content]
        cool-pic-1.png
        cool-pic-2.png
        example-code.html
```
- `[example]` is the topmost directory of the book.
- `cover.png` is the book cover in PNG format, if there is none, the server will simply display a placeholder.
- `info.json` is the book info file. For more info on this one, keep reading.
- `page_1.ejs` and `page_2.ejs` are page files (in [EJS](https://www.ejs.co/) format), which are defined in `info.json`.
- `[content]` is a folder used to serve content displayed in the book (like images), and can be referenced by setting an elements source to `content/[filename]`. You can put anything you like here.

<br>

## Book Info File Format
For the above "example" book, it's `info.json` file is formatted like this:
```json
{
    "title": "Example Book",
    "author": "Cool Guy",
    "website": "https://coolguy.example.com",

    "desc": "Super epic example book!",

    "pages": [
        ["Page 1: The Beginning", "page-1"],
        ["Page 2: The End", "page-2"]
    ]
}
```
- `title` & `author` are, obviously, the title and author of the book.
- `website` is an optional link to the author's webpage.
- `desc` is a short description of the book, displayed on the page list.
- `pages` is an array of page titles and filenames. Each item in the array must be structured as `["Title", "file"]`.

<br>

## Live Demo
To showcase the portability and multi-platform features of BookJS, there is a live demo running on Heroku at [bookjs.herokuapp.com](https://bookjs.herokuapp.com/).

<br>

## Important Note
As these docs may be confusing, I may soon post tutorials on my YouTube channel, [Ben Codes](https://www.youtube.com/channel/UCZ0SO5pj7U3TfCmZqvuAG6Q).