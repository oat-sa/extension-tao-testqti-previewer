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
    'context',
    'taoQtiTestPreviewer/previewer/runner',
    'taoQtiTest/runner/helpers/map',
    'css!taoQtiTestPreviewer/previewer/provider/item/css/item'
], function (context, previewerFactory, mapHelper) {
    'use strict';

    /**
     * Builds a test runner to preview test
     * @param {jQuery|HTMLElement|String} container - The container in which renders the component
     * @param {Object} [config] - The testRunner options
     * @param {String} [config.testUri] - The test URI
     * @param {Object[]} [config.plugins] - Additional plugins to load
     * @param {String} [config.fullPage] - Force the previewer to occupy the full window.
     * @param {String} [config.readOnly] - Do not allow to modify the previewed item.
     * @param {Function} [template] - An optional template for the component
     * @returns {previewer}
     */
    return function qtiTestPreviewerFactory(container, config = {}, template = null) {
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
                    id: 'qtiTestPreviewerProxy',
                    module: 'taoQtiTestPreviewer/previewer/proxy/test',
                    bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                    category: 'proxy'
                },
                communicator: {
                    id: 'request',
                    module: 'core/communicator/request',
                    bundle: 'loader/vendor.min',
                    category: 'communicator'
                },
                plugins: config.plugins || []
            },
            options: {
                view: config.view,
                readOnly: config.readOnly,
                fullPage: config.fullPage,
                plugins: config.pluginsOptions,
                hideActionBars: config.hideActionBars
            },
            proxyProvider: 'qtiTestPreviewerProxy',
            testUri: config.testUri
        };

        //extra context config
        testRunnerConfig.loadFromBundle = !!context.bundle;

        return previewerFactory(container, testRunnerConfig, template).on('ready', runner => {
            // use testMap to display first item (position: 0)
            const dataHolder = runner.getDataHolder();
            const testMap = dataHolder.get('testMap');
            const item = mapHelper.getItemAt(testMap, 0);
            if (item && item.uri) {
                return runner.loadItem(item.uri);
            } else {
                runner.trigger('enabletools enablenav');
            }
        });
    };
});
