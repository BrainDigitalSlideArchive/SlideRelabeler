function* parse_debug_messages(messages) {
    let debug_out = []

    for (const message of messages) {
        try {
            debug_out.push(JSON.parse(message));
        } catch (error) {
            debug_out.push(message);
        }
    }

    return debug_out;
}

export default parse_debug_messages;