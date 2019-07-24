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
    'css!taoQtiTestPreviewer/previewer/provider/test/css/test'
], function (context, previewerFactory) {
    'use strict';

    /**
     * Builds a test runner to preview a test
     * @param {jQuery|HTMLElement|String} container - The container in which renders the component
     * @param {Object} [config] - The testRunner options
     * @param {Object[]} [config.plugins] - Additional plugins to load
     * @param {Object[]} [config.pluginsOptions] - Options for the plugins
     * @param {String} [config.fullPage] - Force the previewer to occupy the full window.
     * @param {String} [config.readOnly] - Do not allow to modify the previewed item.
     * @param {Function} [template] - An optional template for the component
     * @returns {previewer}
     */
    return function qtiTestPreviewerFactory(container, config = {}, template = null) {

        const testRunnerConfig = {
            testDefinition: config.testDefinition || 'test-container',
            serviceCallId: config.serviceCallId || 'previewer',
            providers: {
                runner: {
                    id: 'qtiTestPreviewer',
                    module: 'taoQtiTestPreviewer/previewer/provider/test/test',
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
                readOnly: config.readOnly,
                fullPage: config.fullPage,
                plugins: config.pluginsOptions
            }
        };

        //extra context config
        testRunnerConfig.loadFromBundle = !!context.bundle;

        return previewerFactory(container, testRunnerConfig, template);
    };
});
