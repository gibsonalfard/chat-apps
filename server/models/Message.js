module.exports = mongoose => {
    const Message = mongoose.model(
        "message",
        mongoose.Schema({
            user_id: String,
            message: String,
            media_id: String,            
            time: Date,
        }), 
        "message"
    );

    return Message;
};