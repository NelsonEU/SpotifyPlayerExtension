$(function() {
  chrome.storage.local.get(['accessToken'], function(result) {
    if (result) {
      fetchSong();
    }
  });
  
  $('#connect-button').on('click', function() {
    var clientId = 'c22cb7b22201499eb8c0b7738ebba1d8';
    var redirectUri = chrome.identity.getRedirectURL('spotify');
    var scopes = "user-read-currently-playing user-modify-playback-state"

    chrome.identity.launchWebAuthFlow({
      "url": "https://accounts.spotify.com/authorize?client_id="+ clientId +
             "&redirect_uri="+ encodeURIComponent(redirectUri) + 
             "&scope=" + encodeURIComponent(scopes) +
             "&response_type=token", 
      'interactive': true,  
    },
    function(redirectUrl) {
      if (redirectUrl) {
        var accessToken = redirectUrl.substring(redirectUrl.lastIndexOf('access_token=') + 13, redirectUrl.lastIndexOf('&token_type'));
        chrome.storage.local.set({ accessToken: accessToken }, function(result) {
          if (result) {
            fetchSong();
          }
        });
      }
    });
  })
});
