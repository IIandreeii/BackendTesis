import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const { Schema } = mongoose;

const CharitySchema = new Schema({
  nombre: {
    type: String,
    required: true
  },
  descripcion: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  direccion: {
    type: String,
    required: true,
  },
  telefono: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  userType: { 
    type: String, 
    required: true 
  },
  accessToken: {
    type: String,
    required: false 
  },
  refreshToken: {  // Campo para almacenar el refresh_token
    type: String,
    required: false 
  },
  tokenExpiration: { // Campo para almacenar el tiempo de expiración
    type: Number,
    required: false 
  }
}, {
  timestamps: true
});

// Hash de la contraseña antes de guardar
CharitySchema.pre("save", async function(next) {
  if (this.isModified('password')) { // Solo hacer hash si la contraseña ha sido modificada
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
  }
  next();
});

// Método para validar la contraseña
CharitySchema.methods.isValidPassword = async function(password) {
  const charity = this;
  const compare = await bcrypt.compare(password, charity.password);
  return compare;
};

// Método para actualizar tokens
CharitySchema.methods.updateTokens = async function(accessToken, refreshToken, expirationTime) {
  this.accessToken = accessToken;
  this.refreshToken = refreshToken;
  this.tokenExpiration = expirationTime; // Establecer tiempo de expiración
  await this.save(); // Guardar los cambios
};

// Método para obtener tokens desencriptados (aquí puedes agregar lógica de desencriptación)
CharitySchema.methods.getDecryptedTokens = function() {
  return {
    accessToken: this.accessToken, // Aquí puedes desencriptar si es necesario
    refreshToken: this.refreshToken // Aquí puedes desencriptar si es necesario
  };
};

export default mongoose.model("Charity", CharitySchema);
