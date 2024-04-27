import React, { useState } from 'react'
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom';
const Home = () => {
    const navigate = useNavigate();
    const [roomid, setRoomid] = useState('');
    const [username, setusername] = useState('');

    const headelNewRoom = (e) => {
        e.preventDefault();
        const id = uuidv4();
        setRoomid(id);
        toast.success('Created new room');
    }
    const hendleJionButton = (e) => {
        // e.preventDefault();
        if (!roomid || !username) {
            toast.error('roomid & username ie required');
            return;
        }

        navigate(`/edtior/${roomid}`, {
            state: {
                userId: parseInt(Math.random() * 10000),
                username
            }
        });

    }

    const enterpress = (e) => {
        if (e.code === 'Enter') {
            hendleJionButton();
        }
    }

    return (
        <div>
            <div className='home flex flex-col justify-center items-center'>
                <div className="homepage flex flex-col justify-center ">
                    <h1 className='text-3xl m-2 font-semibold'> Eode Edtior </h1>
                    <h3 className=' m-2'>paste invitation room id </h3>
                    <input value={roomid} onChange={(e) => { setRoomid(e.target.value) }} className=' bg-white rounded-sm p-1 m-2 font-semibold' type='text' placeholder='Rome id' onKeyUp={enterpress} />
                    <input value={username} onChange={(e) => { setusername(e.target.value) }} className=' bg-white rounded-sm p-1 m-2 font-semibold' type='text' placeholder='User Name' onKeyUp={enterpress} />
                    <button className='ml-auto bg-green-500 hover:bg-green-700 text-white font-bold py-1  px-4  rounded text-lg' onClick={hendleJionButton} >join</button>
                    <p className='m-2'>if you have't room id create <a className='text-green-500' href='/' onClick={headelNewRoom}>new room</a> </p>
                </div>
                <div className="DeviceSuppoart">
                    <h1 className='text-3xl m-2 font-semibold'> Eode Edtior </h1>
                    <p>Mobile Version of a website is not available</p>
                </div>
            </div>

        </div>
    )
}

export default Home
