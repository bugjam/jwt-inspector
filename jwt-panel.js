function bearer_token(h) {
  return h && h.name && h.name.toLowerCase() == "authorization" && h.value && h.value.startsWith("Bearer ") ? h.value.substring(7) : null;
}

function isObject(obj) {
  var type = typeof obj;
  return type === 'function' || type === 'object' && !!obj;
}

const ts_claims = ["exp","iat","nbf"];

function renderClaims(claims) {
  var table = document.createElement("table");
  for(var c in claims) {
    var row = document.createElement("tr");
    var td1 = document.createElement("td");
    td1.appendChild(document.createTextNode(Encoder.htmlEncode(String(c))));
    row.appendChild(td1);
    var td2 = document.createElement("td");
    if(isObject(claims[c])) {
      td2.appendChild(renderClaims(claims[c]));
    } else {
      td2.appendChild(document.createTextNode(Encoder.htmlEncode(String(claims[c]))));
      if(ts_claims.includes(c)) {
        var ts = document.createElement("span");
        ts.className = "ts";
        var d = new Date(claims[c]*1000);
        ts.appendChild(document.createTextNode(d.toLocaleString()));
        td2.appendChild(ts);
      }
    }
    row.appendChild(td2);
    table.appendChild(row);
  }
  return table;
}

function render(header, claims, url, time) {

  var divHeader = document.getElementById("header");
  var dlHeader = renderClaims(header);
  divHeader.innerHTML = "";
  divHeader.appendChild(dlHeader);

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

function updateCopyButton(tok) {
  var b = document.getElementById("copy_token");
  b.dataset.token = tok;
  b.disabled = false;
}

// Taken from: https://stackoverflow.com/a/18455088/1823175
function copyTextToClipboard(text) {
  //Create a textbox field where we can insert text to.
  var copyFrom = document.createElement("textarea");

  //Set the text content to be the text you wished to copy.
  copyFrom.textContent = text;

  //Append the textbox field into the body as a child.
  //"execCommand()" only works when there exists selected text, and the text is inside
  //document.body (meaning the text is part of a valid rendered HTML element).
  document.body.appendChild(copyFrom);

  //Select all the text!
  copyFrom.select();

  //Execute command
  document.execCommand('copy');

  //(Optional) De-select the text using blur().
  copyFrom.blur();

  //Remove the textbox field from the document.body, so no other JavaScript nor
  //other elements can get access to this.
  document.body.removeChild(copyFrom);
}

function copyToken() {
  var t = this.dataset.token;
  copyTextToClipboard(t);
}

function onRequestFinished(request) {
  var tok = bearer_token(request.request.headers.find(bearer_token));
  if(!tok) return;
  try {
    var parts = tok.split('.');
    var header = JSON.parse(atob(parts[0]));
    var claims = JSON.parse(atob(parts[1]));
    render(header, claims, request.request.url, request.startedDateTime);
    updateCopyButton(tok);
  } catch (error) {
    // Not a token we can extract and decode
  }
}

chrome.devtools.network.onRequestFinished.addListener(onRequestFinished);
window.onload = function() {
  document.getElementById("copy_token").onclick = copyToken;
}
