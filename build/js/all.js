
/*================================================================
=>                  App = generatorBoom
==================================================================*/
/*global angular*/

var app = angular.module('generatorBoom', ['ngCookies', 'ngResource', 'ngSanitize', 'ngRoute', 'ngAnimate', 'ui.bootstrap', 'firebase']);


app.config(['$routeProvider', '$locationProvider', '$httpProvider', 'config', function ($routeProvider, $locationProvider, $httpProvider, config) {
	'use strict';

	$routeProvider
		.when('/', {
            redirectTo: function() {
                // end debug mode
                return '/host/' + config.generateSessionId();
            }
        })
        .when('/host/:sessionId', {
            templateUrl: 'templates/host.html',
        })
        .when('/client/:sessionId', {
            templateUrl: 'templates/client.html',
        })
        .otherwise({
            redirectTo: '/'
        });

	//$locationProvider.hashPrefix('!');

	// This is required for Browser Sync to work poperly
	$httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
}]);


/*================================================================
=>                  generatorBoom App Run()  
==================================================================*/

app.run(['$rootScope', function ($rootScope) {
	
	'use strict';

	console.log('Angular.js run() function... $rootScope =');
}]);

var str = document.URL;
var res = str.replace(/(?=#).*\/?$/g,""); 
/* ---> Do not delete this comment (Values) <--- */
app.constant('config', {
    firebaseUrl: 'https://multiplay-workout.firebaseio.com/',
    clientLocation: res + '#/client/',
    maxPlayers:2,
    generateSessionId: function() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }
});

/* ---> Do not delete this comment (Constants) <--- */

/*================================================================
=>                  Controller = Client
==================================================================*/
/*global app*/

app.controller('ClientCtrl', ['$scope', '$routeParams', 'config', '$firebase', 'Factory', function ($scope, $routeParams, config, $firebase, Factory) {

	'use strict';

	/* template bindings */
	$scope.config = config;
    $scope.session = $firebase(new Firebase(config.firebaseUrl + $routeParams.sessionId));
    $scope.players = $scope.session.$child('players');
    $scope.qrcode =  $scope.session.$child('qrcode');
    $scope.views = $scope.session.$child('views');
    $scope.player = null;
    $scope.exerciseSeconds =  null;
    var exerciseInterval = null;


    /*===== STEP 1: Manage Player persistence ===== */
    $scope.managePersistence = (function() {
    	$scope.session.$on('loaded', function(session) {
	       //which player is available? 
	        var playerId = _.filter($scope.players.$getIndex(), function(id) {
	           return ($scope.players[id].hasJoinedGame == false)
	        })[0];

	        // if we can find some place to check-in
	        if(playerId)
	        {
	            $scope.players.$child(playerId).$update({
	                hasJoinedGame: true
	            });

	            // assign connected player to te scope
	            $scope.player = $scope.players.$child(playerId);

	            // create connection ref when player close browser or destroy session
	            var myConnectionsRef = new Firebase(config.firebaseUrl + $routeParams.sessionId + '/players/' + playerId);
	            var connectedRef = new Firebase(config.firebaseUrl + '.info/connected');
	            connectedRef.on('value', function(snap) {
	                if (snap.val() === true) {

	                	// this player has to update its presence
	                    myConnectionsRef.update({
	                        hasJoinedGame: true
	                    });

	                    myConnectionsRef.onDisconnect().update({
	                       	exercise: null,
	                        hasJoinedGame: false
	                    });
	                }
	            });
	        }
    	});
    })();

    /*===== STEP 2: CHECK THE VIEW STATE OF THE GAME ===== */
    $scope.checkViewState = (function() {
        $scope.views.$on('change', function(name) {
            var name = $scope.views[name];

            switch(name)
            {
                case 'qrcodeHost' :
                    
                break;

                case 'chooseWorkoutTime' : 
                    
                break;

                case 'getReady' :

                break;

                case 'gamePlay' :
                    
                break;

                default :
                    return false;
                break;
            }

        });
    })();

     /*===== INTERACTIVITY HANDLERS ===== */
    $scope.requestExercise = function() {
    	var exercise = Factory.generateRandomExercise(); 
        $scope.player.$update({
    		exercise: exercise
    	});

        if(exercise.time !== undefined)
        {
            $scope.exerciseSeconds = parseInt(exercise.time.seconds);
            exerciseInterval = setInterval(function() {
                if($scope.exerciseSeconds <= 0)
                {
                    $scope.player.$child("exercise").$remove();
                    clearInterval(exerciseInterval);
                }
                $scope.exerciseSeconds--;
                $scope.$apply();
            } , 1000);
        }
        else
        {
            clearInterval(exerciseInterval);
        }
    };

	
}]);


/*-----  End of Controller = Client  ------*/





/*================================================================
=>                  Controller = Host
==================================================================*/
/*global app*/

app.controller('HostCtrl', ['$scope', '$routeParams', 'config', '$firebase', 'Player', 'Qrcode', 'Factory', function ($scope, $routeParams, config, $firebase, Player, Qrcode, Factory) {

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
    $scope.secondsLeft = null;

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
                if(playerConnected <= 0 || playerConnected === undefined)
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

                break;

                case 'gamePlay' :
                    $scope.secondsLeft = $scope.workoutTime.seconds;
                    gameInterval = setInterval(function() {
                        $scope.$apply(function() {
                            $scope.secondsLeft--;
                        });
                    }, 1000);
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

app.filter("decode", function() {
    return function(url) {
        return decodeURIComponent(url);
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
                new Exercise( 'Push Ups' , ''),
                new Exercise( 'Burpees' , ''),
                new Exercise( 'Air Squat' , ''),
                new Exercise( 'Frog Hop' , ''),
                new Exercise( 'Kettlebelt Swing' , ''),
                new Exercise( 'Single Arm Kettlebelt Squat Push Press (alternating)' , ''),
                new Exercise( 'Mountain Climbers' , ''),
                new Exercise( 'Prisoner Push Ups' , ''),
                new Exercise( 'Prisoner Squat' , ''),
                new Exercise( 'Squat Jump' , ''),
                new Exercise( 'Bear Crawl' , ''),
                new Exercise( 'Farmer Carry' , ''),
                new Exercise( 'Sit Ups' , ''),
                new Exercise( 'Squat Deck' , ''),
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

