// Saves options to chrome.storage
function save_options() {
  var header_name = document.getElementById('header_name').value;
  var header_prefix = document.getElementById('header_prefix').value;
  var copy_prefix = document.getElementById('copy_prefix').checked;
  var wrap_claim_names = document.getElementById('wrap_claim_names').checked;
  chrome.storage.local.set({
    header_name: header_name,
    header_prefix: header_prefix,
    copy_prefix: copy_prefix,
    wrap_claim_names: wrap_claim_names
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

function restore_options() {
  chrome.storage.local.get({
    header_name: "Authorization",
    header_prefix: "Bearer",
    copy_prefix: false,
    wrap_claim_names: false
  }, function(items) {
    document.getElementById('header_name').value = items.header_name;
    document.getElementById('header_prefix').value = items.header_prefix;
    document.getElementById('copy_prefix').checked = items.copy_prefix;
    document.getElementById('wrap_claim_names').checked = items.wrap_claim_names;
  });
}

// Resets options to default values
function reset_options() {
  document.getElementById('header_name').value = "Authorization";
  document.getElementById('header_prefix').value = "Bearer";
  document.getElementById('copy_prefix').checked = false;
  document.getElementById('wrap_claim_names').checked = false;
  save_options();
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('reset').addEventListener('click', reset_options);
