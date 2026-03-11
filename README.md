# Email Server

A Node.js email server that combines a custom **SMTP server** for receiving emails with a **REST API** for sending, reading, searching, and managing emails stored in MongoDB Atlas.

---

## Features

- Custom SMTP server on port `2525` that receives emails and stores them in MongoDB
- REST API on port `3000` for sending, fetching, and deleting emails
- Inbox, sent, and search views
- Email stored with `from`, `to`, `subject`, `message`, `folder`, and `date` fields
- Automated endpoint test script (`npm run test:api`)

---

## Tech Stack

| Layer        | Technology                        |
|--------------|-----------------------------------|
| Runtime      | Node.js                           |
| HTTP API     | Express.js                        |
| SMTP Server  | smtp-server                       |
| Mail Parsing | mailparser                        |
| Mail Sending | Nodemailer                        |
| Database     | MongoDB Atlas (via Mongoose)      |
| Config       | dotenv                            |

---

## Project Structure

```
Email_Server/
├── server.js                  # App entry point (API + SMTP startup)
├── db.js                      # MongoDB connection
├── sendMail.js                # Quick manual SMTP send script
├── run-endpoint-tests.js      # Automated API test script
├── test-endpoints.ps1         # PowerShell endpoint test script
├── .env                       # Environment variables (not committed)
├── .gitignore
│
├── smtp/
│   └── smtpServer.js          # SMTP server — receives and stores emails
│
├── models/
│   └── Email.js               # Mongoose schema for emails
│
├── routes/
│   ├── send.js                # POST /send
│   ├── inbox.js               # GET /inbox/:email
│   ├── mail.js                # GET /mail/:id, DELETE /mail/:id
│   ├── sent.js                # GET /sent/:email
│   └── search.js              # GET /search?q=
│
└── controllers/
    └── mailController.js      # Handlers: getInbox, getMailById, deleteMail
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create a `.env` file in the root:

```env
MONGO_URL=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/emailServer?retryWrites=true&w=majority
```

Replace `<username>` and `<password>` with your MongoDB Atlas database user credentials.

> **Note:** If your password contains special characters (`@`, `#`, `%`, etc.), URL-encode them. For example, `@` becomes `%40`.

### 3. Start the server

```bash
node server.js
```

Expected output:

```
🚀 API server running on port 3000
📧 SMTP Email Server running on port 2525
MongoDB Atlas connected
```

---

## API Reference

### POST /send — Send an email

Sends an email via the local SMTP server. The email is received and stored in MongoDB automatically.

**Request**

```
POST http://localhost:3000/send
Content-Type: application/json
```

```json
{
  "from": "alice@test.com",
  "to": "bob@test.com",
  "subject": "Hello",
  "message": "Hi Bob!"
}
```

**Success Response `200`**

```json
{
  "success": true,
  "message": "Email sent successfully",
  "response": "250 OK: message queued",
  "messageId": "<abc123@test.com>"
}
```

**Error Response `400`** — Missing or invalid fields

```json
{
  "success": false,
  "error": "Missing required fields: from, to, subject, message"
}
```

---

### GET /inbox/:email — Get inbox for a recipient

Returns all emails received by the given email address.

**Request**

```
GET http://localhost:3000/inbox/bob@test.com
```

