
module.exports = function (grunt) {
	
	'use strict';

    grunt.initConfig({
  		pkg: grunt.file.readJSON('package.json'),
	  		
		shell: {
	        
	        bower_install: {
	        	command: 'bower install'
	        }
	    },
		
		uglify: {
	        files: { 
	            src: 'build/js/_bower.js',  // source files mask
	            dest: 'build/js/',    // destination folder
	            expand: true,    // allow dynamic building
	            flatten: true,   // remove all unnecessary nesting
	            ext: '.min.js'   // replace .js to .min.js
	        }
	    },

	    bower_concat: {
		  all: {
		    dest: 'build/js/_bower.js',
		    include: [
		        "angular",
			    "angular-resource",
			    "angular-cookies",
			    "angular-sanitize",
			    "angular-route",
			    "angular-animate",
			    "angular-bootstrap",
			    "jquery",
			    "modernizr",
			    "firebase",
			    "angularfire",
			    "underscore",
			    "shake.js"
		    ],
		    dependencies: {
				'modernizr': 'jquery',
				'angular-resource': 'angular',
				'angular-cookies': 'angular',
				'angular-sanitize': 'angular',
				'angular-route': 'angular',
				'angular-animate': 'angular',
				'angular-bootstrap': 'angular',
				'angularfire' : 'angular'		        
		    },
		    bowerOptions: {
		      relative: true
		    }
		  }
		}
	});

	// load plugins	
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-bower-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask('bower', ['bower_concat','uglify']);
	grunt.registerTask('bower_install', ['shell:bower']);
};