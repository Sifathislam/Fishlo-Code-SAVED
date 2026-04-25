function updateTimer() {
    var date = $('.timer').data('date');
    futuretime = Date.parse(date);
    now = new Date();
    diff = futuretime - now;

    days = Math.floor(diff / (1000 * 60 * 60 * 24));
    hours = Math.floor(diff / (1000 * 60 * 60));
    mins = Math.floor(diff / (1000 * 60));
    secs = Math.floor(diff / 1000);

    d = days;
    h = hours - days * 24;
    m = mins - hours * 60;
    s = secs - mins * 60;

    let timers = document.querySelectorAll('.timer')
    timers.forEach((e) => {
        e.innerHTML =
            '<div class="deal-timer">' +
            '<div class="time-block"><div class="time">' + d + '</div><span class="text">Days</span></div>' +
            '<div class="time-block"><div class="time">' + h + '</div><span class="text">Hours</span></div>' +
            '<div class="time-block"><div class="time">' + m + '</div><span class="text">Minute</span></div>' +
            '<div class="time-block"><div class="time">' + s + '</div><span class="text">Second</span></div>' +
            '</div>';
    })
}
setInterval('updateTimer()', 1000);
