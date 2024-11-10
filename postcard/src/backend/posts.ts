export const asReadablePostQuery = `
    id, text_content, image_content, created, likes, dislikes,
      ST_X(location::geometry) AS lng, ST_Y(location::geometry) as lat
`;