**Response `200`**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "from": "alice@test.com",
      "to": "bob@test.com",
      "subject": "Hello",
      "message": "Hi Bob!",
      "folder": "inbox",
      "date": "2026-03-11T10:00:00.000Z"
    }
  ]
}
```

---

### GET /sent/:email — Get sent emails for a sender

Returns all emails sent from the given email address.

**Request**

```
GET http://localhost:3000/sent/alice@test.com
```

**Response `200`**

```json
[
  {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "from": "alice@test.com",
    "to": "bob@test.com",
    "subject": "Hello",
    "message": "Hi Bob!",
    "folder": "inbox",
    "date": "2026-03-11T10:00:00.000Z"
  }
]
```

---

### GET /mail/:id — Get a specific email by ID

**Request**

```
GET http://localhost:3000/mail/64f1a2b3c4d5e6f7a8b9c0d1
```

**Response `200`**

```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
  "from": "alice@test.com",
  "to": "bob@test.com",
  "subject": "Hello",
  "message": "Hi Bob!",
  "folder": "inbox",
  "date": "2026-03-11T10:00:00.000Z"
}
```

**Response `404`** — ID not found

```json
{
  "message": "Mail not found"
}
```

---

### DELETE /mail/:id — Delete an email by ID

**Request**

```
DELETE http://localhost:3000/mail/64f1a2b3c4d5e6f7a8b9c0d1
```

**Response `200`**

```json
{
  "message": "Email deleted successfully"
}
```

**Response `404`** — ID not found

```json
{
  "message": "Mail not found"
}
```

---

### GET /search?q= — Search emails

Searches all emails where `subject` or `message` contains the query string (case-insensitive).

**Request**

```
GET http://localhost:3000/search?q=hello
```

**Response `200`**

```json
[
  {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "from": "alice@test.com",
    "to": "bob@test.com",
    "subject": "Hello",
    "message": "Hi Bob!",
    "folder": "inbox",
    "date": "2026-03-11T10:00:00.000Z"
  }
]
```

---

## Email Schema

```js
{
  from:    String,
  to:      String,
  subject: String,
  message: String,
  folder:  String,   // "inbox" (default) or "sent"
  date:    Date      // defaults to now
}
```

---

## How Email Flow Works

```
sendMail.js / POST /send
        |
        v
  SMTP Server (port 2525)
        |
        v
  smtpServer.js (parses email)
        |
        v
  MongoDB Atlas (stores in Email collection)
        |
        v
  GET /inbox/:email  →  retrieve stored emails
  GET /mail/:id      →  get one email
  DELETE /mail/:id   →  delete one email
  GET /search?q=     →  search across all emails
```

---

## Running Tests

Make sure `node server.js` is running first, then in a second terminal:

```bash
npm run test:api
```

This runs `run-endpoint-tests.js` which tests:

| Test | Endpoint | What it checks |
|------|----------|----------------|
| 1 | `POST /send` | Email is sent, SMTP returns `250 OK` |
| 2 | `GET /inbox/:email` | Sent email appears in inbox |
| 3 | `GET /mail/:id` | Email retrieved by ID correctly |
| 4 | `DELETE /mail/:id` | Email is deleted, response is success message |
| 5 | `GET /mail/:id` (after delete) | Returns `404` |

Sample output:

```
[PASS] POST /send
[PASS] GET /inbox/:email
[PASS] GET /mail/:id
[PASS] DELETE /mail/:id
[PASS] GET after DELETE - status 404

Summary: 5 passed, 0 failed
```

---

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `EADDRINUSE :::2525` | SMTP server already running | Kill old process or restart terminal |
| `EADDRINUSE :::3000` | API server already running | Kill old process or restart terminal |
| `bad auth: authentication failed` | Wrong Atlas password | Reset password in MongoDB Atlas → Database Access |
| `Password cannot be empty` | Missing `MONGO_URL` or empty password in `.env` | Check your `.env` file |
| `No write concern mode named 'majority;'` | Trailing semicolon in `MONGO_URL` | Remove `;` at end of `MONGO_URL` in `.env` |
| `certificate has expired` | SMTP TLS cert issue | Add `ignoreTLS: true` to Nodemailer transporter config |

---

## Quick Reference

| Task | Command |
|------|---------|
| Start server | `node server.js` |
| Send a quick test email | `node sendMail.js` |
| Run API tests | `npm run test:api` |
| Kill process on port 2525 | `Get-NetTCPConnection -LocalPort 2525 -State Listen \| ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }` |
