import Chat from '@/components/Chat/Chat'
import Header from '@/components/Header/Header'
import React from 'react'

const page = () => {
  return (
    <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
      <Header/>
      <Chat/>
    </div>
  )
}

export default page
