$(function() {
  var timelineWidth = $('#timeline').width() - $('#playhead').width();
  var onplayhead = false;

  $('#timeline').on('click', function(event) {
    moveplayhead(event);
  })
  
  $('#playhead').on('mousedown', function() {
    mouseDown();
  });
  $('#playhead').on('mouseup', function(event) {
    mouseUp(event);
  });


  // mouseDown EventListener
  function mouseDown() {
    onplayhead = true;
    window.addEventListener('mousemove', moveplayhead, true);
  }

  // mouseUp EventListener
  // getting input from all mouse clicks
  function mouseUp(event) {
    console.log(onplayhead)
    if (onplayhead == true) {
        moveplayhead(event);
        window.removeEventListener('mousemove', moveplayhead, true);
    }
    onplayhead = false;
  }

  // mousemove EventListener
  // Moves playhead as user drags
  function moveplayhead(event) {
      var newMargLeft = event.clientX - getPosition(timeline);

      if (newMargLeft >= 0 && newMargLeft <= timelineWidth) {
        $('#playhead').css('margin-left', newMargLeft + "px");
      }
      if (newMargLeft < 0) {
        $('#playhead').css('margin-left', "0px");
      }
      if (newMargLeft > timelineWidth) {
        $('#playhead').css('margin-left', timelineWidth + "px");
      }
  }

  function getPosition(element) {
    return element.getBoundingClientRect().left;
  }
});
