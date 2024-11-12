import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  participants: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',  // Referencia al modelo de 'User', los participantes del chat
    required: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',  // Referencia al último mensaje
  },
  unreadMessages: {
    type: Map,
    of: Number,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now  // Fecha de creación del chat
  },
  updatedAt: {
    type: Date,
    default: Date.now  // Fecha de la última actualización
  }
});

// Asegura que el modelo no sea redefinido si ya existe
const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

export default Chat;