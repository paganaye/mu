import { ExamplePage } from "./examples/examples.js";
import { Var, div, mount, elt } from "./mu.js"
import { homePage, nav, pageByUrl } from "./nav.js"
//----------------------------


async function loadCurrentPage() {
  let hash = window.location.hash;
  if (hash.length > 1 && hash[0] == '#') hash = hash.substring(1);
  let page = pageByUrl[hash] ?? homePage;

  if (page.reload) {
    document.location.reload();
    return
  }

  let part1: any = await new Promise((resolve, reject) => {
    var client = new XMLHttpRequest();
    client.open('GET', "/src/examples/" + page.url + ".ts?raw"); // raw makes vite expose the .ts (not compiled)
    let source: string = "";
    client.onload = () => {
      if (client.status === 0 || (client.status >= 200 && client.status < 400)) {
        source = client.responseText;
        let cleanedSource = source.replace(/^export default '|';$/m, '').replace(/\\n/g, '\n')
          .replace(/import.*\.\/examples\".*\n/, "")
          .replace(/import.*\.\.\/mu\".*\n+/, "")
          .replace(/export default(.|\n)*/, "")
          .replace(/let exampleOutput = +/, "return ")
        resolve(cleanedSource)
      } else {
        reject(client.statusText)
      }
    };
    client.send();
  });
  let part2: any;

  try {
    let importResult = await import("./examples/" + page.url + ".ts");
    let examplePage = importResult.default as ExamplePage;
    console.log({ examplePage });
    part2 = examplePage.content as any;
  } catch (error: any) {
    console.error(error);
    part2 = "The page " + page.url + " doesn't exist yet, doesn't compile or is not accessible now.\n" + String(error)
  }

  currentPage.value = div(null,
    // watch(null as any, [$page], () => {
    // return div({},
    elt("h1", null, page.page),
    elt("h2", null, "source"),
    elt("pre", {}, part1),
    elt("h2", null, "output"),
    elt("pre", {}, part2));
}

const alwaysReload = true;

window.onhashchange = () => alwaysReload ? document.location.reload() : loadCurrentPage();


let currentPage = new Var(elt("div", null, "Loading..."));
loadCurrentPage();

let root = div(null,
  div({
    style: "display: flex; flex-direction: row;"
  },
    nav({ class: "left" }),
    div({ style: "display: flex; flex-direction: column;" },
      div(null, currentPage)
    )
  )
);

mount(root, "app");
