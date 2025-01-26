import eventBus from '../eventBus';

function phraseToNumber(phrase) {
    // Map of common word-based numbers to their numeric equivalents
    const wordMap = {
        "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4,
        "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9,
        "ten": 10, "eleven": 11, "twelve": 12, "thirteen": 13,
        "fourteen": 14, "fifteen": 15, "sixteen": 16, "seventeen": 17,
        "eighteen": 18, "nineteen": 19, "twenty": 20, "thirty": 30,
        "forty": 40, "fifty": 50, "sixty": 60, "seventy": 70,
        "eighty": 80, "ninety": 90
    };

    // Map for ordinals
    const ordinalMap = {
        "first": 1, "second": 2, "third": 3, "fourth": 4,
        "fifth": 5, "sixth": 6, "seventh": 7, "eighth": 8,
        "ninth": 9, "tenth": 10, "eleventh": 11, "twelfth": 12,
        "thirteenth": 13, "fourteenth": 14, "fifteenth": 15,
        "sixteenth": 16, "seventeenth": 17, "eighteenth": 18,
        "nineteenth": 19, "twentieth": 20
    };

    // Handle numeric suffixes (e.g., "1st", "2nd", "3rd", "4th")
    const suffixes = /(\d+)(st|nd|rd|th)/;

    // Preprocess the phrase
    const words = phrase.toLowerCase().split(/\s+/);

    for (let word of words) {
        // Check if it's a direct numeric value
        if (!isNaN(word)) {
            return parseInt(word, 10);
        }

        // Check for ordinal numbers like "1st", "2nd"
        if (suffixes.test(word)) {
            return parseInt(word.match(suffixes)[1], 10);
        }

        // Check for ordinal words like "first", "second"
        if (ordinalMap[word]) {
            return ordinalMap[word];
        }

        // Check for cardinal words like "one", "two"
        if (wordMap[word]) {
            return wordMap[word];
        }
    }

    // If no number is found, return null
    return null;
}

const initializeRecog = () => {
    // Check for browser compatibility
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.error("Speech Recognition API is not supported in this browser.");
        return;
    }
    const recognition = new SpeechRecognition();

    // Configure recognition settings to optimize performance
    recognition.continuous = true; // Allow continuous listening for multiple sentences
    recognition.interimResults = false; // Provide interim results during speech
    recognition.lang = 'en-IN'; // Set language to English immediately
    recognition.maxAlternatives = 1; // Reduce the number of alternatives for better performance

    return recognition;
}
export const startSpeechRecognition = (recognition, onResult) => {

    let pauseTimer = null; // Track the pause timer
    const pauseThreshold = 1500; // Pause threshold in milliseconds (1.5 seconds)

    // Start speech recognition and avoid delay
    recognition.start();

    recognition.onstart = function () {
        console.log("Speech Recognition Started");
        document.querySelector('.record-button').classList.add('recording'); // Update UI
    };

    recognition.onresult = function (event) {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        const transcript = interimTranscript + finalTranscript;
        onResult(transcript);

        // Process the cleaned transcript
        const cleanedTranscript = transcript.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim().toLowerCase();

        if (cleanedTranscript.startsWith("open project")) {
            const projectName = cleanedTranscript.replace("open project", "").trim();
            eventBus.$emit('makeWaitressServeByName', projectName);
        } else if (cleanedTranscript.startsWith("open")) {
            const inputStr = cleanedTranscript.replace("open", "").trim();
            const input = phraseToNumber(inputStr);
            if (!isNaN(input)) {
                eventBus.$emit('makeWaitressServeByIndex', input);
            } else {
                console.error("Invalid project identifier:", inputStr);
            }
        }

        // Handle pause detection
        if (pauseTimer) {
            clearTimeout(pauseTimer);
        }

        pauseTimer = setTimeout(() => {
            recognition.stop(); // Stop recognition after pause
        }, pauseThreshold);
    };

    recognition.onend = function () {
        console.log("Speech Recognition Ended");
        document.querySelector('.record-button').classList.remove('recording'); // Update UI
    };

    recognition.onerror = function (event) {
        console.error("Speech Recognition Error:", event.error);
    };

    recognition.onnomatch = function () {
        console.error("Speech Recognition did not understand speech.");
    };

    return recognition; // Return recognition instance for optional manual stop
};

export default {
    data() {
        return {
            speechText: '',
            recognition: null, // Store the recognition instance
            isRecording: false, // Track if recording is in progress
        };
    },
    created() {
        // Start listening for speech when the component is created
        this.recognition = initializeRecog();
        eventBus.$on('startListening', this.startListening);
    },
    methods: {
        startListening() {
            if (this.isRecording) {
                // Stop the recognition but do not change the state yet
                this.recognition.stop();
            } else {
                // Start a new recognition instance and update the state
                this.recognition = startSpeechRecognition(this.recognition, this.updateSpeechResult);

                // Set up onend event to change the state when recognition ends
                this.recognition.onend = () => {
                    this.isRecording = false; // Update state when recognition ends
                };

                this.isRecording = true; // Update recording state immediately when starting
            }
        },
        updateSpeechResult(transcript) {
            this.speechText = transcript;
        },
    },
    beforeDestroy() {
        // Cleanup recognition if the component is destroyed to avoid memory leaks
        if (this.recognition) {
            this.recognition.stop();
        }
    },
};



