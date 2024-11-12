import { io } from 'socket.io-client';
import axios from 'axios';

const socket = io('http://localhost:3002');

// Unirse a una sala
const userId = 'user123';
const organizationId = 'org456';
socket.emit('joinRoom', { userId, organizationId });

// Enviar un mensaje
const sendMessage = (message) => {
    socket.emit('sendMessage', { userId, organizationId, message });
};

// Recibir un mensaje
socket.on('receiveMessage', ({ userId, organizationId, message }) => {
    console.log(`Mensaje recibido de ${userId} a ${organizationId}: ${message}`);
});

// Obtener publicaciones
const getPosts = async () => {
    try {
        const response = await axios.get('http://localhost:3002/posts');
        return response.data;
    } catch (error) {
        console.error('Error al obtener publicaciones:', error);
    }
};

// Crear una nueva publicación
const createPost = async (content, organizationId) => {
    try {
        const response = await axios.post('http://localhost:3002/posts', {
            content,
            organization: organizationId,
        });
        return response.data;
    } catch (error) {
        console.error('Error al crear publicación:', error);
    }
};

// Dar "like" a una publicación
const likePost = async (postId, userId) => {
    try {
        const response = await axios.post(`http://localhost:3002/posts/${postId}/like`, {
            userId,
        });
        return response.data;
    } catch (error) {
        console.error('Error al dar like a la publicación:', error);
    }
};

// Ejemplo de uso
(async () => {
    const posts = await getPosts();
    console.log('Publicaciones:', posts);

    const newPost = await createPost('Nueva publicación de prueba', organizationId);
    console.log('Nueva publicación:', newPost);

    const likedPost = await likePost(newPost._id, userId);
    console.log('Publicación con like:', likedPost);

    // Enviar un mensaje de prueba
    sendMessage('Hola, organización!');
})();
