module.exports = mongoose => {
    const Message = mongoose.model(
        "message",
        mongoose.Schema({
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user"
            },
            message: mongoose.Schema.Types.Mixed,
            datetime: Date,
            room: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "room"
            },
            indexInRoom: Number,
        }), 
        "message"
    );

    return Message;
};