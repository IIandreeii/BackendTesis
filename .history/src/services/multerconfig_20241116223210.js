// FILE: src/config/multerConfig.js
import multer = require('multer');
import path from 'path';

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '..', 'public', 'imagenes'));
    },
    filename: function(req, file, cb) {
        cb(null, `image${Date.now()}.${file.mimetype.split('/')[1]}`);
    }
});

const upload = multer({ storage });
export default upload;