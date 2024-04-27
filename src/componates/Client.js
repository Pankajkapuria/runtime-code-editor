import React from 'react'
import Avatar from 'react-avatar';
import { useWebRTC } from '../RTC/useWebRTC';

const Client = ({ username, ClientId }) => {

    const { providerRef } = useWebRTC();


    return (
        <div className='flex flex-col'>
            <Avatar name={username} size='50' round="10px" />
            <span className='font-semibold text-lg'>{username}</span>
            <audio ref={(instance) => providerRef(instance, ClientId)} controls autoPlay></audio>
        </div>
    )
}

export default Client
