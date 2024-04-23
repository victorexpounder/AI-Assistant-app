'use client'
import React, { useEffect, useRef, useState } from 'react'
import './Chat.scss'
import axios from 'axios'
import dotenv from 'dotenv'
import SendIcon from '@mui/icons-material/Send';
import KeyboardVoiceIcon from '@mui/icons-material/KeyboardVoice';
import Recorder from 'recorder-js';
import { Button, Dialog, DialogActions, Skeleton } from '@mui/material'


interface Message {
    tag: string;
    message: string;
}

const Chat = () => {
    
    const [chatData, setChatData] = useState<Message[]>([])
    const [message, setMessage]  = useState<any>()
    const [loading, setLoading] = useState<boolean>(false)
    const [openDialog, setOpenDialog] = useState<boolean>(false)
    const [recording, setRecording]  = useState<boolean>(false)
    const [transcribing, settranscribing] = useState<boolean>(false)
    const [audioRecorder, setAudioRecorder] = useState<Recorder | null>(null);
    const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
    const [transcribedText, setTranscribedText] = useState<string>('');
    // Reference to the media stream to release it later
    const mediaStreamRef = useRef<MediaStream | null>(null);

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

    
    
    
    const sendMessage = async (passedMessage: string | null) => {
        console.log(process.env.NEXT_PUBLIC_API_KEY);
        const newMessage = {
            tag: "You",
            message: passedMessage? passedMessage : message
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


    const startRecording = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioContext = new (window.AudioContext)();
          const recorder = new Recorder(audioContext);
    
          await recorder.init(stream);
          await recorder.start();
          setRecording(true)

          // Store the media stream in the ref
            mediaStreamRef.current = stream;
    
          setAudioRecorder(recorder);
        } catch (error) {
          console.error('Error accessing microphone:', error);
        }
      };
    
    
    
      const stopRecording = async () => {
        if (audioRecorder) {
          await audioRecorder.stop();
          
          setRecording(false)
          // Release the media stream
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => {
                track.stop();
                });
            }
        }
    };

    const sendRecording = async () => {
        if (audioRecorder) {
            
            await audioRecorder.stop().then(async ({ blob }) => {
                
                
                // Release the media stream
                if (mediaStreamRef.current) {
                    mediaStreamRef.current.getTracks().forEach(track => {
                        track.stop();
                    });
                }
                setRecording(false);

                
    
                const formData = new FormData();
                formData.append("providers", "openai");
                formData.append('file', blob); // Append the audio blob to FormData
                formData.append("language", "en");
                formData.append("convert_to_wav", "true");
    
                const toTextoptions = {
                    method: "POST",
                    url: "https://api.edenai.run/v2/audio/speech_to_text_async",
                    headers: {
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
                        'Content-Type': 'multipart/form-data', // Set content type to multipart form data
                    },
                    data: formData, // Pass FormData as the data
                    params: {
                        providers: "revai,voci",
                        language: "en",
                    },
                };
    
                try {
                    settranscribing(true);
                    const res = await axios.request(toTextoptions);
                    setMessage(res.data.results.openai.text) 
                    settranscribing(false);
                    sendMessage(res.data.results.openai.text)
                    setOpenDialog(false);
                    
                } catch (error) {
                    console.log(error);
                    settranscribing(false);
                    setOpenDialog(false);
                }
            });
        }
    };
    
    

  return (
    <div className='chatCon'>
        <div className="chat">
            <div className={`chatbox ${chatData.length < 1? 'center' : ''}`}>
            {chatData?.map((chat, index)=>(
                <div className="messageBox" key={index}>
                    <h1> {chat.tag} </h1>
                    <p> {chat.message} </p>
                    
                </div>
            ))}

            {chatData.length < 1?
                
                <h1>Ask Anything You Want Answers To</h1>
                :
                ''
            }

            {loading &&
                <Skeleton variant="text" sx={{ fontSize: '3rem' }} animation="wave" />
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
                    <button className='voice' onClick={()=>{startRecording();setOpenDialog(true)}}> <KeyboardVoiceIcon /> </button>
                    <button onClick={()=>message? sendMessage(null) : ''} className={`send ${message? 'active' : ''}`} > <SendIcon /> </button>
                </div>
            </div>
        </div>

        <Dialog open={openDialog} onClose={()=> setOpenDialog(false)} >
            <div className="recordingCon" style={{padding: 20, width: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
                <h1 style={{fontSize: 30}}>
                    {recording? 
                     "Recording...."    
                        :
                    transcribing?
                        "Transcribing"
                        :
                        ''
                    }
                </h1>
                <button onClick={sendRecording} style={{backgroundColor: "#191322", padding: 10, borderRadius: 50, color: "#fff"}}> <SendIcon/> </button>
            </div>

            <DialogActions>
                <Button onClick={()=>{stopRecording(); setOpenDialog(false)}}>Cancel</Button>
            </DialogActions>
        </Dialog>
    </div>
  )
}

export default Chat
