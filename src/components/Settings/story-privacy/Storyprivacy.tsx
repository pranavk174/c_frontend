"use client"
import { UserRoundX } from 'lucide-react'
import React, { useState } from 'react'
import Privacyoptions from './Privacyoptions'
import { activeTypes, optionsProps } from '@/lib/dummy'
import { logger } from '@/lib/utils'
import { useGetUserQuery, useGetUsersQuery } from '@/redux/Apis/Users'


const Storyprivacy = () => {
    const [active, setActive] = useState<activeTypes>(null)
    const [selected, setSelected] = useState<number[]>([])

    const options: optionsProps[] = [
        {
            label: "For everyone",
            Logo: <UserRoundX className='size-6' />,
            type: null
        },
        {
            label: "My contact except",
            type: 'exclude',
            Logo: <UserRoundX className='size-6' />

        }
        , {
            label: "Only share with",
            type: 'include',
            Logo: <UserRoundX className='size-6' />

        }
    ]

    const { users } = useGetUsersQuery(null, {
        selectFromResult: ({ data }) => {
            return {
                users: data?.data?.getUsers?.data?.items,
            };
        },
    });





    return (
        <div className='p-5 w-full space-y-3'>

            <h3>Status Privacy</h3>

            <div>
                {options.map((item, index) => (
                    <Privacyoptions key={item.label} users={users} setSelected={setSelected} selected={selected} active={active} onClickHandeler={(data: activeTypes) => {

                        logger.debug(data, "dataaaaaa in accordia")
                        setSelected([])
                        setActive(data)
                    }} {...item} />
                ))}
            </div>

        </div>
    )
}

export default Storyprivacy