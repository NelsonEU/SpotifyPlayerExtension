var interval = null;
var onplayhead = false;
var playing = false;

$(function() {
  $('#timeline').on('click', function(event) {
    moveplayhead(event);
  })
  $('#playhead').on('mousedown', function() {
    mouseDown();
  });
  $('#playhead').on('mouseup', function(event) {
    mouseUp(event);
  });
  $('#previous-button').on('click', function(event) {
    changeSong('previous');
  });
  $('#next-button').on('click', function(event) {
    changeSong('next');
  });
  $('#play-button').on('click', function(event) {
    togglePlayback();
  });
});

function mouseDown() {
  onplayhead = true;
  window.addEventListener('mousemove', moveplayhead, true);
}

function mouseUp(event) {
  if (onplayhead == true) {
      moveplayhead(event);
      window.removeEventListener('mousemove', moveplayhead, true);
  }
  onplayhead = false;
}

function togglePlayback() {
  var action;
  if (playing) {
    playing = false;
    action = 'pause';
  } else {
    playing = true;
    action = 'play';
  }
  chrome.storage.local.get(['accessToken'], function(result) {
    if (result) {
      $.ajax({
        url: 'https://api.spotify.com/v1/me/player/' + action,
        type: 'PUT',
        headers: { "Authorization": "Bearer " + result.accessToken },
        success: function() {
          if (playing) {
            fetchSong();
          } else {
            if (interval) {
              clearInterval(interval);
            }
          }
        },
        error: function(error) {
          debugger;
        }
      })
    }
  });
  
}

function moveplayhead(event) {
    var newMargLeft = event.clientX - getPosition(timeline);
    var timelineWidth = $('#timeline').width() - $('#playhead').width();

    if (newMargLeft >= 0 && newMargLeft <= timelineWidth) {
      $('#playhead').css('margin-left', newMargLeft + "px");
    }
    if (newMargLeft < 0) {
      $('#playhead').css('margin-left', "0px");
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

function updateCurrentTime(newTime) {
  chrome.storage.local.get(['accessToken'], function(result) {
    if (result) {
      $.ajax({
        url: 'https://api.spotify.com/v1/me/player/seek?position_ms=' + Math.trunc(newTime),
        type: 'PUT',
        headers: { "Authorization": "Bearer " + result.accessToken },
        success: function(data) {
          currentTime = newTime;
          launchPlayer();
        },
        error: function(error) {
          handleError(error.status);
        }
      })
    }
  });
}

function launchPlayer() {
  if (interval) {
    clearInterval(interval);
  }
  updateTimeline();
  if (playing) {
    launchPlayhead();
  }
}

function updateSong(data) {
  updateSongAttributes(data);
  launchPlayer();
}

function updateSongAttributes(data) {
  $('#music-img').attr('src', data.item.album.images[0].url);
  $('#music-artist').text(data.item.artists[0].name);
  $('#music-title').text(data.item.name);
  currentTime = data.progress_ms;
  totalTime = data.item.duration_ms;
  $('#total-time').text(getTiming(totalTime));
  playing = data.is_playing;
}

function launchPlayhead() {
  interval = window.setInterval(function() {
    currentTime += 50;
    updateTimeline();
  }, 50);
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
    $('#playhead').css('margin-left', playPercent + "px");
  }
}

function fetchSong() {
  $('#connect-view').hide();
  chrome.storage.local.get(['accessToken'], function(result) {
    if (result) {
      $.ajax({
        url: 'https://api.spotify.com/v1/me/player/currently-playing',
        type: 'GET',
        headers: { "Authorization": "Bearer " + result.accessToken },
        success: function(data) {
          $('#player-view').show();
          updateSong(data);
        },
        error: function(error) {
          handleError(error.status, fetchSong);
        }
      })
    }
  });
}

function changeSong(direction = 'next') {
  chrome.storage.local.get(['accessToken'], function(result) {
    if (result) {
      $.ajax({
        url: 'https://api.spotify.com/v1/me/player/' + direction,
        type: 'POST',
        headers: { "Authorization": "Bearer " + result.accessToken },
        success: function() {
          fetchSong();
        },
        error: function(error) {
          handleError(error.status, changeSong);
        }
      })
    }
  });
}

function handleError(status, callback = null) {
  switch (status) {
  case 401:
    $('#player-view').hide();
    $('#connect-view').show();
    break;
  case 403:
    if(callback) {
      callback();
    }
    break;
  }
}
