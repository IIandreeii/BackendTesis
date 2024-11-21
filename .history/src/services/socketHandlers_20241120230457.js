"use client";

import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { useRouter } from "next/navigation";
import { Heart, Calendar, Clock, MapPin, Send, Edit, Trash } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EventForm from "@/components/component/event-form"; // Importación correcta

const socket = io("http://localhost:3001");

const EventViewComponent = () => {
  const [publications, setPublications] = useState([]);
  const [likedEvents, setLikedEvents] = useState([]);
  const [comments, setComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [editingPublication, setEditingPublication] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const commentsEndRef = useRef(null);

  const isAuthenticated = () => {
    return localStorage.getItem("authToken");
  };

  const getUserFromToken = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return null;
    try {
      const res = await fetch(
        `http://localhost:3001/profile?secret_token=${token}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        throw new Error(
          `Error fetching profile: ${res.status} ${res.statusText}`
        );
      }
      const data = await res.json();
      setUser(data.user || data.charity);
      return data.user || data.charity;
    } catch (error) {
      console.error("Error obteniendo el usuario:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchUserAndPublications = async () => {
      try {
        const user = await getUserFromToken();
        if (user) {
          setUser(user);
          console.log("Usuario obtenido:", user);
        }

        const res = await fetch("http://localhost:3001");
        if (!res.ok) throw new Error("Error al obtener publicaciones");
        const data = await res.json();
        setPublications(data);

        // Cargar comentarios para cada publicación
        const commentsData = await Promise.all(
          data.map(async (publication) => {
            const commentsRes = await fetch(
              `http://localhost:3001/comments/${publication._id}`
            );
            if (!commentsRes.ok)
              throw new Error("Error al obtener comentarios");
            return commentsRes.json();
          })
        );

        const commentsMap = data.reduce((acc, publication, index) => {
          acc[publication._id] = commentsData[index];
          return acc;
        }, {});
        setComments(commentsMap);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };

    fetchUserAndPublications();

    socket.on("newPublication", (publication) => {
      setPublications((prevPublications) => [publication, ...prevPublications]);
    });

    socket.on("updatePublication", (updatedPublication) => {
      setPublications((prevPublications) =>
        prevPublications.map((publication) =>
          publication._id === updatedPublication._id
            ? { ...publication, ...updatedPublication, charity: publication.charity }
            : publication
        )
      );
    });

    socket.on("deletePublication", (publicationId) => {
      setPublications((prevPublications) =>
        prevPublications.filter(
          (publication) => publication._id !== publicationId
        )
      );
    });

    socket.on("newComment", (newComment) => {
      setComments((prevComments) => ({
        ...prevComments,
        [newComment.publication]: [
          ...(prevComments[newComment.publication] || []),
          newComment,
        ],
      }));
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });

    return () => {
      socket.off("newPublication");
      socket.off("updatePublication");
      socket.off("deletePublication");
      socket.off("newComment");
    };
  }, []);

  const handleLike = async (eventId) => {
    if (!isAuthenticated()) {
      router.push("/logind");
      return;
    }

    const user = await getUserFromToken();
    if (!user) return;

    socket.emit("likePublication", {
      publicationId: eventId,
      userId: user._id,
      charityId: user.charityId,
    });
  };

  const handleCommentChange = (eventId, text) => {
    setNewComments((prev) => ({ ...prev, [eventId]: text }));
  };

  const handleCommentSubmit = async (eventId) => {
    if (!isAuthenticated()) {
      router.push("/logind");
      return;
    }

    const user = await getUserFromToken();
    if (!user) return;

    if (newComments[eventId]?.trim()) {
      const newComment = {
        userId: user.id,
        charityId: user.charity_Id,
        nombre: user.nombre,
        apellido: user.apellido,
        comment: newComments[eventId].trim(),
        publicationId: eventId,
      };
      socket.emit("addComment", newComment);
      setNewComments((prev) => ({ ...prev, [eventId]: "" }));
    }
  };

  const handleEditClick = (publication) => {
    setEditingPublication(publication);
  };

  const handleDeleteClick = async (publicationId) => {
    const user = await getUserFromToken();
    if (!user) return;

    socket.emit("deletePublication", { publicationId, userId: user._id });
  };

  const handleEditSubmit = (formData) => {
    const user = getUserFromToken();
    if (!user) return;

    socket.emit("editPublication", {
      publicationId: editingPublication._id,
      formData,
    });
    setEditingPublication(null);
  };

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  if (editingPublication) {
    return (
      <EventForm
        initialData={editingPublication}
        onSubmit={handleEditSubmit}
        onCancel={() => setEditingPublication(null)}
      />
    );
  }

  return (
    <div className="min-h-full p-4 bg-gradient-to-br from-[#D8C7A9] to-[#ECE3D4]">
      <h1 className="text-5xl font-bold mb-12 text-center text-[#042637] drop-shadow-lg">
        Eventos de la Comunidad
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {publications.map((event) => (
          <div
            key={event._id}
            className="rounded-xl overflow-hidden shadow-lg transform transition duration-300 hover:scale-105"
            style={{ backgroundColor: "#E1DDBF" }}
          >
            <div className="p-4 flex items-center space-x-2 bg-[#042637]">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={
                    event.charity?.avatar || "https://via.placeholder.com/150"
                  }
                  alt={event.charity?.nombre || "Organización"}
                />
                <AvatarFallback>
                  {event.charity?.nombre?.charAt(0) || "O"}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-[#D8C7A9]">
                {event.charity?.nombre || "Organización"}
              </span>
            </div>
            <div className="relative">
              <img
                src={`http://localhost:3001${event.imageUrl}`}
                alt={event.title}
                className="w-full h-56 object-cover"
              />
              <div className="absolute top-0 right-0 bg-[#042637] text-white px-3 py-1 m-2 rounded-full text-sm font-semibold">
                Nuevo
              </div>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-semibold mb-3 text-[#042637]">
                {event.title}
              </h2>
              <p className="text-sm mb-4 text-[#042637] opacity-80">
                {event.description}
              </p>
              <div className="flex items-center mb-2 text-[#042637]">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  {new Date(event.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center mb-2 text-[#042637]">
                <Clock className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  {new Date(event.date).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center mb-4 text-[#042637]">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="text-sm">{event.location}</span>
              </div>
              <Button
                className="w-full mb-2"
                onClick={() => handleLike(event._id)}
              >
                <Heart className="mr-2" />
                Me gusta
              </Button>
              <Button
                className="w-full mb-2"
                variant="secondary"
                onClick={() => handleEditClick(event)}
              >
                <Edit className="mr-2" />
                Editar
              </Button>
              <Button
                className="w-full"
                variant="destructive"
                onClick={() => handleDeleteClick(event._id)}
              >
                <Trash className="mr-2" />
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventViewComponent;
