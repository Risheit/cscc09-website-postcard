import {
  faMapLocationDot,
  faUserCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Header() {
  return (
    <header className="h-12 flex place-items-center border-b border-background-300 shadow-md shadow-background-100 p-2">
      {/* click route to /dashboard or / */}
      <span className="h-full flex place-items-center">
        <span className="aspect-square h-full flex items-center justify-center rounded-full bg-primary-500">
          <FontAwesomeIcon icon={faMapLocationDot} className="text-white" />
        </span>
        <span className="pl-2">postcard.</span>
      </span>

      <span className="flex-grow"></span>

      {/* if not logged in */}
      {/* <span className="flex gap-2 place-items-center pr-2">
        <button className="bg-primary-300 px-4">sign up</button>
        <button className="bg-secondary-100 px-4 border-background-300">
          log in
        </button>
      </span> */}

      {/* if logged in, click route to /account */}
      <span className="flex gap-4 place-items-center pr-2">
        <span className="h-full flex place-items-center">
          <span className="aspect-square h-full flex items-center justify-center rounded-full overflow-hidden">
            <FontAwesomeIcon icon={faUserCircle} className="text-text-900" />
          </span>
          <span className="pl-2">Hello, user</span>
        </span>
        <button className="bg-secondary-100 px-4 border-background-300">
          log out
        </button>
      </span>
    </header>
  );
}
