import Imagepreview from "@/components/Utility/Imagepreview";
const Page = async ({
  params,
}: {
  params: Promise<{
    url?: string;
  }>;
}) => {
  const paramss = await params;

  const image = paramss.url ? decodeURIComponent(paramss.url) : undefined;

  return (
    <>
      <Image prioritypreview image={image} />
    </>
  );
};

export default Page;
