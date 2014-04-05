
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



