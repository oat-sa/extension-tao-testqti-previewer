/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'lodash',
    'context',
    'core/logger',
    'taoQtiTestPreviewer/previewer/runner',
    'ui/feedback',
    'css!taoQtiTestPreviewer/previewer/provider/item/css/item'
], function (_, context, loggerFactory, previewerFactory, feedback) {
    'use strict';

    var logger = loggerFactory('taoQtiTest/previewer');

    /**
     * List of required plugins that should be loaded in order to make the previewer work properly
     * @type {Object[]}
     */
    var defaultPlugins = [{
        module: 'taoQtiTestPreviewer/previewer/plugins/controls/close',
        bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
        category: 'controls'
    }, {
        module: 'taoQtiTestPreviewer/previewer/plugins/navigation/submit/submit',
        bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
        category: 'navigation'
    }, {
        module: 'taoQtiTestPreviewer/previewer/plugins/tools/scale/scale',
        bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
        category: 'tools'
    }, {
        module: 'taoQtiTest/runner/plugins/tools/itemThemeSwitcher/itemThemeSwitcher',
        bundle: 'taoQtiTest/loader/testPlugins.min',
        category: 'tools'
    }];

    /**
     * Wraps the legacy item previewer in order to be loaded by the taoItems previewer factory
     */
    return {
        name: 'qtiItem',

        /**
         * Builds and shows the legacy item previewer
         *
         * @param {String} uri - The URI of the item to load
         * @param {Object} state - The state of the item
         * @param {Object} [config] - Some config entries
         * @param {Object[]} [config.plugins] - Additional plugins to load
         * @param {String} [config.fullPage] - Force the previewer to occupy the full window.
         * @param {String} [config.readOnly] - Do not allow to modify the previewed item.
         * @returns {Object}
         */
        init(uri, state, config = {}) {

            const plugins = Array.isArray(config.plugins) ? [...defaultPlugins, ...config.plugins] : defaultPlugins;
            const testRunnerConfig = {
                testDefinition: 'test-container',
                serviceCallId: 'previewer',
                providers: {
                    runner: {
                        id: 'qtiItemPreviewer',
                        module: 'taoQtiTestPreviewer/previewer/provider/item/item',
                        bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                        category: 'runner'
                    },
                    proxy: {
                        id: 'qtiItemPreviewerProxy',
                        module: 'taoQtiTestPreviewer/previewer/proxy/item',
                        bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                        category: 'proxy'
                    },
                    communicator: {
                        id: 'request',
                        module: 'core/communicator/request',
                        bundle: 'loader/vendor.min',
                        category: 'communicator'
                    },
                    plugins,
                },
                options: {
                    readOnly : config.readOnly,
                    fullPage : config.fullPage
                }
            };

            //extra context config
            testRunnerConfig.loadFromBundle = !!context.bundle;

            return previewerFactory(testRunnerConfig)
                .on('error', function (err) {
                    if (!_.isUndefined(err.message)) {
                        feedback().error(err.message);
                    } else {
                        logger.error(err);
                    }
                })
                .on('ready', function (runner) {
                    runner
                        .on('renderitem', function () {
                            if (state) {
                                runner.itemRunner.setState(state);
                            }
                        })
                        .loadItem(uri);
                });
        }
    };
});
