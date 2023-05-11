/* eslint-disable */
async function getCoinsName() {
    const response = await fetch('https://min-api.cryptocompare.com/data/all/coinlist?summary=true');
    const data = await response.json();
    return data.Data;
}

const API_KEY =
    "6ffb4e5da818768accf4a57153739759c96cb9e9a66770163753cf987dc4035b";

const tickersHandlers = new Map(); // {}
const socket = new WebSocket(
    `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const AGGREGATE_INDEX = "5";
const AGGREGATE_INDEX_ERROR = "500";

socket.addEventListener("message", e => {
    const { TYPE: type, FROMSYMBOL: currency, PRICE: newPrice } = JSON.parse(
        e.data
    );

    if(type === AGGREGATE_INDEX_ERROR) {
        console.log( "error msg" )
        // return;
    }

    if (type !== AGGREGATE_INDEX || newPrice === undefined) {
        return;
    }

    const handlers = tickersHandlers.get(currency) ?? [];
    handlers.forEach(fn => fn(newPrice));
});

function sendToWebSocket(message) {
    const stringifiedMessage = JSON.stringify(message);

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(stringifiedMessage);
        return;
    }

    socket.addEventListener(
        "open",
        () => {
            socket.send(stringifiedMessage);
        },
        { once: true }
    );
}

function subscribeToTickerOnWs(ticker) {
    sendToWebSocket({
        action: "SubAdd",
        subs: [`5~CCCAGG~${ticker}~USD`]
    });
}

function unsubscribeFromTickerOnWs(ticker) {
    sendToWebSocket({
        action: "SubRemove",
        subs: [`5~CCCAGG~${ticker}~USD`]
    });
}

const subscribeToTicker = (ticker, cb) => {
    const subscribers = tickersHandlers.get(ticker) || [];
    tickersHandlers.set(ticker, [...subscribers, cb]);
    subscribeToTickerOnWs(ticker);
};

const unsubscribeFromTicker = ticker => {
    tickersHandlers.delete(ticker);
    unsubscribeFromTickerOnWs(ticker);
};

window.addEventListener('beforeunload', function () {
    if (socket.readyState === WebSocket.OPEN) {
        socket.close(1000, 'Page unloaded');
    }
});
window.addEventListener('unload', function () {
    if (socket.readyState === WebSocket.OPEN) {
        socket.close(1000, 'Page unloaded');
    }
});



export { getCoinsName, subscribeToTicker, unsubscribeFromTicker };