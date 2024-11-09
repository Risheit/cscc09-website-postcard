import pool from "@/backend/cloudsql";

type User = {
    id: number;
    displayName: string;
    profilePicturePath: string | undefined;
    username: string;
};

export async function getUserByUsername(username: string): Promise<User> {
    const userRaw = await pool.query(
        'SELECT * FROM users JOIN accounts ON user_id = id WHERE username = $1::text LIMIT 1',
        [username]
    );

    const user = userRaw.rows[0] ?? {};
    return {
        id: user?.id,
        displayName: user?.display_name,
        profilePicturePath: user?.profile_pic,
        username: user?.username,
    }
}