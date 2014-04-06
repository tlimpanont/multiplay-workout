
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

     window.addEventListener('shake', shakeEventDidOccur, false);

    //function to call when shake occurs
    function shakeEventDidOccur () {
        //put your own code here etc.
        if (confirm("Ready to workout?")) {
             $scope.requestExercise();     
        }
    }

     /*===== INTERACTIVITY HANDLERS ===== */
    $scope.requestExercise = function() {
    	var exercise = Factory.generateRandomExercise(); 
        $scope.player.$update({
    		exercise: exercise
    	});

        if(exercise.time !== undefined)
        {
            var time = exercise.time.seconds;
            var duration = moment.duration(time * 1000, 'milliseconds');
            var interval = 1000;
            $scope.timeLeft = moment(duration.asMilliseconds()).format('mm:ss');

            setInterval(function(){
                 $scope.$apply(function() {
                    if(duration.asMilliseconds() <= 0)
                    {
                        $scope.player.$child("exercise").$remove();
                        clearInterval(exerciseInterval);
                        return;
                    }   
                    duration = moment.duration(duration.asMilliseconds() - interval, 'milliseconds');
                    //show how many hours, minutes and seconds are left
                    $scope.timeLeft = moment(duration.asMilliseconds()).format('mm:ss');
                 });
            }, interval);
        }
        else
        {
            clearInterval(exerciseInterval);
        }
    };

	
}]);


/*-----  End of Controller = Client  ------*/



