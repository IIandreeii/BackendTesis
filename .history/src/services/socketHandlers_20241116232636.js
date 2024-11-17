// FILE: src/services/socketHandlers.js
import { Server } from 'socket.io';
import Message from '../models/message.js';
import { time } from 'console';
import { title } from 'process';
import Charity from '../models/charity.js';
import Publication from '../models/publication.js';

const socketHandlers = (server) => {
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost:3000',
        }
    });

    io.on('connection', (socket) => {
        console.log('new connection');

        // Unirse a una sala específica
        socket.on('joinRoom', (chatId) => {
            socket.join(chatId);
            console.log(`User joined room ${chatId}`);
        });

        // Escuchar mensajes entrantes
        socket.on('sendMessage', async ({ senderId, receiverId, content, chatId }) => {
            if (!senderId || !receiverId || !content || !chatId) {
                console.error('Missing required fields');
                return;
            }

            const message = new Message({
                senderId,
                receiverId,
                content,
                chatId,
                createdAt: new Date()
            });

            try {
                await message.save();
                io.to(chatId).emit('receiveMessage', message);
            } catch (error) {
                console.error('Error saving message:', error);
            }
        });
// publicaciones
        // Crear una nueva publicación
        socket.on('createPublication', async (formData, callback) => {
            try {
                const { title, description, date, time, location, organizationId, image } = formData;
                const imageUrl = image ? `/public/imagenes/${image}` : '';

                const charity = await Charity.findById(organizationId);
                
                if (!charity) {
                    console.error('Organization not found');
                    callback({ success: false, message: 'Organization not found' });
                    return;
                }

                const publication = new Publication({
                    title,
                    description,
                    date: new Date(`${date}T${time}`),
                    location,
                    imageUrl,
                    charity: charity._id
                });

                await publication.save();
                io.emit('newPublication', publication);
                callback({ success: true, message: 'Publication created successfully' });
            } catch (error) {
                console.error('Error creating publication:', error);
                callback({ success: false, message: 'Error creating publication' });
            }
        });

        // Subir imagen
        socket.on('uploadImage', async ({ image, imageName }) => {
            try {
                const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');
                const imagePath = path.join(__dirname, '..', 'public', 'imagenes', imageName);

                fs.writeFile(imagePath, buffer, (err) => {
                    if (err) {
                        console.error('Error saving image:', err);
                        return;
                    }
                    console.log('Image saved successfully');
                });
            } catch (error) {
                console.error('Error uploading image:', error);
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
                console.error('Error liking publication:', error);
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
                        comment
                    });

                    await newComment.save();
                    io.emit('newComment', newComment);
                }
            } catch (error) {
                console.error('Error adding comment:', error);
            }
        });
        // Dejar una sala específica
        socket.on('leaveRoom', (chatId) => {
            socket.leave(chatId);
            console.log(`User left room ${chatId}`);
        });
    });
};




export default socketHandlers;