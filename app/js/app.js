var app = angular.module('chatApp', []);

app.controller("Ctrl", function($scope) {

    $scope.chatData = {};
    $scope.chatMessages = [];
    $scope.usernames = [];

    $scope.socket = io.connect();
    $scope.nickForm = angular.element(document.querySelector('#setNick'));
    $scope.nickError = angular.element(document.querySelector('#nickError'));
    $scope.nickBox = angular.element(document.querySelector('#nickname'));
    $scope.messageForm = angular.element(document.querySelector('#send-message'));
    $scope.messageBox = angular.element(document.querySelector('#message'));
    $scope.chat = angular.element(document.querySelector('#chat'));

    $scope.submitNick = function() {
        $scope.socket.emit('new user', $scope.chatData.nickname, function(data) {
            if(data) {
                angular.element(document.querySelector('#nickWrap')).hide();
                angular.element(document.querySelector('#contentWrap')).show();
            } else {
                $scope.nickError.html('That username is already taken! Try again.');
            }
        });
        $scope.chatData.nickname = ''; 
    }

    $scope.submitMessage = function() {
        $scope.socket.emit('send message', $scope.chatData.message);
        $scope.chatData.message = ''; 
    }
    
    $scope.socket.on('new message', function(data) {
        $scope.updateMessages(data);
    });

    $scope.socket.on('whisper', function(data) {
        $scope.updateMessages(data);
    });

    $scope.socket.on('usernames', function(data) {
        $scope.$apply(function() {
            $scope.usernames = data;
        });
    });

    $scope.socket.on('error', function(data) {
        $scope.updateMessages(data);
    });

    $scope.socket.on('load old msgs', function(docs) {
        for(var i=docs.length-1; i >= 0; i--){
            docs[i].created = moment(docs[i].created).fromNow();
            $scope.updateMessages(docs[i]);
        };
    });

    $scope.updateMessages = function(data) {
        $scope.$apply(function() {
            $scope.chatMessages.push(data);
        });
    };
    
});