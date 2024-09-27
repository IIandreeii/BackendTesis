import express from 'express'
const router = express.Router();


router.get('/',(req, res)=>{
    res.send('<h1>Esto es la pagina principal </h1>')
});


export default router;