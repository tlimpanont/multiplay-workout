
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
var baseUrl = str.replace(/(?=#).*\/?$/g,""); 
/* ---> Do not delete this comment (Values) <--- */
app.constant('config', {
    firebaseUrl: 'https://multiplay-workout.firebaseio.com/',
    clientLocation: baseUrl + '#/client/',
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

app.controller('ClientCtrl', ['$scope', '$routeParams', 'config', '$firebase', 'Factory', 'isMobile', 'SoundJS', '$modal', function ($scope, $routeParams, config, $firebase, Factory, isMobile, SoundJS, $modal) {

	'use strict';

	/* template bindings */
	$scope.config = config;
    $scope.session = $firebase(new Firebase(config.firebaseUrl + $routeParams.sessionId));
    $scope.players = $scope.session.$child('players');
    $scope.qrcode =  $scope.session.$child('qrcode');
    $scope.views = $scope.session.$child('views');
    $scope.player = null;
    $scope.exerciseSeconds =  null;
    $scope.isMobile = isMobile;
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
                //assign player to free player position on the server
                $scope.player = $scope.players.$child(playerId);
                
                /*
                    //ask the player for his/her name 
                */
                var ModalInstanceCtrl = function ($scope, $modalInstance, $clientScope) {
                    $scope.submitNamePlayer = function(name) {
                        $scope = $clientScope;
                        $scope.player.$update({name: name});
                        $scope.updatePlayerPersistence(playerId);
                        $modalInstance.close();
                    }
                };

                if($scope.player.name === undefined)
                {
                    $modal.open({ templateUrl: 'myModalContent.html' , controller: ModalInstanceCtrl, resolve: {
                        $clientScope: function() {
                            return $scope;
                        }
                    }});
                }
                else
                {
                    $scope.updatePlayerPersistence(playerId);
                }
                
                
                /*
                    //END ask the player for his/her name 
                */
      
	        } // end playerId if
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

    //update this presence
    $scope.updatePlayerPersistence = function(playerId) {
        $scope.player.$update({hasJoinedGame: true});
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
    };       
    
    window.addEventListener('shake', shakeEventDidOccur, false);

    function shakeEventDidOccur () {
        $scope.requestExercise();
    }
    $scope.alerts = [];

    /*===== INTERACTIVITY HANDLERS ===== */
    $scope.requestExercise = function() {
    	var exercise = Factory.generateRandomExercise(); 
       
        if(confirm('Check the main screen for your exercise'))
        {
            // $scope.alerts.push({type: 'info', msg: 'Check the main screen for your time or repetitions'});
            // setTimeout(function() {
            //     $scope.$apply(function() {
            //         $scope.alerts = [];
            //     });
            // }, 3000);

            $scope.player.$update({
                exercise: exercise
            });

            if(exercise.time !== undefined)
            {   
                window.removeEventListener('shake', shakeEventDidOccur, false);
                var time = exercise.time.seconds;
                var duration = moment.duration(time * 1000, 'milliseconds');
                var interval = 1000;
                $scope.timeLeft = moment(duration.asMilliseconds()).format('mm:ss');

                exerciseInterval = setInterval(function(){
                     $scope.$apply(function() {
                        if(duration.asMilliseconds() <= 0)
                        {
                            SoundJS.play('end-timer');
                            $scope.player.$child('exercise').$remove();
                            clearInterval(exerciseInterval);
                            window.addEventListener('shake', shakeEventDidOccur, false);
                            return;
                        }   
                        duration = moment.duration(duration.asMilliseconds() - interval, 'milliseconds');
                        //show how many hours, minutes and seconds are left
                        $scope.timeLeft = moment(duration.asMilliseconds()).format('mm:ss');
                     });
                }, interval);

                window.removeEventListener('shake', shakeEventDidOccur, false);
            }
            else
            {
                clearInterval(exerciseInterval);
            }  
        }
    };

	
}]);


app.service('SoundJS', function() {
    // Create a single item to load.
    var assetsPath = 'assets/';
    
    createjs.Sound.addEventListener('fileload', handleFileLoad);
    function handleFileLoad(event) {
        // A sound has been preloaded.
        console.log('Preloaded:', event.id, event.src);
    }
    createjs.Sound.alternateExtensions = ['mp3'];
    createjs.Sound.registerSound({id:'end-timer', src:assetsPath+'end-timer.ogg'});
    createjs.Sound.registerSound({id:'second-tick', src:assetsPath+'second-tick.ogg'});

    this.play = function(name) {
        // Play the sound using the ID created above.
        return createjs.Sound.play(name);
    }

});

app.service('isMobile', function() {
    return function isMobile() {
        var a = navigator.userAgent||navigator.vendor||window.opera;
        return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4));
    }
});
/*-----  End of Controller = Client  ------*/





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

