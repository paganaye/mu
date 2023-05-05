import { ExamplePage, Page } from "./examples/examples.ts";
import { Var, div, mount, watch, elt } from "./mu.ts"
import { homePage, nav, pageByUrl } from "./nav.ts"
//----------------------------
let $page = new Var<Page>(getCurrentHashPage());

function getCurrentHashPage(): Page {
  let hash = window.location.hash;
  if (hash.length > 1 && hash[0] == '#') hash = hash.substring(1);
  return pageByUrl[hash] ?? homePage;
}
window.onhashchange = () => $page.setValue(getCurrentHashPage())

mount(
  watch([], () => {
    return div(null,
      div({
        style: "display: flex; flex-direction: row;"
      },
        nav({ class: "left" }),
        div({ style: "display: flex; flex-direction: column;" },
          div({}, watch([$page], () => {
            let page = $page.getValue()
            return div({},
              elt("h1", null, page.page),
              elt("h2", null, "source"),
              elt("pre", {},
                new Promise((resolve, reject) => {
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
                  }
                  client.send();
                })
              ),
              elt("h2", null, "output"),
              async () => {
                try {
                  let importResult = await import("./examples/" + page.url + ".ts");
                  let examplePage = importResult.default as ExamplePage;
                  console.log({ examplePage });
                  return examplePage.content as any;
                } catch (error: any) {
                  return "The page " + page.getValue().url + " doesn't exist yet or is not accessible now."
                }
              }
            )
          }))
        )
      )
    )
  }),
  document.getElementById("app")!
);
