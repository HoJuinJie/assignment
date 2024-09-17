const express = require('express');
const cookieParser = require('cookie-parser');
const { createConnection, createRootAdmin } = require('./database');
const auth = require('./routes/auth');
const cors = require('cors'); // Cross-Origin Resource Sharing (CORS)
const app = express();
const port = 3000;

// Setup CORS - refer to notes below
app.use(
    cors({
      origin: `http://localhost:5173`,
      credentials: true
    })
  );

// Setup body parser - refer to notes below 
app.use(express.json())

// Set cookie parser - refer to notes below
app.use(cookieParser());

// Routing
app.use('/api/v1/auth', auth);

// Connecting to database
createConnection()
console.log('db connected')
createRootAdmin();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


/*
TODO: NOTES
?CORS Cross-Origin Resource Sharing
the browser enforces CORS policies to ensure security. If the server does not explicitly allow the request from the origin of the frontend, the browser will block it.
origin: 'http://localhost:5173'
This specifies that only requests from http://localhost:5173 are allowed.
credentials: true
This allows cookies and HTTP authentication to be sent with cross-origin requests

?cookie parser
app.use(cookieParser()); 
middleware to parse incoming JSON payloads from HTTP request bodies i.e Make JSON data sent in POST, PUT or PATCH request available under req.body

?body parser
app.use(express.json())
middleware allows app to parse and access cookies that are sent by client in request i.e parses the cookie header from incoming HTTP request and makes the cookies available via req.cookies
*/