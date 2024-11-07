import mongoose from 'mongoose';

const { Schema } = mongoose;

const DonationSchema = new Schema({
  charityId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Charity', 
    required: true 
  },
  donorName: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  paymentId: { 
    type: String, 
    required: true, 
    unique: true // Asegura que cada ID de pago sea único
  },
  paymentStatus: { 
    type: String, 
    required: true 
  },
  paymentMethod: { 
    type: String, 
    required: true 
  },
  paymentDate: { 
    type: Date, 
    default: Date.now 
  },
  cardLastFourDigits: { 
    type: String 
  }, // Opcional para almacenar los últimos 4 dígitos del número de tarjeta
  currency: { 
    type: String, 
    default: 'PEN' // Cambiar según la moneda predeterminada
  },
}, {
  timestamps: true
});

export default mongoose.model("Donation", DonationSchema);