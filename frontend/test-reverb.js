const Pusher = require('pusher-js');

const socket = new Pusher('jtxp1dlmgkvhekz4wq4v', {
    wsHost: '127.0.0.1',
    wsPort: 8080,
    forceTLS: false,
    disableStats: true,
    enabledTransports: ['ws']
});

socket.connection.bind('state_change', function(states) {
    console.log("Connection State:", states.current);
});

socket.connection.bind('connected', function() {
    console.log('Connected to Reverb WebSockets API!');
});

const channel = socket.subscribe('table-session.1');

channel.bind('pusher:subscription_succeeded', function() {
    console.log('Successfully subscribed to table-session.1');
});

channel.bind('SessionStateChanged', function(data) {
    console.log('Received SessionStateChanged (no leading dot):', data);
});

channel.bind('.SessionStateChanged', function(data) {
    console.log('Received .SessionStateChanged (with leading dot):', data);
});

channel.bind_global(function(eventName, data) {
    console.log('Global listener event:', eventName, data);
});
