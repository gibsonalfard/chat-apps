module.exports = mongoose => {
    const Room = mongoose.model(
        "room",
        mongoose.Schema({
            name: String,
            members: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "user"
                }
            ],
        }), 
        "room"
    );

    return Room;
};