// const crypto = require('crypto')

const socketIO = require('socket.io')
// const socketIOAuth = require('socketio-auth')
const uuidv4 = require('uuid/v4')
const debug = require('debug')('svelte-realtime:server')
const cookie = require('cookie')
const cookieParser = require('cookie-parser')

const DEFAULT_NAMESPACE = '/svelte-realtime'

const {SESSION_SECRET} = process.env
if (!SESSION_SECRET) throw new Error('Must set SESSION_SECRET environment variable')

function getServer(server, adapters, sessionStore, namespace = DEFAULT_NAMESPACE) {
  const io = socketIO(server)
  const nsp = io.of(namespace)

  nsp.use((socket, next) => {
    const rawCookies = socket.request.headers.cookie
    const parsedCookies = cookie.parse(rawCookies)
    const sessionID = cookieParser.signedCookie(parsedCookies.sessionID, SESSION_SECRET)
    debug('SOCKET.IO MIDDLEWARE CALLED.  sessionID: %O', sessionID)
    if (sessionID) {  // TODO: Look up in sessionStore if this is valid
      return next()
    } else {
      return next(new Error('not authorized'))
    }
  })
  
  nsp.on('connect', (socket) => {
  // function postAuthenticate(socket, user) {  // TODO: How do we get the user into this function?
    debug('postAuthenticate() called. ')
    // socket.on('disconnect', () => {})  // Since we're storing everything in the nsp's socket or room, we shouldn't need any additional cleanup

    socket.on('join', (stores) => {  // TODO: Check access control before joining
      debug('join msg received.  stores: %O', stores)
      for (const {storeID, value} of stores) {
        socket.join(storeID)
        const room = nsp.adapter.rooms[storeID]
        if (room) {  // There should always be a room but better safe
          const cachedValue = room.cachedValue
          if (cachedValue) {
            socket.emit('set', storeID, cachedValue)  // This sends only the originator
          } else {
            room.cachedValue = value
            // TODO: Think about switching below for efficiency. It's not done that way for now to be extra safe and because I wasn't sure when there are multiple stores on the same page that it would work
            // socket.to(storeID).emit('set', storeID, value)  // This sends to all clients except the originating client
            nsp.in(storeID).emit('set', storeID, value)  // This sends to all clients including the originator
          }
        } else {
          throw new Error('Unexpected condition. There should be one but there is no room for storeID: ' + storeID)
        }
      }
    })

    socket.on('set', (storeID, value, forceEmitBack) => {
      debug('set msg received. storeID: %s  value: %O', storeID, value)
      const session = true  // TODO: Make this be a function of the middleware
      if (session) {
        let room = nsp.adapter.rooms[storeID]
        if (!room) {
          socket.join(storeID)
          room = nsp.adapter.rooms[storeID]
        }
        if (room) {  // There should always be a room now but better safe
          room.cachedValue = value
        } else {
          throw new Error('Unexpected condition. There should be one but there is no room for storeID: ' + storeID)
        }
        if (forceEmitBack) {
          nsp.in(storeID).emit('set', storeID, value)  // This sends to all clients including the originator
        } else {
          socket.to(storeID).emit('set', storeID, value)  // This sends to all clients except the originating client
        }
      } else {
        const room = nsp.adapter.rooms[storeID]
        if (room && room.cachedValue) {
          socket.emit('revert', storeID, room.cachedValue)
        }
        socket.disconnect()
      }
    })

    socket.on('initialize', (storeID, defaultValue, callback) => {
      debug('initialize msg received.  storeID: %s  defaultValue: %O', storeID, defaultValue)
      const session = true  // TODO: Make this a function of the middleware
      if (session) {
        const room = nsp.adapter.rooms[storeID]
        if (room && room.cachedValue) {
          callback(room.cachedValue)
        } else {
          callback(defaultValue)
        }
      } else {
        callback(defaultValue)
        socket.disconnect()
      }
    })

  })

  return nsp
}

module.exports = {getServer}  // TODO: Eventually change this to export once supported
