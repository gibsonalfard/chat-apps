module.exports = mongoose => {
    const Media = mongoose.model(
        "media",
        mongoose.Schema({
            message_id: String,
            media_id: String,
            media: String,
        }), 
        "media"
    );

    return Media;
};