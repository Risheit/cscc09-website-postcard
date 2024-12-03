export type Post = {
  id: number;

  owner: number;
  poster_display_name: string;
  poster_profile_pic?: string;
  poster_external_profile_pic: boolean;

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
  action?: 'like' | 'dislike';

  // TODO: replace mock remix fields with actual remix fields
  remix_of?: number;
  remix_of_poster_display_name?: string;
  remix_of_poster_profile_pic?: string;
  remix_of_poster_external_profile_pic: boolean;
  remix_of_title?: string;
};

export function fromRaw(postRaw: Post) {
  console.log('postRaw', postRaw);
  const internalProfilePicPath = postRaw.poster_profile_pic
    ? `/api/images/${postRaw.poster_profile_pic}`
    : undefined;

  postRaw.poster_profile_pic = postRaw.poster_external_profile_pic
    ? postRaw.poster_profile_pic
    : internalProfilePicPath;

  const internalRemixOfProfilePicPath = postRaw.remix_of_poster_profile_pic
    ? `/api/images/${postRaw.remix_of_poster_profile_pic}`
    : undefined;

  postRaw.remix_of_poster_profile_pic =
    postRaw.remix_of_poster_external_profile_pic
      ? postRaw.remix_of_poster_profile_pic
      : internalRemixOfProfilePicPath;
  
  console.log('new post', postRaw);
  return postRaw;
}

export function upvoted(post: Post): Post {
  switch (post.action) {
    case 'like':
      return {
        ...post,
        likes: post.likes - 1,
        action: undefined,
      };
    case 'dislike':
      return {
        ...post,
        likes: post.likes + 1,
        dislikes: post.dislikes - 1,
        action: 'like',
      };
    default:
      return {
        ...post,
        likes: post.likes + 1,
        action: 'like',
      };
  }
}

export function downvoted(post: Post): Post {
  console.log(post);
  switch (post.action) {
    case 'like':
      return {
        ...post,
        likes: post.likes - 1,
        dislikes: post.dislikes + 1,
        action: 'dislike',
      };
    case 'dislike':
      return {
        ...post,
        dislikes: post.dislikes - 1,
        action: undefined,
      };
    default:
      return {
        ...post,
        dislikes: post.dislikes + 1,
        action: 'dislike',
      };
  }
}