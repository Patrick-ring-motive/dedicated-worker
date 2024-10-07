globalThis.AsyncFunction = async function() { }.constructor;
globalThis.await = _ => _;
globalThis.async = async a => await a();

globalThis.sleep = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

void async function DedicatedWindow() {
    if (!self?.window?.Worker) {
        return;
    }
    if (!globalThis.workerMessageMap) {
        globalThis.workerMessageMap = new Map();
    }

    function getWorkerMessageId(timeout = 10000) {
        const workerMessageId = ('WorkerMessageId' + new Date().getTime() + "" + performance.now() + "" + Math.random()).replaceAll('.', '_');
        const workerMessagePromise = {};
        workerMessagePromise.promise = new Promise((resolve,reject) => {
            workerMessagePromise.resolve = resolve;
            workerMessagePromise.reject = reject;
        });
        (async () => {
            await sleep(timeout);
            if(workerMessageMap.has(workerMessageId)){
                workerMessagePromise?.reject?.('timeout');
            }
        })();
        workerMessageMap.set(workerMessageId, workerMessagePromise);
        return workerMessageId;
    }
    const myWorker = new Worker(URL.createObjectURL(new Blob(['(' + DedicatedWorker + ')();'], { type: "text/javascript" })));
    myWorker.ready = new Promise((resolve) => { myWorker.readyResolve = resolve });
    myWorker.ready.catch((reason)=>myWorker.readyResolve(reason));
    async function processWorkerMessage(func, values) {
        const workerId = getWorkerMessageId();
        const workerFunction = func;
        myWorker.postMessage([workerId, workerFunction, [...values]]);
        const workerPromise = workerMessageMap.get(workerId).promise;
        const workerReturnValue = await workerPromise;
        setTimeout(() => workerMessageMap.delete(workerId), 100);
        return workerReturnValue;
    }
    myWorker.onmessage = async function(e) {
        const workerId = e.data[0];
        if (workerId == 'ready') {
            myWorker.readyResolve();
            return;
        }
        const workerReturnValue = e.data[1];
        workerMessageMap.get(workerId).resolve(workerReturnValue);
    }
    await myWorker.ready;
    globalThis.spellFix = async function() {
        var n, a = [],
            walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        while (n = walk.nextNode()) {
            if (!n.textContent) { continue; }
            if (!String(n.textContent).trim().length) { continue; }
            await sleep(20);
            if (navigator?.scheduling?.isInputPending?.({ includeContinuous: true })) {
                continue;
            }
            const tag = String(n?.parentElement?.tagName).toLowerCase();
            if (~tag.search(/style|script/)) {
                continue;
            }
            a.push(n);
            let ntext = n.textContent;
           // console.log(n.parentElement.tagName, ntext);
            nwords = ntext.split(' ');
            nwords = await Promise.all(nwords.map(async x => {
                if (/[^a-z]/.test(x)) {
                    return x;
                }
                if (x.length < 3) {
                    return x;
                }
                if (await processWorkerMessage('check', [x])) {
                    return x;
                }
                let y = await processWorkerMessage('suggest', [x]);
                console.log(y);
                return y[0] ?? x
            }));
            let nnext = nwords.join(' ');
            if (nnext == ntext) { continue; }
            console.warn(ntext,'changing to',nnext);
            n.textContent = nnext;
        };
        return a;
    }
    spellFix();
}?.();



async function DedicatedWorker() {
    globalThis.AsyncFunction = async function() { }.constructor;
    globalThis.await = _ => _;
    globalThis.async = async a => await a();

    globalThis.sleep = (ms) => {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    };
    if (!self?.DedicatedWorkerGlobalScope) {
        return;
    }
    async function fetchText() {
        return await (await fetch(...arguments)).text();
    }
    globalThis.suggestions = {};
    globalThis.checks = {};
    async function zfetchText() {
        try { return await fetchText(...arguments); } catch (e) { return e.message; }
    }

    const typoCdn = 'https://cdn.jsdelivr.net/npm/typo-js@1.2.4/';

    eval?.((await zfetchText(`${typoCdn}typo.min.js`)).replace('var Type', 'globalThis.Typo'));
    const [aff, dic] = await Promise.all([zfetchText(`${typoCdn}dictionaries/en_US/en_US.aff`),
    zfetchText(`${typoCdn}dictionaries/en_US/en_US.dic`)]);
    const dictionary = new Typo("en_US", aff, dic);
    console.log('asdf', dictionary.check(''));
    postMessage(['ready']);
    let functions = {};
    self.onmessage = function(e) {
        //console.log('Worker: Message received from main script' + e.data);
        let currentFunction = functions[e.data[1]];
        if (currentFunction instanceof AsyncFunction) {
            async(async _ => postMessage([e.data[0], await currentFunction(...e.data[2])]));
        } else {
            postMessage([e.data[0], currentFunction(...e.data[2])]);
        }
    }
    functions = {
        check: function(x) {
            if (globalThis.checks[x]) {
                return globalThis.checks[x];
            }
            const y = dictionary.check(x);
            globalThis.checks[x] = y;
            return y;
        },
        suggest: function(x) {
            if (globalThis.suggestions[x]) {
                return globalThis.suggestions[x];
            }
            let y = dictionary.suggest(x);
            if((!functions.check(y[0]))||/[0-9]/.test(y[0])){y=[];}
            globalThis.suggestions[x] = y;
            return y;
        }
    }
}
