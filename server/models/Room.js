module.exports = mongoose => {
    const Room = mongoose.model(
        "room",
        mongoose.Schema({
            room_name: String,
            members:[mongoose.Schema.Types.Mixed],
        }), 
        "room"
    );

    return Room;
};