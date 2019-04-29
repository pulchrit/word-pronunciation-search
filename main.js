'use strict';

// This is a weird way to handle the audio file, but I wanted to practice event 
// delegation, so I needed to add an event listener to a dynamically created element. 
function onPronounceButtonClicked(audioLink) {
        
    $(".js-results").on("click", "#js-pronounce-button", function() {
        console.log("onPronounceButtonClicked ran");
        $(".js-audio-file").append(`
            <audio class="audio-style" controls>
                <source src="${audioLink}" type="audio/wav">
                Your browser does not support the audio element.
            </audio>
        `)
    });
}

function createAudioLink(audioFileName) {

    let subdirectory = "";

    if (audioFileName.startsWith("bix")) {
        subdirectory = "/bix/";
    } else if (audioFileName.startsWith("gg")) {
        subdirectory = "/gg/";
    } else if (isNaN(parseInt(audioFileName[0], 10))) {
        subdirectory = `/${audioFileName[0]}/`;
    } else {
        subdirectory = "/number/";
    }

    return `https://media.merriam-webster.com/soundc11${subdirectory}${audioFileName}.wav`;
}

function displayResults(responseJson, word) {

    $(".js-results").html(`
        <h2>Your pesky word is ${word}.</h2>
        <p>Click below to pronounce it.</p>
        <button type="button" id="js-pronounce-button">Pronounce ${word}</button>
        <div class="js-audio-file"></div>
        `).removeClass("hidden");

    // If multiple words are returned, you need to check which have audio files.
    // Those without audio files are ignored. Those with audio files will have 
    // audio elements created for each audio file.
    if (responseJson.length > 1) {
        responseJson.forEach(wordObject => {
            if (wordObject.hwi.prs === undefined) {
                    return; // This continues the forEach loop.
            } 
            onPronounceButtonClicked(createAudioLink(wordObject.hwi.prs[0].sound.audio));
        });
    } else {
        onPronounceButtonClicked(createAudioLink(responseJson[0].hwi.prs[0].sound.audio));
    } 
}

function handleNetworkErrors(response) {

    if (!response.ok) {
        throw new Error(response.statusText);
    }
    return response.json();
}

function handle404Errors(responseJson) {

    if (responseJson.length === 0) {
        throw new Error("No such word was found. Please try again.")
    } else if (typeof responseJson[0] === "string") {
        throw new Error(`That word wasn't found. Here are some related words to try: ${responseJson.join(", ")}`)
    } else {
        return responseJson;
    }
}

function getPronunciation(word) {

    const baseURL = "https://www.dictionaryapi.com/api/v3/references/collegiate/json/";
    const apiKeyURL = "?key=4ad67475-fad2-4467-87f8-1f95b8d9ef78";

    const callURL = `${baseURL}${word}${apiKeyURL}`;

    fetch(callURL) 
    .then(handleNetworkErrors) 
    .then(handle404Errors) 
    .then(responseJson => displayResults(responseJson, word))
    .catch(error => $(".js-results").html(`<p>${error}</p>`));
}

function onWordSubmitted() {

    $(".js-search-form").submit(event => {
        event.preventDefault(); 

        const word = $("#js-word-input").val();
        
        // Need to turn off the pronounce button listener here, so that 
        // the events created on previous searches are removed/deleted. 
        $(".js-results").off("click", "#js-pronounce-button");
        
        getPronunciation(word);
    });
}

$(onWordSubmitted);
