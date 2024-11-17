"use client";

import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useRouter } from 'next/navigation';
import { Heart, Calendar, Clock, MapPin, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const socket = io('http://localhost:3001');

const EventViewComponent = () => {
    const [publications, setPublications] = useState([]);
    const [likedEvents, setLikedEvents] = useState([]);
    const [comments, setComments] = useState({});
    const [newComments, setNewComments] = useState({});
    const router = useRouter();

    const isAuthenticated = () => {
        return localStorage.getItem('authToken');
    };

    const getUserFromToken = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) return null;
        try {
            const res = await fetch(`http://localhost:3001/profile?secret_token=${token}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!res.ok) {
                throw new Error(`Error fetching profile: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();
            console.log('Datos del perfil:', data);
            return data.user; // Asegúrate de que la respuesta tiene los campos del usuario en `user`
        } catch (error) {
            console.error('Error obteniendo el usuario:', error);
            return null;
        }
    };

    useEffect(() => {
        const fetchPublications = async () => {
            try {
                const res = await fetch('http://localhost:3001');
                const data = await res.json();
                setPublications(data);

                // Cargar comentarios para cada publicación
                data.forEach(async (publication) => {
                    const commentsRes = await fetch(`http://localhost:3001/comments/${publication._id}`);
                    const commentsData = await commentsRes.json();
                    setComments(prev => ({ ...prev, [publication._id]: commentsData }));
                });
            } catch (error) {
                console.error('Error fetching publications:', error);
            }
        };

        fetchPublications();

        socket.on('newPublication', (publication) => {
            setPublications((prevPublications) => [publication, ...prevPublications]);
        });

        socket.on('updatePublication', (updatedPublication) => {
            setPublications((prevPublications) =>
                prevPublications.map((publication) =>
                    publication._id === updatedPublication._id ? updatedPublication : publication
                )
            );
        });

        socket.on('newComment', (newComment) => {
            setComments((prevComments) => ({
                ...prevComments,
                [newComment.publication]: [...(prevComments[newComment.publication] || []), newComment]
            }));
        });

        return () => {
            socket.off('newPublication');
            socket.off('updatePublication');
            socket.off('newComment');
        };
    }, []);

    const handleLike = async (eventId) => {
        if (!isAuthenticated()) {
            router.push('/logind'); // Redirige al login si no está autenticado
            return;
        }

        const user = await getUserFromToken();
        if (!user) return;

        socket.emit('likePublication', { publicationId: eventId, userId: user._id });
    };

    const handleCommentChange = (eventId, text) => {
        setNewComments(prev => ({ ...prev, [eventId]: text }));
    };

    const handleCommentSubmit = async (eventId) => {
        if (!isAuthenticated()) {
            router.push('/logind'); // Redirige al login si no está autenticado
            return;
        }

        const user = await getUserFromToken();
        if (!user) return;

        if (newComments[eventId]?.trim()) {
            const newComment = {
                userId: user._id,
                nombre: user.nombre,
                apellido: user.apellido,
                comment: newComments[eventId].trim(),
                publicationId: eventId
            };

            console.log('Nuevo comentario:', newComment); // Agrega este console.log

            socket.emit('addComment', newComment);
            setNewComments(prev => ({ ...prev, [eventId]: '' }));
        }
    };

    return (
        <div className="min-h-screen p-8 bg-gradient-to-br from-[#D8C7A9] to-[#ECE3D4]">
            <h1 className="text-5xl font-bold mb-12 text-center text-[#042637] drop-shadow-lg">
                Eventos de la Comunidad
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {publications.map(event => (
                    <div key={event._id} className="rounded-xl overflow-hidden shadow-lg transform transition duration-300 hover:scale-105" style={{ backgroundColor: '#E1DDBF' }}>
                        <div className="p-4 flex items-center space-x-2 bg-[#042637]">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={event.charity?.avatar || '/placeholder.svg'} alt={event.charity?.nombre || 'Organización'} />
                                <AvatarFallback>{event.charity?.nombre?.charAt(0) || 'O'}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-white">{event.charity?.nombre || 'Organización'}</span>
                        </div>
                        <div className="relative">
                            <img src={`http://localhost:3001${event.imageUrl}`} alt={event.title} className="w-full h-56 object-cover" />
                            <div className="absolute top-0 right-0 bg-[#042637] text-white px-3 py-1 m-2 rounded-full text-sm font-semibold">
                                Nuevo
                            </div>
                        </div>
                        <div className="p-6">
                            <h2 className="text-2xl font-semibold mb-3 text-[#042637]">{event.title}</h2>
                            <p className="text-sm mb-4 text-[#042637] opacity-80">{event.description}</p>
                            <div className="flex items-center mb-2 text-[#042637]">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span className="text-sm">{new Date(event.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center mb-2 text-[#042637]">
                                <Clock className="h-4 w-4 mr-2" />
                                <span className="text-sm">{new Date(event.date).toLocaleTimeString()}</span>
                            </div>
                            <div className="flex items-center mb-4 text-[#042637]">
                                <MapPin className="h-4 w-4 mr-2" />
                                <span className="text-sm">{event.location}</span>
                            </div>
                            <div className="flex items-center mb-4">
                                <button
                                    onClick={() => handleLike(event._id)}
                                    className="flex items-center space-x-1 focus:outline-none transition duration-300 ease-in-out transform hover:scale-110 w-full"
                                    aria-label={`Me gusta (${event.likes ? event.likes.length : 0})`}
                                >
                                    <Heart
                                        className={`h-6 w-6 ${likedEvents.includes(event._id) ? 'fill-current text-red-500' : 'text-[#042637]'}`}
                                    />
                                    <span className="text-[#042637] font-medium">
                                        {event.likes ? event.likes.length : 0}
                                    </span>
                                </button>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-lg font-semibold mb-2 text-[#042637]">Comentarios</h3>
                                <div className="space-y-2 max-h-32 overflow-y-auto mb-2">
                                    {(comments[event._id] || []).map((comment) => (
                                        <div key={comment._id} className="bg-white p-2 rounded-lg">
                                            <span className="font-semibold text-[#042637]">{comment.user.nombre} {comment.user.apellido}: </span>
                                            <span className="text-[#042637]">{comment.comment}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center mt-2">
                                    <Input
                                        type="text"
                                        placeholder="Añade un comentario..."
                                        value={newComments[event._id] || ''}
                                        onChange={(e) => handleCommentChange(event._id, e.target.value)}
                                        className="flex-grow mr-2"
                                    />
                                    <Button
                                        onClick={() => handleCommentSubmit(event._id)}
                                        size="icon"
                                        aria-label="Enviar comentario"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EventViewComponent;