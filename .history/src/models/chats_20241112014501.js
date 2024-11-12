import mongoose from 'mongoose';

const { Schema } = mongoose;

const chatSchema = new Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId, 
    refPath: 'participants.type',  // Indica que el tipo de referencia dependerá del campo `type`
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'  // Referencia al último mensaje
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
  },
  participantsType: {  // Añadir este campo para almacenar los tipos de los participantes
    type: [String],  // Puede ser 'User' o 'Charity'
    required: true
  }
});

const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

export default Chat;
