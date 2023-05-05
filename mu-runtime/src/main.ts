import { Var, div, mount, watch, elt } from "./mu.ts"
import { homePage, nav, pageByUrl } from "./nav.ts"
//----------------------------
let page = Var.new("page", homePage);



window.onhashchange = () => {
  let hash = window.location.hash;
  if (hash.length > 1 && hash[0] == '#') hash = hash.substring(1);
  let newPage = pageByUrl[hash];
  if (page) page.setValue(newPage);
}

mount(
  watch([], () => {
    return div(null,
      div({
        style: "display: flex; flex-direction: row;"
      },
        nav({ class: "left" }),
        div({ style: "display: flex; flex-direction: column;" },
          elt("h2", {}, watch([page], () => page.getValue().page)),
          div({}, watch([page], () => {
            let url = page.getValue().url
            return div({},
              elt("h2", null, "source"),
              elt("pre", {},
                new Promise((resolve, reject) => {
                  var client = new XMLHttpRequest();
                  client.open('GET', "/src/" + url + ".ts");
                  let source: string = "";
                  client.onload = () => {
                    if (client.status === 0 || (client.status >= 200 && client.status < 400)) {
                      source = client.responseText;
                      let cleanedSource = source
                        .replace(/(import.*\/mu\.ts.*\n|\n\/\/# sourceMapping.*)/gm, "")
                        .replace("export default", "return");
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
                let content: string;
                try {
                  let importResult = (await import("./" + url + ".ts") as any);
                  content = importResult.default
                  console.log({ importResult });

                } catch (error: any) {
                  content = "The page " + page.getValue().url + " doesn't exist yet or is not accessible now.";
                }
                return content;
              }
            )
          }))
        )
      )
    )
  }),
  document.getElementById("app")!
);
