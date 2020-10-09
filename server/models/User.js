module.exports = mongoose => {
    const User = mongoose.model(
        "user",
        mongoose.Schema({
            id: String,
            username: String,
            rooms: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "room"
                }
            ],   
        }), 
        "user"
    );

    return User;
};