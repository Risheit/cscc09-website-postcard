import pool from "./cloudsql";

export const asReadablePostQuery = `
    posts.id, posts.title, posts.text_content, posts.image_content, posts.created, posts.likes, posts.dislikes, posts.owner,
      posts.num_comments, posts.comment_of, posts.posted_time, posts.location_name,
      ST_X(posts.location::geometry) AS lng, ST_Y(posts.location::geometry) as lat
`;

export function getNumberOfCommentsOnPost(postId: number) {
    return pool.query(
        `SELECT COUNT(*) FROM posts WHERE comment_of = $1::integer`,
        [postId]
    );
}