export type Post = {
  id: number;

  owner: number;
  poster_display_name: string;
  poster_profile_pic?: string;

  title: string;
  image_content?: string;
  text_content?: string;

  location_name: string;
  lng: number;
  lat: number;

  posted_time: Date;
  created: Date;

  likes: number;
  dislikes: number;
  num_comments: number;
  comments: Post[];
  local_liked_status?: 'like' | 'dislike';

  // TODO: replace mock remix fields with actual remix fields
  remix_of?: number;
  remix_of_poster_display_name?: string;
  remix_of_poster_profile_pic?: string;
  remix_of_title?: string;
};
