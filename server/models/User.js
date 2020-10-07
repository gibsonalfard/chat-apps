module.exports = mongoose => {
    const User = mongoose.model(
        "user",
        mongoose.Schema({
            id: String,
            username: String,            
        }), 
        "user"
    );

    return User;
};