(function() {
    var previousServerResponse
    async function checkIfServerResponseChanged(url) {
        const response = await (await fetch(url)).text();
        if (!previousServerResponse) {
            previousServerResponse = response;
            console.log("Stored response for", url);
        }
        else if (response == previousServerResponse){
            console.log("No change");
        } else {
            console.log("Reloading...");
            window.location.reload();
        }
    }
    setInterval(() => checkIfServerResponseChanged(window.location.href),1000);
})();

