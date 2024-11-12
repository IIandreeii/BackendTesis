import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',  // Referencia al usuario que envió el mensaje
    required: true
  },
  content: {
    type: String,
    required: true  // El contenido del mensaje
  },
  createdAt: {
    type: Date,
    default: Date.now  // Fecha en que se envió el mensaje
  },
});

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

export default Message;
