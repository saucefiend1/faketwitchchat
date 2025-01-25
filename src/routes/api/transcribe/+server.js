import { json } from '@sveltejs/kit';
import fs from 'fs';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// OpenAI API setup
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// Handle the POST request for audio transcription
export const POST = async ({ request }) => {
	const data = await request.formData(); // Get the form data

	const audioFile = data.get('audio'); // Get the audio file from the form data
	const viewers = data.get('viewers');
	if (!audioFile) {
		return json({ error: 'Audio file is missing' }, { status: 400 });
	}

	// Create a temporary file to save the audio
	const audioPath = `uploads/${audioFile.name}`;
	const fileBuffer = Buffer.from(await audioFile.arrayBuffer());

	// Write the buffer to a file
	fs.writeFileSync(audioPath, fileBuffer);

	try {
		// Step 1: Transcribe the audio file using OpenAI's Whisper
		const transcript = await openai.audio.transcriptions.create({
			file: fs.createReadStream(audioPath),
			model: 'whisper-1',
		});

		const transcriptionText = transcript.text;
		const systemText =
			"Act like twitch chat and create a username seperated by a ':' then give one line response to the users prompts. Write nothing else expect the username and the response. Make each response distinct from the previous. Send " +
			viewers +
			" responses seperated by a the '|' charecter. Don't put a '|' after the last response";
		// Step 2: Send transcription to ChatGPT and get a response
		const chatResponse = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [{
				'role': 'system',
				'content': [
					{
						'type': 'text',
						'text': systemText,
					},
				],
			}, { role: 'user', content: transcriptionText }],
		});

		const chatMessage = chatResponse.choices[0].message.content;

		// Step 3: Clean up and send the response back to the frontend
		fs.unlinkSync(audioPath); // Clean up the uploaded file
		return json({
			transcription: transcriptionText,
			response: chatMessage,
		});
	} catch (error) {
		fs.unlinkSync(audioPath); // Clean up the uploaded file on error
		return json({ error: error.message }, { status: 500 });
	}
};
