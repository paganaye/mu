console.log("main.ts");
let hash = document.location.hash
if (hash === "#test") import("./test.ts");
else import("./app.ts");
