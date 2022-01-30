var options = {
  header_name: "authorization",
  header_prefix: ["Bearer "],
  copy_prefix: false
};

function setOptions(o) {
  options.header_name = o.header_name.toLowerCase().trim();
  options.header_prefix = typeof o.header_prefix == "string" ? o.header_prefix.split(',') : o.header_prefix;
  options.copy_prefix = o.copy_prefix;
  for(var i = 0 ; i<options.header_prefix.length ; i++) {
    if(options.header_prefix[i].trim().length>0 && !options.header_prefix[i].endsWith(' ')) {
      options.header_prefix[i] += ' ';
    }
  }
  var caption = document.getElementById("caption");
  var p = options.header_prefix.length>1 ? '{'+options.header_prefix.join()+'}' : options.header_prefix[0];
  caption.innerHTML = 'Waiting for request with <b>'+Encoder.htmlEncode(o.header_name)+
                      ': '+Encoder.htmlEncode(p)+' [token]</b>'+
                      '<br>(Go to <b>Extentions > JWT Inspector > Options</b> to customize)';
}

function bearer_token(h) {
  if(h && h.name && h.name.toLowerCase() == options.header_name && h.value) {
    var p = options.header_prefix.find( s => h.value.startsWith(s) );
    if(p) {
      return { prefix:p , tok:h.value.substring(p.length) };
    }
  }
  return null;
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

function updateCopyButton(p,tok) {
  var b = document.getElementById("copy_token");
  b.dataset.token = options.copy_prefix ? p+tok : tok;
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
  var h = bearer_token(request.request.headers.find(bearer_token));
  if(!h) return;
  try {
    var parts = h.tok.split('.');
    var header = JSON.parse(atob(parts[0]));
    var claims = JSON.parse(atob(parts[1]));
    render(header, claims, request.request.url, request.startedDateTime);
    updateCopyButton(h.prefix,h.tok);
  } catch (error) {
    // Not a token we can extract and decode
  }
}

chrome.devtools.network.onRequestFinished.addListener(onRequestFinished);
window.onload = function() {
  document.getElementById("copy_token").onclick = copyToken;
  chrome.storage.local.get(options, setOptions);
};
chrome.storage.onChanged.addListener( function(changes, namespace) {
  chrome.storage.local.get(options, setOptions);
});
