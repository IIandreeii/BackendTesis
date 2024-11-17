import { Server } from 'socket.io';
import Message from '../models/message.js';
import Charity from '../models/charity.js';
import Publication from '../models/publication.js';
import Comment from '../models/comment.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const socketHandlers = (server) => {
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost:3000', // Cambia esto si tu frontend está en otro dominio o puerto
            methods: ['GET', 'POST'],
        },
    });

    io.on('connection', (socket) => {
        console.log('Nueva conexión establecida');

        // Unirse a una sala específica
        socket.on('joinRoom', (chatId) => {
            socket.join(chatId);
            console.log(`Usuario se unió a la sala: ${chatId}`);
        });

        // Escuchar mensajes entrantes
        socket.on('sendMessage', async ({ senderId, receiverId, content, chatId }) => {
            if (!senderId || !receiverId || !content || !chatId) {
                console.error('Faltan campos requeridos para enviar el mensaje');
                return;
            }

            const message = new Message({
                senderId,
                receiverId,
                content,
                chatId,
                createdAt: new Date(),
            });

            try {
                await message.save();
                io.to(chatId).emit('receiveMessage', message);
            } catch (error) {
                console.error('Error al guardar el mensaje:', error);
            }
        });

        // Crear una nueva publicación
        socket.on('createPublication', async (formData, callback) => {
            try {
                const { title, description, date, time, location, organizationId, image } = formData;
                const imageUrl = image ? `/public/imagenes/${image}` : '';

                console.log('Buscando organización con ID:', organizationId);

                const charity = await Charity.findById(organizationId);
                if (!charity) {
                    console.error('Organización no encontrada');
                    callback({ success: false, message: 'Organización no encontrada' });
                    return;
                }

                const publication = new Publication({
                    title,
                    description,
                    date: new Date(`${date}T${time}`),
                    location,
                    imageUrl,
                    charity: charity._id,
                });

                await publication.save();
                io.emit('newPublication', publication);
                callback({ success: true, message: 'Publicación creada con éxito' });
            } catch (error) {
                console.error('Error al crear la publicación:', error);
                callback({ success: false, message: 'Error al crear la publicación' });
            }
        });

        // Subir imagen
        socket.on('uploadImage', async ({ image, imageName }) => {
            try {
                const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                const imagePath = path.join(__dirname, '..', 'public', 'imagenes', imageName);

                fs.writeFile(imagePath, buffer, (err) => {
                    if (err) {
                        console.error('Error al guardar la imagen:', err);
                        return;
                    }
                    console.log('Imagen guardada con éxito');
                });
            } catch (error) {
                console.error('Error al subir la imagen:', error);
            }
        });

        // Dar like a una publicación
        socket.on('likePublication', async (publicationId) => {
            try {
                const publication = await Publication.findById(publicationId);
                if (publication) {
                    publication.likes += 1;
                    await publication.save();
                    io.emit('updatePublication', publication);
                }
            } catch (error) {
                console.error('Error al dar like a la publicación:', error);
            }
        });

        // Agregar un comentario a una publicación
        socket.on('addComment', async ({ publicationId, userId, comment }) => {
            try {
                const publication = await Publication.findById(publicationId);
                if (publication) {
                    const newComment = new Comment({
                        user: userId,
                        publication: publicationId,
                        comment,
                    });

                    await newComment.save();
                    io.emit('newComment', newComment);
                }
            } catch (error) {
                console.error('Error al agregar el comentario:', error);
            }
        });

        // Dejar una sala específica
        socket.on('leaveRoom', (chatId) => {
            socket.leave(chatId);
            console.log(`Usuario salió de la sala: ${chatId}`);
        });
    });
};

export default socketHandlers;
