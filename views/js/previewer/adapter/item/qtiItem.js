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
 * Copyright (c) 2019-2024 (original work) Open Assessment Technologies SA ;
 */
/**
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define(['lodash', 'core/logger', 'taoQtiTestPreviewer/previewer/component/qtiItem', 'ui/feedback'], function (
    _,
    loggerFactory,
    qtiItemPreviewerFactory,
    feedback
) {
    'use strict';

    const logger = loggerFactory('taoQtiTest/previewer');

    /**
     * List of required plugins that should be loaded in order to make the previewer work properly
     * @type {Object[]}
     */
    const defaultPlugins = [
        {
            module: 'taoQtiTestPreviewer/previewer/plugins/controls/close',
            bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
            category: 'controls'
        },
        {
            module: 'taoQtiTestPreviewer/previewer/plugins/navigation/submit/submit',
            bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
            category: 'navigation'
        },
        {
            module: 'taoQtiTestPreviewer/previewer/plugins/tools/scale/scale',
            bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
            category: 'tools'
        },
        {
            module: 'taoQtiTest/runner/plugins/tools/itemThemeSwitcher/itemThemeSwitcher',
            bundle: 'taoQtiTest/loader/testPlugins.min',
            category: 'tools'
        },
        {
            module: 'taoQtiTestPreviewer/previewer/plugins/content/enhancedReadOnlyMode',
            bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
            category: 'content'
        }
    ];

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
         * @param {boolean} [config.fullPage] - Force the previewer to occupy the full window.
         * @param {boolean} [config.readOnly] - Do not allow to modify the previewed item.
         * @param {string} [config.viewer] - Instruct the previewer of the type of usage.
         * @param {boolean} [config.disableDefaultPlugins] - Disable the plugins.
         * @returns {Object}
         */
        init(uri, state, config = {}) {
            config.itemUri = uri;
            config.itemState = state;
            if (!config.disableDefaultPlugins) {
                config.plugins = Array.isArray(config.plugins)
                    ? [...defaultPlugins, ...config.plugins]
                    : defaultPlugins;
            }
            return qtiItemPreviewerFactory(config.container || window.document.body, config).on(
                'error',
                function (err) {
                    if (!_.isUndefined(err.message)) {
                        feedback().error(err.message);
                    } else {
                        logger.error(err);
                    }
                }
            );
        }
    };
});
