import './App.css';
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home';
import { Toaster } from 'react-hot-toast'
import Edtiorpage from './pages/edtiorpage';

function App() {
  return (
    <>

      <div>
        <Toaster position='top-right'
          toastOptions={{
            success: {
              theme: {
                primary: '#4aed88'
              }
            }
          }}>

        </Toaster>
      </div >

      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path="/edtior/:roomId" element={< Edtiorpage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
