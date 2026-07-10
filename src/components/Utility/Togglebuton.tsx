import { Moon, Sun } from "lucide-react";

const SoundToggle = ({ left, right, handleToggle, name, value }) => {
  return (
    <label className="inline-flex items-center cursor-pointer">
      {/* Low volume icon */}

      <span className="text-md text-wa-primary dark:text-wa-primary-dark">
        {left}
      </span>


      <button
        type="button"
        onClick={handleToggle}
        aria-label={value ? "Switch to light mode" : "Switch to dark mode"}
        className="
        relative
        flex
        h-8
        w-16
        items-center
        rounded-full
        bg-gray-200
        p-1
        transition-colors
        duration-300
        dark:bg-[#374248]
      "
      >
        {/* Sliding Circle */}
        <span
          className={`
          flex
          h-6
          w-6
          items-center
          justify-center
          rounded-full
          bg-white
          shadow-md
          transition-transform
          duration-300
          ease-in-out
          dark:bg-[#202c33]
          ${value
              ? "translate-x-8"
              : "translate-x-0"
            }
        `}
        >
          {value ? (
            <Moon
              size={15}
              className="text-wa-primary"
            />
          ) : (
            <Sun
              size={15}
              className="text-amber-500"
            />
          )}
        </span>
      </button>
      <span className="text-md text-wa-primary dark:text-wa-primary-dark">
        {right}
      </span>
      {/* High volume icon */}
    </label>
  );
};

export default SoundToggle;
