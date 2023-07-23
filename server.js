require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const CHATGPT_API_KEY = process.env.GPT; // Replace with your actual ChatGPT API key
app.use(bodyParser.json());

// Endpoint to receive incoming messages from Facebook Messenger
app.post('/webhook', async (req, res) => {
  const { body } = req;

  if (body.object === 'page') {
    for (const entry of body.entry) {
      const webhookEvent = entry.messaging[0];

      if (webhookEvent.message) {
        const message = webhookEvent.message.text;
        const senderId = webhookEvent.sender.id;

        // Check if the message starts with the prefix ","
        if (message.startsWith(',')) {
          // Extract the prompt from the message
          const prompt = message.slice(1).trim();

          try {
            // Call ChatGPT API to get the response
            const response = await axios.post('https://api.openai.com/v1/engines/gpt-3.5-turbo/completions', {
              prompt,
              max_tokens: 150,
            }, {
              headers: {
                'Authorization': `Bearer ${CHATGPT_API_KEY}`,
              },
            });

            // Send the response back to the user
            sendTextMessage(senderId, response.data.choices[0].text);
          } catch (error) {
            console.error('Error querying ChatGPT API:', error);
            sendTextMessage(senderId, "Oops, something went wrong!");
          }
        }
      }
    }
  }

  res.status(200).send('EVENT_RECEIVED');
});


// Helper function to send text messages back to the user
function sendTextMessage(recipientId, text) {
  axios.post('https://graph.facebook.com/v17.0/me/messages', {
    recipient: { id: recipientId },
    message: { text },
    messaging_type: 'RESPONSE',
  }, {
    headers: {
      'Authorization': `Bearer ${FB}`,
    },
  });
}


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
