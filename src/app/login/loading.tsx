import SpinLoader from "@/components/Utility/SpinLoader";

const loading = () => {
  return (
    <div className="h-screen w-full flex justify-center items-center">
      <SpinLoader height={"200px"} width={"200px"} />
    </div>
  );
};

export default loading;
