import express from 'express';
import Post from '../models/Post.js';

const router = express.Router();

// Ruta para obtener todas las publicaciones
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find().populate('organization').populate('likes');
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Ruta para crear una nueva publicación
router.post('/', async (req, res) => {
    const post = new Post({
        content: req.body.content,
        organization: req.body.organization,
    });

    try {
        const newPost = await post.save();
        res.status(201).json(newPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Ruta para dar "like" a una publicación
router.post('/:id/like', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Publicación no encontrada' });
        }

        if (!post.likes.includes(req.body.userId)) {
            post.likes.push(req.body.userId);
            await post.save();
        }

        res.json(post);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
