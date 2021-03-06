
/*================================================================
=>                  Controller = Host
==================================================================*/
/*global app*/

app.controller('HostCtrl', ['$scope', '$routeParams', 'config', '$firebase', 'Player', 'Qrcode', 'Factory', 'SoundJS', function ($scope, $routeParams, config, $firebase, Player, Qrcode, Factory, SoundJS) {

	'use strict';

    /* template bindings */
	$scope.config = config;
    $scope.session = $firebase(new Firebase(config.firebaseUrl + $routeParams.sessionId));
    $scope.players = $scope.session.$child('players');
    $scope.qrcode =  $scope.session.$child('qrcode');
    $scope.views = $scope.session.$child('views');
    $scope.workoutTime = $scope.session.$child('workoutTime');
    $scope.workoutTimes = Factory.getWorkoutTimes();
    $scope.exercises = Factory.getExercises();

    /* init values */
    var playerConnected = 0;
    var gameInterval = null;

	/*===== STEP 1: CREATE BRAND NEW SESSION IF NOT EXISTS ===== */
	$scope.createSessionIfNotExists = (function() {
        $scope.session.$on('loaded', function(session) {
            if(!session)
            {
                for(var i = 0; i < config.maxPlayers; i++ )
                {
                    $scope.players.$add(new Player());
                }

                $scope.qrcode.$set(new Qrcode(
                                        encodeURIComponent( config.clientLocation + $routeParams.sessionId )
                                    ));

                // our first view is qrcodeHost
                $scope.views.$set({
                    name: 'qrcodeHost'
                });
            }
        });
    })();

	/*===== STEP 2: CHECK HOW MANY PLAYERS ARE CONNECTED ===== */
    $scope.checkPlayersConnected = (function() {
        

        $scope.players.$on('change', function(playerId) {

            var  playerConnected = _.countBy($scope.players, function(player) {
                return (player.hasJoinedGame);
            }).true;

            // if enough players than move to the section where we can choose workoutime
            if($scope.views.name === 'qrcodeHost' ) {
                if(playerConnected >= config.maxPlayers)
                {
                    $scope.views.$set({
                        name: 'chooseWorkoutTime'
                    });
                }
            }
            else 
            {
                if(playerConnected <= 1 || playerConnected === undefined)
                {
                    $scope.views.$set({
                        name: 'qrcodeHost'
                    });
                }
            }
        });
    })();

    /*===== STEP 3: CHECK THE VIEW STATE OF THE GAME ===== */
    $scope.checkViewState = (function() {
        $scope.views.$on('change', function(name) {
            var name = $scope.views[name];

            switch(name)
            {
                case 'qrcodeHost' :
                    clearInterval(gameInterval);
                break;

                case 'chooseWorkoutTime' : 
                    clearInterval(gameInterval);
                break;

                case 'getReady' :
                    $scope.countToBegin = 5;
                    var countToBeginInterval = setInterval(function() {
                        $scope.$apply(function() {
                            if($scope.countToBegin <= 1)
                            {
                                $scope.startGame();
                                clearInterval(countToBeginInterval);
                                return;
                            }
                            SoundJS.play("second-tick");
                            $scope.countToBegin--;
                        });

                    }, 1000);
                break;

                case 'gamePlay' :
                    var time = $scope.workoutTime.seconds;
                    var duration = moment.duration(time * 1000, 'milliseconds');
                    var interval = 1000;
                    moment.duration(duration.asMilliseconds() - interval * 2, 'milliseconds');
                    $scope.timeLeft = moment(duration.asMilliseconds()).format('mm:ss');

                    gameInterval = setInterval(function(){
                         $scope.$apply(function() {
                            if(duration.asMilliseconds() <= 0)
                            {
                                alert('Congratz! Your workout is finished');
                                clearInterval(gameInterval);
                                return;
                            }   
                            duration = moment.duration(duration.asMilliseconds() - interval, 'milliseconds');
                            //show how many hours, minutes and seconds are left
                            $scope.timeLeft = moment(duration.asMilliseconds()).format('mm:ss');
                         });
                    }, interval);
                break;

                default :
                    return false;
                break;
            }

        });
    })();


    /*===== INTERACTIVITY HANDLERS ===== */

    // SETTING WORKOUT TIME
    $scope.setWorkoutTime = function($index) {
        var workoutime = $scope.workoutTimes[$index];
        $scope.workoutTime.$set(workoutime);
        $scope.views.$set({name: 'getReady'});
    }

    $scope.startGame = function() {
        $scope.views.$set({name: 'gamePlay'});
    }

}]);

