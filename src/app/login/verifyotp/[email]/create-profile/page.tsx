import UserProfile from '@/components/User/CreateUser'
import WhatsappProfile from '@/components/User/WhatsappProfile'

const page = async ({ params }: { params: Promise<{ email: string }> }) => {
    const { email } = await params
    console.log(decodeURIComponent(email), "email in params")

    return (
        <div>
            <UserProfile email={decodeURIComponent(email)} />
        </div>
    )
}

export default page