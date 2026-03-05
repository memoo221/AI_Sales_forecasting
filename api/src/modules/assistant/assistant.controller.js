const { chat } = require("./assistant.service");

const askAssistant = async (req, res, next) => {
  try {
    const { messages } = req.body;
    const companyId = req.user.companyId;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const reply = await chat(companyId, messages);
    res.json({ reply });
  } catch (err) {
    next(err);
  }
};

module.exports = { askAssistant };
