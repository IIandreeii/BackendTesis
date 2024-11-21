import { Server } from 'socket.io';
import Message from '../models/message.js';
import Charity from '../models/charity.js';
import Publication from '../models/publication.js';
import Comment from '../models/comment.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/user.js';

// Obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const socketHandlers = (server) => {
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost:3000', 
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

                const charity = await Charity.findById(organizationId);
                if (!charity) {
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
        socket.on('likePublication', async ({ publicationId, userId, charityId }) => {
            try {
                const publication = await Publication.findById(publicationId);
                if (publication) {
                    if (!publication.likes) {
                        publication.likes = [];
                    }
                    const likeIndex = publication.likes.findIndex(like => like.user?.toString() === userId || like.charity?.toString() === charityId);
                    if (likeIndex === -1) {
                        // Si el usuario o la organización no ha dado like, agregar su ID al array de likes
                        publication.likes.push({ user: userId, charity: charityId });
                    } else {
                       
                        publication.likes.splice(likeIndex, 1);
                    }
                    await publication.save();
                    io.emit('updatePublication', publication);
                }
            } catch (error) {
                console.error('Error al dar like a la publicación:', error);
            }
        });


        socket.on('deletePublication', async ({ publicationId, userId }, callback) => {
            try {
                const publication = await Publication.findById(publicationId);
                if (!publication) {
                    callback({ success: false, message: 'Publicación no encontrada' });
                    return;
                }
        
                // Verificar si el usuario tiene permiso para eliminar la publicación
                if (publication.user.toString() !== userId) {
                    callback({ success: false, message: 'No tienes permiso para eliminar esta publicación' });
                    return;
                }
        
                await publication.remove();
                io.emit('deletePublication', publicationId);
                callback({ success: true, message: 'Publicación eliminada con éxito' });
            } catch (error) {
                console.error('Error al eliminar la publicación:', error);
                callback({ success: false, message: 'Error al eliminar la publicación' });
            }
        });



        socket.on('editPublication', async ({ publicationId, formData }, callback) => {
            try {
                const { title, description, date, time, location, image } = formData;
                const imageUrl = image ? `/public/imagenes/${image}` : '';
        
                const publication = await Publication.findById(publicationId);
                if (!publication) {
                    callback({ success: false, message: 'Publicación no encontrada' });
                    return;
                }
        
                // Actualizar los campos de la publicación
                publication.title = title || publication.title;
                publication.description = description || publication.description;
                publication.date = new Date(`${date}T${time}`) || publication.date;
                publication.location = location || publication.location;
                publication.imageUrl = imageUrl || publication.imageUrl;
        
                await publication.save();
                io.emit('updatePublication', publication);
                callback({ success: true, message: 'Publicación editada con éxito' });
            } catch (error) {
                console.error('Error al editar la publicación:', error);
                callback({ success: false, message: 'Error al editar la publicación' });
            }
        });
        

        socket.on('addComment', async ({ publicationId, userId, comment }) => {
            try {
                if (!userId) {
                    throw new Error('El ID del usuario o de la organización es obligatorio.');
                }
    
                // Verificar si el ID pertenece a un usuario o a una organización
                let user = await User.findById(userId);
                let charity = null;
    
                if (!user) {
                    charity = await Charity.findById(userId);
                }
    
                if (!user && !charity) {
                    throw new Error('El ID proporcionado no pertenece a un usuario ni a una organización.');
                }
    
                const publication = await Publication.findById(publicationId);
                if (publication) {
                    let newComment = new Comment({
                        user: user ? userId : undefined,
                        charity: charity ? userId : undefined,
                        publication: publicationId,
                        comment,
                    });
    
                    await newComment.save();
                    if (user) {
                        newComment = await newComment.populate('user', 'nombre apellido');
                    }
                    if (charity) {
                        newComment = await newComment.populate('charity', 'nombre');
                    }
    
                    publication.comments.push(newComment._id);
                    await publication.save();
                    io.emit('newComment', newComment);
                }
            } catch (error) {
                console.error('Error al agregar el comentario:', error);
            }
        });

        socket.on('leaveRoom', (chatId) => {
            socket.leave(chatId);
            console.log(`Usuario salió de la sala: ${chatId}`);
        });
    });
};

export default socketHandlers;
