import pool from "./cloudsql";

export const asReadablePostQuery = `
    posts.id, title, text_content, image_content, created, likes, dislikes, owner,
      num_comments, comment_of, posted_time, location_name,
      ST_X(location::geometry) AS lng, ST_Y(location::geometry) as lat
`;

export function getNumberOfCommentsOnPost(postId: number) {
    return pool.query(
        `SELECT COUNT(*) FROM posts WHERE comment_of = $1::integer`,
        [postId]
    );
}