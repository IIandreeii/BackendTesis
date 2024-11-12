'use client'

import React, { useState, useEffect } from 'react'
import { Search, MoreHorizontal, Edit, Settings, Phone, Video, ThumbsUp, Smile, Paperclip, Image, Send, ArrowLeft } from 'lucide-react'
import io from 'socket.io-client'

const socket = io('http://localhost:3001')

export function FbMessengerImproved({ user }) {
  const [activeChat, setActiveChat] = useState(null)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [chatPreviews, setChatPreviews] = useState([])
  const [showChatList, setShowChatList] = useState(true)

  useEffect(() => {
    // Fetch initial chat previews
    const fetchChatPreviews = async () => {
      try {
        const res = await fetch(`http://localhost:3001/chats?userId=${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        if (!res.ok) {
          throw new Error(`Error fetching chats: ${res.status} ${res.statusText}`)
        }
        const data = await res.json()
        setChatPreviews(data)
      } catch (error) {
        console.error('Error:', error)
      }
    }

    fetchChatPreviews()
  }, [user.id])

  useEffect(() => {
    if (activeChat) {
      // Unirse a la sala específica del usuario
      socket.emit('joinRoom', activeChat.id)

      // Fetch initial messages for the active chat
      const fetchMessages = async () => {
        try {
          const res = await fetch(`http://localhost:3001/messages?receiverId=${activeChat.id}&senderId=${user.id}`)
          if (!res.ok) {
            throw new Error(`Error fetching messages: ${res.status} ${res.statusText}`)
          }
          const data = await res.json()
          setMessages(data)
        } catch (error) {
          console.error('Error:', error)
        }
      }

      fetchMessages()

      // Escuchar mensajes recibidos
      const handleReceiveMessage = (message) => {
        setMessages((prevMessages) => [...prevMessages, message])
      }
      socket.on('receiveMessage', handleReceiveMessage)

      // Limpiar el evento cuando el componente se desmonta
      return () => {
        socket.emit('leaveRoom', activeChat.id)
        socket.off('receiveMessage', handleReceiveMessage)
      }
    }
  }, [activeChat, user.id])

  const handleSend = () => {
    if (message.trim()) {
      const newMessage = {
        senderId: user.id,
        receiverId: activeChat.id,
        text: message,
      }
      socket.emit('sendMessage', newMessage)
      setMessages([...messages, newMessage])
      setMessage('')
    }
  }

  const toggleChatList = () => {
    setShowChatList(!showChatList)
  }

  return (
    <div className="flex h-screen bg-[#ECE3D4]">
      {/* Lista de chats */}
      <div className={`w-full md:w-[320px] lg:w-[360px] border-r border-[#D8C7A9] flex flex-col ${showChatList ? 'block' : 'hidden md:block'}`}>
        <div className="p-4 bg-[#D8C7A9]">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-[#042637]">Chats</h1>
            <div className="flex space-x-2">
              <button className="text-[#042637] hover:bg-[#E1DDBF] p-2 rounded-full transition-colors">
                <MoreHorizontal size={20} />
                <span className="sr-only">Más opciones</span>
              </button>
              <button className="text-[#042637] hover:bg-[#E1DDBF] p-2 rounded-full transition-colors">
                <Edit size={20} />
                <span className="sr-only">Nuevo mensaje</span>
              </button>
            </div>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar en Messenger"
              className="w-full p-2 pl-8 bg-[#E1DDBF] rounded-full text-[#042637] placeholder-[#042637]/50 focus:outline-none"
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#042637]/50" size={18} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chatPreviews.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center p-3 cursor-pointer transition-colors ${
                activeChat && activeChat.id === chat.id ? 'bg-[#D8C7A9]' : 'hover:bg-[#E1DDBF]'
              }`}
              onClick={() => {
                setActiveChat(chat)
                if (window.innerWidth < 768) {
                  setShowChatList(false)
                }
              }}
            >
              <div className="relative mr-3">
                <img src={chat.avatar} alt="" className="w-12 h-12 rounded-full" />
                {chat.isActive && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#ECE3D4]"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h2 className="font-semibold text-[#042637] truncate">{chat.name}</h2>
                  <span className="text-xs text-[#042637]/70 ml-2 flex-shrink-0">{chat.time}</span>
                </div>
                <p className="text-sm text-[#042637]/70 truncate">{chat.lastMessage}</p>
              </div>
              {chat.unread > 0 && (
                <div className="bg-[#042637] text-[#ECE3D4] rounded-full w-5 h-5 flex items-center justify-center text-xs ml-2 flex-shrink-0">
                  {chat.unread}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Ventana de chat activa */}
      <div className={`flex-1 flex flex-col ${!showChatList ? 'block' : 'hidden md:block'}`}>
        <div className="p-4 bg-[#D8C7A9] flex justify-between items-center border-b border-[#E1DDBF]">
          <div className="flex items-center">
            <button className="md:hidden mr-2 text-[#042637]" onClick={toggleChatList}>
              <ArrowLeft size={20} />
              <span className="sr-only">Volver a la lista de chats</span>
            </button>
            {activeChat && <img src={activeChat.avatar} alt="" className="w-10 h-10 rounded-full mr-3" />}
            <div>
              {activeChat && <h2 className="font-semibold text-[#042637]">{activeChat.name}</h2>}
              <p className="text-xs text-[#042637]/70">Activo ahora</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="text-[#042637] hover:bg-[#E1DDBF] p-2 rounded-full transition-colors">
              <Phone size={20} />
              <span className="sr-only">Llamada de voz</span>
            </button>
            <button className="text-[#042637] hover:bg-[#E1DDBF] p-2 rounded-full transition-colors">
              <Video size={20} />
              <span className="sr-only">Videollamada</span>
            </button>
            <button className="text-[#042637] hover:bg-[#E1DDBF] p-2 rounded-full transition-colors">
              <Settings size={20} />
              <span className="sr-only">Configuración</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-[#ECE3D4]">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`max-w-[70%] p-3 rounded-lg ${
                msg.senderId === user.id ? 'ml-auto bg-[#ECE3D4]' : 'bg-[#E1DDBF]'
              }`}
            >
              <p className="text-[#042637]">{msg.text}</p>
            </div>
          ))}
          <div className="text-center text-[#042637]/50 mb-4">Inicio de la conversación</div>
        </div>
        <div className="p-4 bg-[#D8C7A9] border-t border-[#E1DDBF]">
          <div className="flex items-center bg-[#E1DDBF] rounded-full">
            <button className="text-[#042637] p-2 rounded-full hover:bg-[#ECE3D4] transition-colors">
              <Smile size={20} />
              <span className="sr-only">Emojis</span>
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Aa"
              className="flex-1 bg-transparent px-4 py-2 focus:outline-none text-[#042637]"
            />
            <div className="flex space-x-2 mr-2">
              <button className="text-[#042637] p-2 rounded-full hover:bg-[#ECE3D4] transition-colors">
                <Paperclip size={20} />
                <span className="sr-only">Adjuntar archivo</span>
              </button>
              <button className="text-[#042637] p-2 rounded-full hover:bg-[#ECE3D4] transition-colors">
                <Image size={20} />
                <span className="sr-only">Adjuntar imagen</span>
              </button>
              <button className="text-[#042637] p-2 rounded-full hover:bg-[#ECE3D4] transition-colors">
                <ThumbsUp size={20} />
                <span className="sr-only">Me gusta</span>
              </button>
            </div>
            <button
              className={`p-2 rounded-full transition-colors ${
                message.trim() ? 'bg-[#042637] text-[#ECE3D4] hover:bg-[#042637]/80' : 'text-[#042637]/50 cursor-not-allowed'
              }`}
              onClick={handleSend}
              disabled={!message.trim()}
            >
              <Send size={20} />
              <span className="sr-only">Enviar mensaje</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}