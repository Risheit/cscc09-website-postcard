import { User } from "../../backend/users";
import { Session } from "next-auth";

export default interface DbSession extends Session {
  dbUser?: User;
}
