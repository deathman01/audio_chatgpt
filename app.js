const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const mic = require("mic");
const { Readable } = require("stream");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const gTTS = require('gtts');
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: "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",
});

const openai = new OpenAIApi(configuration);

ffmpeg.setFfmpegPath(ffmpegPath);

// Record audio
function recordAudio(filename) {
  return new Promise((resolve, reject) => {
      try{
             const micInstance = mic({
                  rate: "16000",
                  channels: "1",
                  fileType: "wav",
                  exitOnSilence: 1
              });

              const micInputStream = micInstance.getAudioStream();
              const output = fs.createWriteStream(filename);
              const writable = new Readable().wrap(micInputStream);

              console.log("\nRecording... Press Ctrl+C to stop.");

              writable.pipe(output);

              micInstance.start();

              process.on("SIGINT", () => {
                micInstance.stop();
                console.log("Finished recording");
                resolve();
              });

              micInputStream.on("error", (err) => {
                reject(err);
              });
            }
            catch(ex){
                console.log(ex)
          }
      });
}

// Transcribe audio
async function transcribeAudio(filename) {
    try{
        const transcript = await openai.createTranscription(
            fs.createReadStream(filename),
            "whisper-1"
        );

        let gettext =  transcript.data.text;

        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: gettext,
        });

        const completion = response.data.choices[0].text;
        const  gtts = new gTTS(completion, 'en');
 
        gtts.save('Voice.wav', function (err, result){
            if(err) { throw new Error(err); }
            console.log("Text to speech converted!");
        });

        return completion;
    }
    catch(ex){
        console.log("here");
        console.log(ex.message);
    }
}

// Main function
async function main() {
  const audioFilename = "recorded_audio.wav";
  await recordAudio(audioFilename);
  console.log("Please wait a while we are doing the magic");
  const transcription = await transcribeAudio(audioFilename);
  console.log("Transcription:", transcription);
  
}

main();