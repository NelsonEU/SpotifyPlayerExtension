$(function() {
  //Global variables
  var accessToken = null;
  var interval = null;
  var onplayhead = false;
  var playing = false;
  var currentTime = 0;
  var totalTime = 0;
  var fetchInterval = window.setInterval(function() {
    if (!onplayhead) fetchSong();
  }, 2000);

  //Opening Flow
  showLoadingView();
  chrome.storage.local.get(['accessToken'], function(result) {
    if (result) {
      accessToken = result.accessToken;
      fetchSong();
    } else {
      showConnectView();
    }
  });






  //Listeners
  //Timeline click
  $('#timeline').on('click', function(event) {
    moveplayhead(event);
  })
  $('#playhead').on('mousedown', function() {
    mouseDown();
  });
  $('#playhead').on('mouseup', function(event) {
    mouseUp(event);
  });
  //Previous click
  $('#previous-button').on('click', function(event) {
    changeSong('previous');
  });
  //Next click
  $('#next-button').on('click', function(event) {
    changeSong('next');
  });
  //Start/Pause click
  $('#play-pause-button').on('click', function(event) {
    togglePlayback();
  });
  //Connect click
  $('#connect-button').on('click', function() {
    console.log('1 - on a click connect');
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
      console.log('2 - on a recu la reponse du connect: ' + redirectUrl);
      if (redirectUrl) {
        console.log('3 - on a le redirect URL');
        accessToken = redirectUrl.substring(redirectUrl.lastIndexOf('access_token=') + 13, redirectUrl.lastIndexOf('&token_type'));
        console.log('3bis - avec accessToken: ' + accessToken);
        fetchSong();
        chrome.storage.local.set({ accessToken: accessToken }, function(result) {
          if (result) {
            console.log('4 - on a save le token, on va fetch mtn');
          }
        });
      }
    });
  })
  //Open Spotify Click
  $('#open-spotify-button').on('click', function() {
    chrome.tabs.create({ url: 'https://open.spotify.com' });
  });







  //Spotify Calls
  function fetchSong() {
    $.ajax({
      url: 'https://api.spotify.com/v1/me/player/currently-playing',
      type: 'GET',
      headers: { "Authorization": "Bearer " + accessToken },
      success: function(data) {
        console.log('5 - on a fetch');
        if (data) {
          console.log('6 - on a une chanson, on va show le player view');
          updateSong(data);
          showPlayerView();
        } else {
          console.log('6 - on a pas de chanson, on show que dalle');
          showEmptyView();
        }
      },
      error: function(error) {
        switch (error.status) {
        case 401:
          showConnectView();
          break;
        case 403:
          //Spotify error, retry
          fetchSong();
          break;
        }
      }
    })
  }

  function updateCurrentTime(newTime) {
    $.ajax({
      url: 'https://api.spotify.com/v1/me/player/seek?position_ms=' + Math.trunc(newTime),
      type: 'PUT',
      headers: { "Authorization": "Bearer " + accessToken },
      success: function(data) {
        currentTime = newTime;
        launchPlayer();
      },
      error: function(error) {
        switch (error.status) {
          case 401:
            showConnectView();
            break;
          case 403:
            //Spotify error, retry
            updateCurrentTime(newTime);
            break;
        }
      }
    })
  }

  function changeSong(direction = 'next') {
    $.ajax({
      url: 'https://api.spotify.com/v1/me/player/' + direction,
      type: 'POST',
      headers: { "Authorization": "Bearer " + accessToken },
      success: function() {
        fetchSong();
      },
      error: function(error) {
        switch (error.status) {
          case 401:
            showConnectView();
            break;
          case 403:
            //Spotify error, retry
            changeSong(direction);
            break;
        }
      }
    })
  }
  
  function togglePlayback() {
    var action = playing ? 'pause' : action = 'play';
    playing = !playing;

    $.ajax({
      url: 'https://api.spotify.com/v1/me/player/' + action,
      type: 'PUT',
      headers: { "Authorization": "Bearer " + accessToken },
      success: function() {
        if (playing) {
          showPauseButton();
          fetchSong();
        } else {
          showPlayButton();
          if (interval) {
            clearInterval(interval);
          }
        }
      },
      error: function(error) {
        switch (error.status) {
          case 401:
            showConnectView();
            break;
          case 403:
            //Spotify error, retry
            togglePlayback();
            break;
        }
      }
    })
  }




  //Utilities functions
  function showConnectView() {
    $('#loading-view').hide();
    $('#player-view').hide();
    $('#empty-view').hide();
    $('#connect-view').show();
  }

  function showPlayerView() {
    $('#loading-view').hide();
    $('#connect-view').hide();
    $('#empty-view').hide();
    $('#player-view').show();
  }

  function showEmptyView() {
    $('#loading-view').hide();
    $('#connect-view').hide();
    $('#player-view').hide();
    $('#empty-view').show();
  }

  function showLoadingView() {
    $('#connect-view').hide();
    $('#player-view').hide();
    $('#empty-view').hide();
    $('#loading-view').show();
  }

  function showPlayButton() {
    $('#pause-button').hide();
    $('#play-button').show();
  }

  function showPauseButton() {
    $('#play-button').hide();
    $('#pause-button').show();
  }

  function mouseDown() {
    onplayhead = true;
    window.addEventListener('mousemove', moveplayhead, true);
  }
  
  function mouseUp(event) {
    if (onplayhead) {
        moveplayhead(event);
        window.removeEventListener('mousemove', moveplayhead, true);
    }
    onplayhead = false;
  }
  
  function moveplayhead(event) {
      var newMargLeft = event.clientX - getPosition(timeline);
      var playheadWidth = $('#playhead').width();
      var timelineWidth = $('#timeline').width() - playheadWidth;
  
      if (newMargLeft >= 0 && newMargLeft <= timelineWidth) {
        $('#playhead').css('margin-left', newMargLeft + "px");
      }
      if (newMargLeft < 0) {
        $('#playhead').css('margin-left', -playheadWidth/2 + "px");
      }
      if (newMargLeft > timelineWidth) {
        $('#playhead').css('margin-left', timelineWidth + "px");
      }
  
      if(!onplayhead) {
        var newPercent = newMargLeft/timelineWidth;
        newTime = newPercent*totalTime;
        updateCurrentTime(newTime);
      }
  }
  
  function getPosition(element) {
    return element.getBoundingClientRect().left;
  }

  function updateSong(data) {
    currentTime = data.progress_ms;
    totalTime = data.item.duration_ms;
    playing = data.is_playing;
    updateSongAttributes(data);
    launchPlayer();
  }
  
  function updateSongAttributes(data) {
    $('#music-img').attr('src', data.item.album.images[0].url);
    $('#music-artist').text(data.item.artists[0].name);
    $('#music-title').text(data.item.name);
    $('#total-time').text(getTiming(totalTime));
  }

  function launchPlayer() {
    if (interval) {
      clearInterval(interval);
    }
    updateTimeline();
    if (playing) {
      launchPlayhead();
      showPauseButton();
    } else {
      showPlayButton();
    }
  }

  function launchPlayhead() {
    interval = window.setInterval(function() {
      currentTime += 1000;
      updateTimeline();
    }, 1000);
  }

  function getTiming(millis) {
    var minutes = Math.floor(millis/60000);
    var seconds = ((millis % 60000)/1000).toFixed(0);
    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }
  
  function updateTimeline() {
    if (currentTime > totalTime) {
      fetchSong();
    } else {
      var timelineWidth = $('#timeline').width() - $('#playhead').width();
      var playPercent = timelineWidth * (currentTime/totalTime);
      $('#current-time').text(getTiming(currentTime));
      if (!onplayhead) $('#playhead').css('margin-left', playPercent + "px");
    }
  }
});
