const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const path = require('path')
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))

app.get('/', (req, res) => {
  // res.setHeader('Content-Type', 'text/html');
  // res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
  socket.on('location', (data) => {
    io.emit('location', data);
  })
  // socket.on('video-call', (roomId, userId) => {
  //   socket.join(roomId);
  //   socket.to(roomId).broadcast.emit('app-connected', userId);

  //   socket.on('disconnect', () => {
  //     socket.to(roomId).broadcast.emit('user-disconnected', userId)
  //   })
  // })
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('someone-connected', roomId);

    socket.on('call_initiate', (offer) => {
      socket.to(roomId).emit('someone_called', offer);
    }) 

    socket.on('add-candidate', (candidate) => {
      socket.to(roomId).emit('candidate-added', candidate);
    });
    socket.on('answer-call', (answer) => {
      socket.to(roomId).emit('answer_call', answer);
    });
  })
  socket.on('create-room', () => {
    socket.emit('room-created', uuidv4());
  })
})

server.listen(port)