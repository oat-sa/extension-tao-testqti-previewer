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
    'context',
    'taoQtiTestPreviewer/previewer/runner',
    'css!taoQtiTestPreviewer/previewer/provider/item/css/item'
], function (context, previewerFactory) {
    'use strict';

    /**
     * Builds a test runner to preview test item
     * @param {jQuery|HTMLElement|String} container - The container in which renders the component
     * @param {Object} [config] - The testRunner options
     * @param {Object[]} [config.plugins] - Additional plugins to load
     * @param {String} [config.fullPage] - Force the previewer to occupy the full window.
     * @param {String} [config.readOnly] - Do not allow to modify the previewed item.
     * @param {Boolean} [config.replace] - When the component is appended to its container, clears the place before
     * @param {Number|String} [config.width] - The width in pixels, or 'auto' to use the container's width
     * @param {Number|String} [config.height] - The height in pixels, or 'auto' to use the container's height
     * @param {Function} [template] - An optional template for the component
     * @returns {previewer}
     */
    return function qtiItemPreviewerFactory(container, config = {}, template = null) {

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
                plugins: config.plugins || [],
            },
            options: {
                readOnly : config.readOnly,
                fullPage : config.fullPage
            }
        };

        //extra context config
        testRunnerConfig.loadFromBundle = !!context.bundle;

        return previewerFactory(container, testRunnerConfig, template);
    };
});
