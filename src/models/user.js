import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const { Schema } = mongoose;

const UserSchema = new Schema({
  nombre: {
    type: String,
    required: true
  },
  apellido: {
    type: String,
    required: true
  },
  dni: {
    type: String,
    required: true,
    unique: true
  },
  email: {
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

UserSchema.pre("save", async function(next) {

const hash = await bcrypt.hash(this.password, 10);
this.password = hash;
next();
});


UserSchema.methods.isValidPassword = async function(password) {
    const user = this;
    const compare = await bcrypt.compare(password, user.password);
    return compare;
};

export default mongoose.model("User", UserSchema);














