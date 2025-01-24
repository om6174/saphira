export const startSpeechRecognition = (onResult) => {
    // Check for browser compatibility
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.error("Speech Recognition API is not supported in this browser.");
        return;
    }

    const recognition = new SpeechRecognition();

    // Configure recognition settings
    recognition.continuous = true; // Allow continuous listening for multiple sentences
    recognition.interimResults = true; // Provide interim results during speech

    let pauseTimer = null; // Track the pause timer
    const pauseThreshold = 1500; // Pause threshold in milliseconds (2 seconds)

    // Start speech recognition when button is pressed or on page load
    recognition.start();

    // Log when recognition starts
    recognition.onstart = function () {
        console.log("Speech Recognition Started");
        // Optionally update the UI to indicate speech is being listened to
        document.querySelector('.record-button').classList.add('recording'); // Add a 'recording' class to change the button color
    };

    // Handle recognition results
    recognition.onresult = function (event) {
        let finalTranscript = '';
        let interimTranscript = '';

        // Iterate through results
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        // Combine the interim and final transcript
        const transcript = interimTranscript + finalTranscript;
        onResult(transcript);

        // Clear the previous pause timer if there's new speech input
        if (pauseTimer) {
            clearTimeout(pauseTimer);
        }

        // Set a new pause timer
        pauseTimer = setTimeout(() => {
            recognition.stop(); // Stop recognition after a 2-second pause
            console.log("Speech Recognition Stopped due to pause.");
        }, pauseThreshold);
    };

    // Log when recognition ends
    recognition.onend = function () {
        console.log("Speech Recognition Ended");
        // Optionally update UI to show recognition has stopped
        document.querySelector('.record-button').classList.remove('recording');
    };

    // Handle errors
    recognition.onerror = function (event) {
        console.error("Speech Recognition Error:", event.error);
    };

    // Handle unexpected termination
    recognition.onnomatch = function () {
        console.error("Speech Recognition could not understand speech.");
    };

    recognition.onsoundend = function () {
        console.log("Sound ended, stopping recognition.");
    };

    return recognition; // Return the recognition instance for stopping later if needed
};
