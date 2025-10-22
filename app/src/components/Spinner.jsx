import React from "react";

const Spinner = ({ spinning = true, size = "w-10 h-10", color = "border-blue-500" }) => {
  return (
      <div
        className={`${size} ${size} border-4 border-t-transparent border-solid rounded-full animate-spin ${color} ${!spinning ? "animate-none" : ""}`}
      ></div>
  );
};

export default Spinner;
