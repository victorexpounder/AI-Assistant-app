'use client'
import React, { useEffect, useState } from 'react'
import './Chat.scss'
import axios from 'axios'
import dotenv from 'dotenv'

interface Message {
    tag: string;
    message: string;
}

const Chat = () => {
    
    const [chatData, setChatData] = useState<Message[]>([])
    const [message, setMessage] : any = useState()
    const [loading, setLoading] : any = useState<boolean>(false)
   
    const options = {
        method: "POST",
        url: "https://api.edenai.run/v2/text/chat",
        headers: {
          authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
        },
        data: {
          providers: "openai/gpt-3.5-turbo-0125",
          text: message,
          chatbot_global_action: "Act as an assistant",
          previous_history: [],
          temperature: 0.0,
          max_tokens: 150,
          fallback_providers: "",
        },
      };
    
      const sendMessage = async () => {
        const newMessage = {
            tag: "You",
            message: message
        };
        
        // Update chatData with the new user message
        const newData = [...chatData, newMessage];
        setChatData(newData);
    
        try {
            setLoading(true);
            const response = await axios.request(options);
            const data = response.data;
            const generatedText = data['openai/gpt-3.5-turbo-0125'].generated_text;
            
            // Update chatData with the AI message
            const aiMessage = {
                tag: "Chat",
                message: generatedText
            };
            // Use the previous state to ensure newData is included
            setChatData(prevChatData => [...prevChatData, aiMessage]);
            
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };
    

  return (
    <div className='chatCon'>
        <div className="chat">
            <div className="chatbox">
            {chatData?.map((chat, index)=>(
                <div className="messageBox" key={index}>
                    <h1> {chat.tag} </h1>
                    <p> {chat.message} </p>
                    
                </div>
            ))}
            {loading &&
                <p>loading....</p>
            }
            </div>
            <div className="inputCon">
                <div className="inputbox">
                    <textarea 
                    className='input' 
                    placeholder='Ask ChatMu' 
                    draggable={false} 
                    rows={1} 
                    value={message}
                    onChange={(e)=> setMessage(e.target.value)}
                    />
                    <button onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Chat
