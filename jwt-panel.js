function bearer_token(h) {
  return h && h.name == "Authorization" && h.value && h.value.startsWith("Bearer ") ? h.value.substring(7) : null;
}

function isObject(obj) {
  var type = typeof obj;
  return type === 'function' || type === 'object' && !!obj;
}

const ts_claims = ["exp","iat","nbf"];

function renderClaims(claims) {
  var dl = document.createElement("dl");
  for(var c in claims) {
    var dt = document.createElement("dt");
    dt.appendChild(document.createTextNode(Encoder.htmlEncode(String(c))));
    dl.appendChild(dt);
    var dd = document.createElement("dd");
    if(isObject(claims[c])) {
      dd.appendChild(renderClaims(claims[c]));
    } else {
      dd.appendChild(document.createTextNode(Encoder.htmlEncode(String(claims[c]))));
      if(ts_claims.includes(c)) {
        var ts = document.createElement("span");
        ts.className = "ts";
        var d = new Date(claims[c]*1000);
        ts.appendChild(document.createTextNode(d.toLocaleString()));
        dd.appendChild(ts);
      }
    }
    dl.appendChild(dd);
  }
  return dl;
}

function render(claims, url, time) {
  var div = document.getElementById("claims");
  var dl = renderClaims(claims);
  div.innerHTML = "";
  div.appendChild(dl);

  var caption = document.getElementById("caption");
  caption.innerHTML = "Bearer token extracted from request to "+Encoder.htmlEncode(String(url));
  var ts = document.createElement("span");
  ts.className = "ts";
  ts.appendChild(document.createTextNode(Encoder.htmlEncode(String(time))));
  caption.appendChild(ts);
}

function onRequestFinished(request) {
  var tok = bearer_token(request.request.headers.find(bearer_token));
  if(!tok) return;
  try {
    var parts = tok.split('.');
    var claims = JSON.parse(atob(parts[1]));
    render(claims, request.request.url, request.startedDateTime);    
  } catch (error) {
    // Not a token we can extract and decode
  }
}

chrome.devtools.network.onRequestFinished.addListener(onRequestFinished);
