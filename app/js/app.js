var app = angular.module('chatApp', []);

app.controller("Ctrl", function($scope) {

    $scope.chatData = {};
    $scope.chatMessages = [];
    $scope.usernames = [];
    $scope.myStatus = {
        Available: 'Available',
        Busy: 'Busy',
        Away: 'Away'
    };

    $scope.socket = io.connect();
    $scope.nickForm = angular.element(document.querySelector('#setNick'));
    $scope.nickError = angular.element(document.querySelector('#nickError'));
    $scope.nickBox = angular.element(document.querySelector('#nickname'));
    $scope.messageForm = angular.element(document.querySelector('#send-message'));
    $scope.messageBox = angular.element(document.querySelector('#message'));
    $scope.chat = angular.element(document.querySelector('#chat'));

    // send nickname
    $scope.submitNick = function() {
        $scope.socket.emit('new user', $scope.chatData, function(data) {
            if(data) {
                angular.element(document.querySelector('#nickWrap')).hide();
                angular.element(document.querySelector('#contentWrap')).show();
            } else {
                $scope.nickError.html('That username or email is already taken! Try again.');
                $scope.chatData.nickname = ''; 
                $scope.chatData.email = ''; 
            }
        });
    }

    // send message
    $scope.submitMessage = function() {
        $scope.updateCreated();
        $scope.socket.emit('send message', $scope.chatData.message);
        $scope.chatData.message = ''; 
    }
    
    // listen to new message
    $scope.socket.on('new message', function(data) {
        // add timestamp which will hold unformatted datetime
        data.timestamp = data.created;
        // format our created
        data.created = moment(data.created).fromNow();
        data.emailHash = $scope.md5Hash(data.email);
        $scope.updateMessages(data); 
    });

    // listen to whisper
    $scope.socket.on('whisper', function(data) {
        $scope.updateMessages(data);
    });

    // listen to usernames
    $scope.socket.on('usernames', function(data) {
        $scope.$apply(function() {
            $scope.usernames = data;
        });
        console.log(data);
    });

    // listen to error
    $scope.socket.on('error', function(data) {
        $scope.updateMessages(data);
    });

    // listen to load old msgs and add them to current messages
    $scope.socket.on('load old msgs', function(docs) {
        for(var i=docs.length-1; i >= 0; i--){
            docs[i].timestamp = docs[i].created;
            docs[i].created = moment(docs[i].created).fromNow();
            docs[i].emailHash = $scope.md5Hash(docs[i].email);
            $scope.updateMessages(docs[i]);
        };
    });

    // add new message to current messages
    $scope.updateMessages = function(data) {
        $scope.$apply(function() {
            $scope.chatMessages.push(data);
        });
    };

    // update create timestamps that we will display
    $scope.updateCreated = function() {
        for(var i=0; i < $scope.chatMessages.length; i++){
            $scope.chatMessages[i].created = moment($scope.chatMessages[i].timestamp).fromNow();
        };
    };

    $scope.md5Hash = function(email) {
        return CryptoJS.MD5(email).toString();
    };
    
});