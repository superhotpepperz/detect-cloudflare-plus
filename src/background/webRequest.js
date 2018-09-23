const filter = { urls: ["<all_urls>"] };
const callback = d => {
	'use strict';
	if (requestIDs[d.requestID]) {
		tabs[d.tabId].badgeNum++;
		requestIDs[d.requestID].updateUI();
		delete requestIDs[d.requestID];
	}
};

browser.webRequest.onResponseStarted.addListener(d => {
	'use strict';
	if (d.tabId === -1) return;
	let isDoc = d.type === 'main_frame';
	if (isDoc) tabs.newInfo(d.tabId);
	isDoc = isDoc ? 2 : 1;
	tabs[d.tabId].total++;
	const cObj = {}; // for complex patterns involving multiple headers
	top:
		for (const i in d.responseHeaders) {
			const n = d.responseHeaders[i].name.toLowerCase();
			if (settings.patterns[n]) {
				const v = d.responseHeaders[i].value.toLowerCase();
				for (const func of settings.patterns[n]) {
					const match = func(v, cObj);
					if (match) {
						tabs[d.tabId].result = isDoc;
						tabs[d.tabId].cdn(match).inc(d.url);
						tabs[d.tabId].cdn(match).result = isDoc;
						requestIDs[d.requestID] = tabs[d.tabId];
						if (settings.lazy) break top;
					}
				}
			}
			if (settings.hpatterns[n]) {
				tabs[d.tabId].result = isDoc;
				tabs[d.tabId].cdn('Heuristic Detection').inc(d.url);
				tabs[d.tabId].cdn('Heuristic Detection').result = isDoc;
				requestIDs[d.requestID] = tabs[d.tabId];
			}
		}
}, filter, ["responseHeaders"]);

browser.webRequest.onErrorOccurred.addListener(callback, filter);
browser.webRequest.onCompleted.addListener(callback, filter);
browser.webRequest.onBeforeRedirect.addListener(d => {
	'use strict';
	if (requestIDs[d.requestID] && !d.redirectUrl.indexOf('data://')) {
		tabs[d.tabId].badgeNum++;
		requestIDs[d.requestID].updateUI();
		delete requestIDs[d.requestID];
	}
}, filter);
