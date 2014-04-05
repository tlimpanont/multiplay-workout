
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