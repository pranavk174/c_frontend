import SpinLoader from '@/components/Utility/SpinLoader'
import React from 'react'

const loading = () => {
    return (
        <div className='h-screen w-full justify-center flex items-center'>

            <SpinLoader height={"100px"} width={"100px"} />
        </div>
    )
}

export default loading