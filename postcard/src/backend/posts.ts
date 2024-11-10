export const asReadablePostQuery = `
    posts.id, title, text_content, image_content, created, likes, dislikes, owner,
      comment_of, posted_time, location_name,
      ST_X(location::geometry) AS lng, ST_Y(location::geometry) as lat
`;