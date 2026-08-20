import SpinLoader from "@/components/Utility/SpinLoader";
import React from "react";

const loading = () => {
  return (
    <div className="h-screen flex justify-center items-center">
      <SpinLoader height={"200px"} width={"200px"} />
    </div>
  );
};

export default loading;
