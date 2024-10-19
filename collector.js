#!/usr/bin/env node

import express from 'express'
import { XMLParser } from 'fast-xml-parser'

const app = express()
const listenPort = 8008
const parser = new XMLParser({
  ignoreAttributes: false
});

var collection = {
  created: new Date,
  lastUpdate: null,
  lastRead: null,
  hosts: {}
}

app.use(express.static('client'))
app.use(express.text({ type: 'text/xml' }))

app.post('/collector', (req, res) => {
  let datetime = new Date()
  let client = req.socket.remoteAddress
  let body = parser.parse(req.body)

  console.debug(datetime, "Host check-in from:", client)
  console.debug("Auth header:", req.header('Authorization'))
  console.debug("Content-type:", req.header('Content-Type'))
  console.debug("Content-length:", req.header('Content-Length'))

  collection.lastUpdate = datetime
  if (!collection['hosts'][client]) {
  console.debug("Creating new record for host:", client)
    collection['hosts'][client] = {
      created: new Date()
    }
  }
  collection.hosts[client]['lastUpdate'] = datetime
  collection.hosts[client]['monit'] = body.monit

  res.sendStatus(200)
})

app.get('/collector', (req, res) => {
  collection.lastRead = new Date()
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(collection))
})

app.get("/collector/:host", (req, res) => {
  let host = req.params.host

  if (!collection.hosts[host]) {
    res.sendStatus(404)
  }
  else {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(collection.hosts[host]))
  }
})

app.get("/collector/:host/services", (req, res) => {
  let host = req.params.host

  if (!collection.hosts[host]) {
    res.sendStatus(404)
  }
  else {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(collection.hosts[host].monit.services))
  }
})

app.get("/collector/:host/services/service/:svc", (req, res) => {
  let host = req.params.host
  let svc = req.params.svc

  if (!collection.hosts[host]) {
    res.sendStatus(404)
  }
  else {
    let result = collection.hosts[host].monit.services.service.filter(obj => {
      return obj["@_name"] == svc
    })
    if (result.length == 0) {
      res.sendStatus(404)
    }
    else {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(result[0]))
    }
  }
})

app.get("/collector/:host/services/service/:svc/status", (req, res) => {
  let host = req.params.host
  let svc = req.params.svc

  if (!collection.hosts[host]) {
    res.sendStatus(404)
  }
  else {
    let result = collection.hosts[host].monit.services.service.filter(obj => {
      return obj["@_name"] == svc
    })
    if (result.length == 0) {
      res.sendStatus(404)
    }
    else {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(result[0].status))
    }
  }
})

app.listen(listenPort, '0.0.0.0', () => {
  console.log(`Monit collector listening on port: ${listenPort}`)
})
