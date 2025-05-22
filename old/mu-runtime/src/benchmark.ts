import { IBenchmark } from './js-framework-benchmark/benchmark-common';
import { VanillaJsMain } from './js-framework-benchmark/benchmark-vanillajs'

document.body.innerHTML = `
<div><a href="/">Main Mu app</a></div>
<h1 style="font-family:monospace;">Benchmark Page</h1>
<div id='main'>
    <pre id="output"></pre>
    <div class="container" style="display:flex; flex-direction:row; align-items: flex-start;">
        <table class="table table-hover table-striped test-data">
            <tbody id="vanillaTBody">
            </tbody>
        </table>
        <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
        <table class="table table-hover table-striped test-data">
            <tbody id="muTBody">
            </tbody>
        </table>
        <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
    </div>
    
</div>
<hr/>
<div id="benchmark-page">
</div>`

window.onhashchange = () => document.location.reload();

let vanillaJsBenchmark = new VanillaJsMain(document.getElementById("vanillaTBody")!)
let muBenchmark = new VanillaJsMain(document.getElementById("muTBody")!)
let output!: HTMLPreElement;


async function test() {
    output = document.getElementById("output") as HTMLPreElement;
    for (let i = 0; i < 1; i++) {
        await time("Adding 1000 rows", 10, (b) => b.add(100))
        await time("Update rows", 10, (b) => b.updateRows())
        await time("Remove all rows", 10, (b) => b.removeAllRows())
        await time("Swap rows", 10, (b) => b.swapRows())
        await time("Adding 1000 rows", 5, (b) => b.add(5))

    }
}

function delay(msec: number) {
    return new Promise(resolve => setTimeout(resolve, msec));
}

test();

async function time(title: string, count: number, action: (a: IBenchmark) => void) {
    async function measure(b: IBenchmark) {
        let now = Date.now();
        action(b)
        return Date.now() - now;
    }
    await delay(100);
    let jsDuration = 0, muDuration = 0;

    for (let i = 0; i < count; i++) {
        await delay(1)
        jsDuration += await measure(vanillaJsBenchmark)
        await delay(1)
        muDuration += await measure(muBenchmark)
    }
    output.append(`${title} js: ${jsDuration}ms, mu: ${muDuration} ms\n`)
}
//mount(benchmarkPage, "benchmark-page");


