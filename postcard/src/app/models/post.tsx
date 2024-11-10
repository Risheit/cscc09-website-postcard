export type Post = {
  id: number;
  userid: number;
  username: string;
  userpfp?: string;
  title: string;
  type: "postcard" | "text";
  url?: string;
  text?: string;
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  date: Date;
  posteddate: Date;
};
