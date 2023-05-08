console.log("main.ts");
let hash = document.location.hash
if (hash === "#test") import("./test.ts");
else if (hash === "#benchmark") import("./benchmark.ts");
else import("./app.ts");
