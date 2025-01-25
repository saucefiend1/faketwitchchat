import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import mic from 'mic';
import { Readable } from 'stream';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

// Set the path for ffmpeg
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Set up OpenAI API configuration
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// Function to handle audio transcription using Whisper
async function transcribeAudio(filename) {
	const transcript = await openai.audio.transcriptions.create({
		file: fs.createReadStream(filename),
		model: 'whisper-1',
	});
	return transcript.text;
}

// Function to send a message to ChatGPT and get a response
async function getChatGPTResponse(message) {
	const chatResponse = await openai.chat.completions.create({
		model: 'gpt-3.5-turbo',
		messages: [{ role: 'user', content: message }],
	});
	return chatResponse.choices[0].message.content;
}

// Function to detect speech and process audio
function detectSpeech() {
	return new Promise((resolve, reject) => {
		let isRecording = false;
		let micInstance;
		let outputStream;
		const audioFilename = 'detected_audio.wav';

		// Initialize mic instance with voice activity detection (VAD)
		const micConfig = {
			rate: '16000',
			channels: '1',
			fileType: 'wav',
			// These options help detect speech activity
			device: 'default',
			verbose: true,
			endian: 'little',
			encoding: 'signed-integer',
			threshold: 0.5, // Adjust threshold for sensitivity
			silence: 2, // How many seconds of silence until it stops recording
		};
		console.log(micConfig.device);
		micInstance = mic(micConfig);
		const micInputStream = micInstance.getAudioStream();

		// Set up audio recording stream
		outputStream = fs.createWriteStream(audioFilename);
		const writable = new Readable().wrap(micInputStream);
		writable.pipe(outputStream);

		// Detect start of speech
		micInputStream.on('startComplete', () => {
			console.log('Listening for speech...');
			isRecording = true;
		});

		// Detect end of speech (silence detected)
		micInputStream.on('silence', () => {
			if (isRecording) {
				micInstance.stop();
				console.log('Silence detected. Stopping recording.');
				isRecording = false;
				resolve(audioFilename);
			}
		});

		micInputStream.on('error', (err) => {
			reject(err);
		});

		micInstance.start();
	});
}

// Main function to detect speech, transcribe, and get a ChatGPT response
async function main() {
	try {
		// Step 1: Detect speech and record audio
		const audioFilename = await detectSpeech();

		// Step 2: Transcribe the detected audio using OpenAI's Whisper
		const transcription = await transcribeAudio(audioFilename);
		console.log('Transcription:', transcription);

		// Step 3: Send the transcription to ChatGPT and get a response
		const chatResponse = await getChatGPTResponse(transcription);
		console.log('ChatGPT Response:', chatResponse);

		// Clean up audio file after processing
		fs.unlinkSync(audioFilename);
	} catch (error) {
		console.error('Error:', error);
	}
}

main();
