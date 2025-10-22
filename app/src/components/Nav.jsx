import React from 'react'
import Logout from './Logout'

const Nav = () => {
  return (
    <nav className='flex justify-between items-center py-2 px-8 bg-gray-800 text-white'>
        <p className='hover:cursor-pointer'>SessionHalt</p>
        <Logout />
    </nav>
  )
}

export default Nav