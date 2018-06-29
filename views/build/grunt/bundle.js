module.exports = function(grunt) {
    'use strict';

    var root        = grunt.option('root');
    var libs        = grunt.option('mainlibs');
    var ext         = require(root + '/tao/views/build/tasks/helpers/extensions')(grunt, root);
    var out         = 'output';

    var paths = {
        'taoTests':                    root + '/taoTests/views/js',
        'taoQtiTest':                  root + '/taoQtiTest/views/js',
        'taoQtiTestCss':               root + '/taoQtiTest/views/css',
        'taoQtiTestPreviewer':         root + '/taoQtiTestPreviewer/views/js',
        'taoQtiTestPreviewerCss':      root + '/taoQtiTestPreviewer/views/css',
        'taoQtiItem':                  root + '/taoQtiItem/views/js',
        'taoQtiItemCss':               root + '/taoQtiItem/views/css',
        'taoItems':                    root + '/taoItems/views/js',
        'qtiCustomInteractionContext': root + '/taoQtiItem/views/js/runtime/qtiCustomInteractionContext',
        'qtiInfoControlContext':       root + '/taoQtiItem/views/js/runtime/qtiInfoControlContext'
    };

    var itemRuntime = ext.getExtensionSources('taoQtiItem', ['views/js/qtiItem/core/**/*.js', 'views/js/qtiCommonRenderer/renderers/**/*.js',  'views/js/qtiCommonRenderer/helpers/**/*.js'], true);
    var testPlugins = ext.getExtensionSources('taoQtiTest', ['views/js/runner/plugins/**/*.js'], true);
    var qtiPreviewer = ext.getExtensionSources('taoQtiTestPreviewer', ['views/js/previewer/**/*.js'], true);

    grunt.config.merge({

        /**
        * Compile tao files into a bundle
        */
        requirejs : {
            qtipreviewer : {
                options: {
                    paths : paths,
                    include: ['lib/require', 'loader/bootstrap'].concat(qtiPreviewer).concat(itemRuntime),
                    excludeShallow : ['mathJax', 'ckeditor'].concat(testPlugins).concat(libs),
                    exclude : ['json!i18ntr/messages.json'],
                    out: out + "/qtiPreviewer.min.js"
                }
            }
        },

        copy : {
            taoqtitestpreviewerbundle : {
                files: [
                    { src: [out + '/qtiPreviewer.min.js'],  dest: root + '/taoQtiTestPreviewer/views/js/loader/qtiPreviewer.min.js' },
                    { src: [out + '/qtiPreviewer.min.js.map'],  dest: root + '/taoQtiTestPreviewer/views/js/loader/qtiPreviewer.min.js.map' }
                ]
            }
        }
    });

    // bundle task
    grunt.registerTask('taoqtitestpreviewerbundle', [
        'clean:bundle',
        'requirejs:qtipreviewer',
        'copy:taoqtitestpreviewerbundle'
    ]);
};
