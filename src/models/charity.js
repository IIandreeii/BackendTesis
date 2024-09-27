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
  userType: { type: String, required: true}
}, {
  timestamps: true
});

CharitySchema.pre("save", async function(next) {

const hash = await bcrypt.hash(this.password, 10);
this.password = hash;
next();
});


CharitySchema.methods.isValidPassword = async function(password) {
    const charity = this;
    const compare = await bcrypt.compare(password, charity.password);
    return compare;
};

export default mongoose.model("Charity", CharitySchema);