import React, { useEffect, useRef, useState } from 'react'
// import Client from '../componates/Client'
import Edtior from '../componates/Edtior'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client'
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Avatar from 'react-avatar';

// import { useWebRTC } from '../RTC/useWebRTC';

const Edtiorpage = () => {

    const [clients, setclients] = useState([]);


    const location = useLocation();
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const reactNavigate = useNavigate();
    const params = useParams();


    const audioElement = useRef({});
    audioElement.current = {}
    const connections = useRef({});
    const localMediaStream = useRef(null);

    const [joined, setjoined] = useState(false);


    useEffect(() => {
        socketRef.current = io(process.env.REACT_APP_BACKEND_URL, {
            reconnectionAttempts: 'Infinity',
            timeout: 10000,
            transports: ['websocket']
        })

        if (params.roomId !== '/') {
            socketRef.current.emit(ACTIONS.JOIN, { roomId: params.roomId, userId: location.state.userId, username: location.state.username })
        }

        return () => {
            socketRef.current.disconnect();
        }

    }, [location, params.roomId])



    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.CREATED, async ({ clients }) => {

                setjoined(true)
                toast.success('room is created')
                setclients(clients)

                try {
                    localMediaStream.current = await navigator.mediaDevices.getUserMedia({
                        audio: true
                    })
                    // console.log('media stream', localMediaStream.current)
                    const localElement = audioElement.current[location.state.userId];
                    if (localElement) {
                        localElement.volume = 0;
                        localElement.srcObject = localMediaStream.current;
                    }
                } catch (error) {
                    toast.error('please on microPhone')
                    reactNavigate('/')
                    socketRef.current.emit('LeaveRoom')
                }

            })
            socketRef.current.on(ACTIONS.JOINED, ({ clients }) => {
                setclients(clients)
                toast.success('room is joined')
                if (!joined) {
                    socketRef.current.emit('ready', { roomId: params.roomId, userId: location.state.userId })
                    setjoined(true)
                }
            })
            socketRef.current.on('roomFull', () => {
                toast.error('room is full')
                reactNavigate('/')
            })

            socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username, userId }) => {
                toast.success(`${username} is left room`)
                if (connections.current[socketId]) {
                    console.log('connection close')
                    connections.current[socketId].close();
                }

                delete connections.current[socketId];
                delete audioElement.current[userId];

                setclients((list) => list.filter((c) => c.socketId !== socketId))
            })
        }
        return () => {
            socketRef.current.off(ACTIONS.JOINED)
            socketRef.current.off(ACTIONS.CREATED)
            socketRef.current.off(ACTIONS.DISCONNECTED)
        }
    }, [reactNavigate, params.roomId, joined, location.state])


    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on('ready', ({ socketId, userId }) => {
                console.log('connected socket id', socketId)
                connections.current[socketId] = new RTCPeerConnection({
                    iceServers: [
                        {
                            urls: [
                                "stun:stun.l.google.com:19302",
                                "stun:global.stun.twilio.com:3478",
                            ],
                        },
                    ],
                })

                connections.current[socketId].onicecandidate = (event) => {
                    // console.log('icecandidate', event)
                    if (event.candidate) {
                        socketRef.current.emit('condiate', { condiate: event.candidate, socketId })
                    }
                }

                connections.current[socketId].ontrack = (event) => {
                    // console.log('got track', event.streams[0])
                    if (audioElement.current[userId]) {
                        audioElement.current[userId].srcObject = event.streams[0];
                    } else {
                        let settled = false;
                        const interval = setInterval(() => {
                            if (audioElement.current[userId]) {
                                audioElement.current[userId].srcObject = event.streams[0];
                                settled = true;
                            }

                            if (settled) {
                                clearInterval(interval);
                            }
                        }, 300);
                    }
                }

                // console.log(localMediaStream)
                if (localMediaStream.current) {
                    localMediaStream.current.getTracks().forEach(track => {
                        connections.current[socketId].addTrack(track, localMediaStream.current)
                    })
                    console.log('track add')
                }
                // connections.current[socketId].addTrack(userStream.getTracks()[0], userStream)

                connections.current[socketId].createOffer((offer) => {
                    connections.current[socketId].setLocalDescription(offer)
                    socketRef.current.emit('offer', { offer, socketId, userId: location.state.userId })
                }, (error) => {
                    alert('error for creating offer')
                })
            })
        }

        return () => {
            socketRef.current.off('ready')
        }
    }, [params.roomId, location.state])


    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on('offer', async ({ offer, socketId, userId }) => {
                console.log('offer')
                connections.current[socketId] = new RTCPeerConnection({
                    iceServers: [
                        {
                            urls: [
                                "stun:stun.l.google.com:19302",
                                "stun:global.stun.twilio.com:3478",
                            ],
                        },
                    ],
                });

                connections.current[socketId].onicecandidate = (event) => {
                    if (event.candidate) {
                        // console.log('ice condiante', event)
                        socketRef.current.emit('condiate', { condiate: event.candidate, socketId })
                    }
                }

                connections.current[socketId].ontrack = (event) => {
                    // console.log('got track remote', event)
                    if (audioElement.current[userId]) {
                        audioElement.current[userId].srcObject = event.streams[0];
                    } else {
                        let settled = false;
                        const interval = setInterval(() => {
                            if (audioElement.current[userId]) {
                                audioElement.current[userId].srcObject = event.streams[0];
                                settled = true;
                            }

                            if (settled) {
                                clearInterval(interval);
                            }
                        }, 300);
                    }
                }

                connections.current[socketId].setRemoteDescription(offer);

                try {
                    localMediaStream.current = await navigator.mediaDevices.getUserMedia({
                        audio: true
                    })

                    const localElement = audioElement.current[location.state.userId];
                    if (localElement) {
                        localElement.volume = 0;
                        localElement.srcObject = localMediaStream.current;
                    }
                } catch (error) {
                    toast.error('please on microPhone')
                    reactNavigate('/')
                    socketRef.current.emit('LeaveRoom')
                }

                if (localMediaStream.current) {
                    localMediaStream.current.getTracks().forEach(track => {
                        connections.current[socketId].addTrack(track, localMediaStream.current)
                    })
                    // console.log('track add')
                }
                connections.current[socketId].createAnswer((answer) => {
                    connections.current[socketId].setLocalDescription(answer);
                    socketRef.current.emit('answer', { answer, socketId })
                }, (error) => {
                    alert('error for creating answer')
                })
            })
        }

        return () => {
            socketRef.current.on('offer')
        }
    }, [params.roomId, location.state, reactNavigate])


    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on('answer', ({ answer, socketId }) => {
                console.log('answer')
                connections.current[socketId].setRemoteDescription(answer)
            })

            socketRef.current.on('condiate', ({ condiate, socketId }) => {
                var iceCandidate = new RTCIceCandidate(condiate);
                connections.current[socketId].addIceCandidate(iceCandidate);
            })
        }
        return () => {
            socketRef.current.on('answer')
        }
    }, [])


    const providerRef = ({ instance, userId }) => {
        audioElement.current[userId] = instance
    }

    function LevaeRoom() {
        if (socketRef.current) {
            socketRef.current.emit('LeaveRoom')
            reactNavigate('/')
        }
    }

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(params.roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
        }
    }

    if (!location.state) {
        return <Navigate to="/" />
    }

    const unteUnmute = (userId, i) => {
        if (audioElement.current[userId].volume === 0) {
            audioElement.current[userId].volume = 1;
            document.getElementsByClassName('mute')[i].innerHTML = 'mute'
        }
        else {
            audioElement.current[userId].volume = 0;
            document.getElementsByClassName('mute')[i].innerHTML = 'unmute'
        }
    }

    return (
        <div className='flex'>
            <div className="aside ">
                <div className="asideup mx-3">
                    <h1 className='text-3xl m-2 font-semibold border-b-2 border-gray-500 ' > Eode Edtior </h1>
                    <p className='font-semibold text-lg'>Connected</p>
                    <div className="contentList mt-3">
                        {clients && clients.length > 0 && clients.map((e, i) => {
                            // { console.log(location.state) }
                            return <div key={i} className='flex flex-col'>
                                <Avatar name={e.user.username} size='50' round="10px" />
                                <span className='font-semibold text-lg'>{e.user.username}</span>
                                <audio ref={(instance) => { providerRef({ instance, userId: e.user.userId }) }} controls autoPlay></audio>
                                {e.user.userId === location.state.userId ? <p className='mute'></p> : <button className='mute mutebtn' onClick={() => { unteUnmute(e.user.userId, i) }}>mute</button>}

                            </div>
                        })}
                    </div>
                </div>

                <div className="asidedown flex flex-col m-5 gap-3">
                    <button className="copybtn py-2 px-4 rounded" onClick={copyRoomId}>
                        Copy Room Id
                    </button>
                    <button onClick={LevaeRoom} className="Leavebtn bg-green-500 hover:bg-green-700 text-white font-bold py-1  px-4  rounded text-lg">
                        Leave
                    </button>
                </div>
            </div>
            <div className='edtior bg-gray-500'>
                <Edtior socketRef={socketRef.current} roomId={params.roomId} onCodeChange={(code) => { codeRef.current = code }} />
            </div>
        </div>
    )
}

export default Edtiorpage;