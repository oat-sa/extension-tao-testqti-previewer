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
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Hanna Dzmitryieva <hanna@taotesting.com>
 */
define([
    'lodash',
    'core/promiseQueue',
    'core/logger',
    'taoQtiTestPreviewer/previewer/component/test/qtiTest',
    'ui/feedback'
], function (
    _,
    promiseQueue,
    loggerFactory,
    qtiTestPreviewerFactory,
    feedback
) {
    'use strict';

    const logger = loggerFactory('taoQtiTestPreviewer/previewer');

    /**
     * List of required plugins that should be loaded in order to make the previewer work properly
     * @type {Object[]}
     */
    const defaultPlugins = [
        {
            module: 'taoQtiTest/runner/plugins/tools/itemThemeSwitcher/itemThemeSwitcher',
            bundle: 'taoQtiTest/loader/testPlugins.min',
            category: 'tools'
        },
        {
            module: 'taoQtiTest/runner/plugins/navigation/previous',
            bundle: 'taoQtiTest/loader/testPlugins.min',
            category: 'navigation'
        },
        {
            module: 'taoQtiTest/runner/plugins/navigation/next',
            bundle: 'taoQtiTest/loader/testPlugins.min',
            category: 'navigation'
        },
        {
            module: 'taoQtiTestPreviewer/previewer/plugins/content/cloneLogoInTestPreview',
            bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
            category: 'content'
        }
    ];

    /**
     * Wraps the test previewer in order to be loaded by the taoItems previewer factory
     */
    return {
        name: 'qtiTest',

        install() {
            this.queue = promiseQueue();
        },

        /**
         * Builds and shows the test previewer
         *
         * @param {String} testUri - The URI of the test to load
         * @param {Object} [config] - Some config entries
         * @param {Object[]} [config.plugins] - Additional plugins to load
         * @param {String} [config.fullPage] - Force the previewer to occupy the full window.
         * @param {String} [config.readOnly] - Do not allow to modify the previewed item.
         * @returns {Object}
         */
        init(testUri, config = {}) {
            config.testUri = testUri;
            config.plugins = Array.isArray(config.plugins) ? [...defaultPlugins, ...config.plugins] : defaultPlugins;
            return qtiTestPreviewerFactory(window.document.body, config).on('error', function (err) {
                if (!_.isUndefined(err.message)) {
                    feedback().error(err.message);
                }
                logger.error(err);
            });
        },

        destroy() {
            this.queue = null;

            return Promise.resolve();
        },
    };
});
