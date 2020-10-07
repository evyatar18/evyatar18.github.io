/// returns the latest `count` threads from forum at `forumURL`
/// the callback `onSuccess` will be given a list of json objects each corresponding to a thread.
/// they are formed in the following way:
/// { href: <href URL from the forum>, title: <title of thread from the forum>, url: <absolute URL to element> }
/// the callback `onError` will receive a single error string in case an error happens.
function fetchLatestThreads(forumURL, count, onSuccess, onError) {
    var proxyURL = _fetchURLCORS(forumURL);
    var req = jQuery.get(proxyURL);

    req.done(function(data) {
        // NOTE:: dependent on the ID of the `ol` element in each forums that includes all forum unpinned threads
        var threads = jQuery(data).find("#threads");

        if (threads && threads.length > 0) {
            var parsed;

            try {
                parsed = _getLatest(threads, count);

                // adds the `url` property
                // NOTE:: URL is not supported on IE so this will cause an error
                parsed.forEach(function(thread) {
                    const threadUrl = new URL(thread["href"], forumURL);
                    thread["url"] = threadUrl.href;
                });
            } catch (e) {
                onError(`Parsing error;\n${e}`)
                return;
            }

            onSuccess(parsed);
        } else {
            onError(`Querying Error;\nNo #threads found at: ${url}`);
        }
    });

    req.fail(function(xhr) {
        onError(`Fetching Error; Error code: ${xhr.status}`);
    });
}

/// This function returns a URL which can be queried in order to get around the cross origin denial of FXP
function _fetchURLCORS(url) {
    // use jsonp.afeld.me as a proxy server
    // NOTE:: if not working, we might have to use a different proxy server
    return "https://scotism-sum.000webhostapp.com/?url=" + encodeURIComponent(url);
}

/// given the jQuery threads object, this function gets the latest `count` threads
function _getLatest(threads, count) {
    // the logic of this method may be changed so that it actually grabs the latest-by-post-date
    // and not latest-by-last-comment
    return threads.children("li").slice(0, count).map(_parseThreadData).get();
}

const _lengthThreadPrefix = "thread_".length;

function _parseThreadData(_, threadElement) {
    threadElement = jQuery(threadElement);

    // NOTE:: dependent on the fact the `li` element of the thread has an attribute `id` containing
    // the id of the thread
    var idAttr = threadElement.attr("id");
    var threadId = idAttr.substring(_lengthThreadPrefix);

    // NOTE:: dependent on the fact a title of the thread has an ID #thread_title_<threadId>
    // and that it is a link element (<a href="..."></a>)
    var linkElement = threadElement.find(`a#thread_title_${threadId}`);

    // might be unnecessary to get the url like this since we already got the thread id
    // but this assures we don't have a dependency on the
    var threadURL = linkElement.attr("href");
    var threadTitle = linkElement.text();

    return { "href": threadURL, "title": threadTitle };
}

// function _consoleTests() {
//     // tests `fetchLatest` on `PC and Hardware Updates` forum
//     fetchLatest("https://www.fxp.co.il/forumdisplay.php?f=4603", 5, console.log, window.alert);

//     // tests `fetchLatest` error handling on HTTP error
//     fetchLatest("https://www.fxp.co.il/non_existent.php", 5, console.log, window.alert);

//     // tests `fetchLatest` error handling when there is no element with the ID `threads`
//     fetchLatest("https://www.fxp.co.il/about.php", 5, console.log, window.alert);
// }