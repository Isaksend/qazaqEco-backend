const getUserByUsername = async (db, username) => {
    return db.get("SELECT * FROM users WHERE username = ?", [username]);
};

const createUser = async (db, username, hashedPassword) => {
    return db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword]);
};

export { getUserByUsername, createUser };