app.directive("centered", function() {
  return {
        restrict : "ECA",
        transclude : true,
        template : "<div class='angular-center-container'><div class='angular-centered' ng-transclude></div></div>"
    };
});


app.filter("decode", function() {
    return function(url) {
        return decodeURIComponent(url);
    }
});


app.filter("randomArray", function() {
    return function(array) {
        return _.random(array, array.length - 1);
    }
});

app.service('Factory', ['Time', 'Exercise', function(Time, Exercise) {
    return {
        getWorkoutTimes : function() {
            return [
                new Time({minutes: 15}),
                new Time({minutes: 30}),
                new Time({minutes: 45}),
                new Time({minutes: 60})
            ]
        },
        getExercises : function() {
            return [
                new Exercise('Kettlebelt Squat Push Press (alternating)' , ''),
                new Exercise('Jump Slam Battle Rope', ''),
                new Exercise('Forward Lunge (alternating)', ''),
                new Exercise('Backward Lunge (alternating)', ''),
                new Exercise('Plyometric Jump', ''),
                new Exercise('Split Jump', ''),
                new Exercise('Mountain Climbers' , ''),
                new Exercise('Push Ups' , ''),
                new Exercise('Burpees' , ''),
                new Exercise('Air Squat' , ''),
                new Exercise('Frog Hop' , ''),
                new Exercise('Dumbell Squat Push Press', ''),
                new Exercise('Rope Skipping', ''),
                new Exercise('Squat Thrust', ''),
                new Exercise('Deadlift', ''),
                new Exercise('Kettlebelt Swing' , ''),
                new Exercise('Farmer Carry' , ''),
                new Exercise('Sit Ups' , ''),
                new Exercise('Squat Deck' , ''),
                new Exercise('Left&Right Battle Rope', ''),
                new Exercise('Prisoner Push Ups' , ''),
                new Exercise('Prisoner Squat' , ''),
                new Exercise('Squat Jump' , ''),
                new Exercise('Bear Crawl' , ''),
                new Exercise('Deadlift High Pull', '')
            ]
        },
        getExerciseTimes : function() {
            return  [
                new Time({seconds: 10}),
                new Time({seconds: 20}),
                new Time({seconds: 45}),
                new Time({seconds: 60})
            ];
        },
        getRepetitions:  function() {
             return  [5, 10, 12, 15, 20];
        },
        generateRandomExercise : function() {
            var exerciseModes = ['time', 'repetitions'];
            var exerciseList = this.getExercises();
            var exercise = exerciseList[_.random(0, exerciseList.length - 1)];
            var mode = exerciseModes[_.random(0, exerciseModes.length - 1)];

            if(mode == 'repetitions')
            {
                var repetitionsList = this.getRepetitions();
                exercise[mode] = repetitionsList[_.random(0, repetitionsList.length - 1)];
            }
            if(mode == 'time')
            {
                var timeList = this.getExerciseTimes();
                exercise[mode] = timeList[_.random(0, timeList.length - 1)];
            }

            return exercise;
        }
    }
}]);

app.factory('Qrcode', function() {
    var Qrcode = function(data) {
        this.data = data;
        this.apiUrl = 'https://api.qrserver.com/v1/create-qr-code/';
        this.size = '150x150';
        this.imageUrl = this.apiUrl + '?size=' + this.size + '&data='+this.data;
    };
    return Qrcode;
});

app.factory('Player', function () {
    var Player = function() {
        this.id = Math.floor(Math.random() * 100000);
        this.hasJoinedGame = false;
    };
    return Player;
});

app.factory('Time', function () {
    var Time = function(options) {
        if(options.minutes !== undefined)
        {
            this.minutes = options.minutes;
            this.seconds = this.minutes * 60;
            this.milliSeconds = this.minutes * 6000;
        }

        if(options.seconds !== undefined)
        {
            this.seconds = options.seconds;
            this.minutes = options.seconds / 60;
            this.milliSeconds = this.minutes / 6000;
        }
    };
    return Time;
});

app.factory('Exercise', function () {
    var Exercise = function(name, imageUrl) {
        this.name = name;
        this.imageUrl = imageUrl;
    };
    return Exercise;
});
/*-----  End of Controller = Host  ------*/

