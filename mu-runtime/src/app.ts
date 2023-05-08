import { ExamplePage } from "./examples/examples.js";
import { Var, div, mount, elt, iif } from "./mu.js"
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

  let source: any = await new Promise((resolve, reject) => {
    var client = new XMLHttpRequest();
    client.open('GET', "/src/examples/" + page.url + ".ts?raw"); // raw makes vite expose the .ts (not compiled)
    let source: string = "";
    client.onload = () => {
      if (client.status === 0 || (client.status >= 200 && client.status < 400)) {
        source = client.responseText;
        let cleanedSource = source
          .replace(/^export default '|';$/m, '').replace(/\\n/g, '\n')
          .replace(/import.*\.\/examples\".*\n/, "")
          .replace(/from \"..\/mu\"/, "from \"mu\"")
//          .replace(/import.*\.\.\/mu\".*\n+/, "")
          .replace(/^export default `/, "")
          .replace(/export default \{(.|\n)* ?/, "")
          .replace(/let exampleOutput = +/, "return ")
        resolve(cleanedSource)
      } else {
        reject(client.statusText)
      }
    };
    client.send();
  });
  let output: any;
  let examplePage: ExamplePage | undefined
  try {
    let importResult = await import("./examples/" + page.url + ".ts");
    examplePage = importResult.default as ExamplePage;
    console.log({ examplePage });
    output = examplePage.content as any;
  } catch (error: any) {
    console.error(error);
    output = "The page " + page.url + " doesn't exist yet, doesn't compile or is not accessible now.\n" + String(error)
  }

  currentPage.value = div(null,
    elt("h1", null, page.page),
    iif(new Var(examplePage?.hideSource || false), div(null), div(null,
      elt("h2", null, "source"),
      elt("pre", {}, source),
      elt("h2", null, "output")
    )),
    elt("div", {}, output));
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
