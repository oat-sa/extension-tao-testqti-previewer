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
    'jquery',
    'taoTests/runner/runnerComponent',
    'tpl!taoQtiTestPreviewer/previewer/component/test/tpl/qtiTest',
    'css!taoQtiTestPreviewer/previewer/component/test/css/qtiTest',
    'css!taoQtiTestCss/new-test-runner'
], function (context, $, runnerComponentFactory, runnerTpl) {
    'use strict';

    /**
     * Builds a test runner to preview test
     * @param {jQuery|HTMLElement|String} container - The container in which renders the component
     * @param {Object} [config] - The testRunner options
     * @param {String} [config.testUri] - The test URI
     * @param {Object[]} [config.plugins] - Additional plugins to load
     * @param {String} [config.fullPage] - Force the previewer to occupy the full window.
     * @param {String} [config.readOnly] - Do not allow to modify the previewed item.
     * @returns {previewer}
     */
    return function qtiTestPreviewerFactory(container, config = {}) {
        const testRunnerConfig = {
            testDefinition: 'test-container',
            serviceCallId: 'previewer',
            providers: {
                runner: {
                    id: 'qti',
                    module: 'taoQtiTest/runner/provider/qti',
                    bundle: 'taoQtiTest/loader/taoQtiTestRunner.min',
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
                plugins: config.plugins,
                hideActionBars: config.hideActionBars,
                testUri: config.testUri
            },
            proxyProvider: 'qtiTestPreviewerProxy'
        };

        //extra context config
        testRunnerConfig.loadFromBundle = !!context.bundle;

        return runnerComponentFactory(container, testRunnerConfig, runnerTpl)
            .on('render', function() {
                const { fullPage, readOnly, hideActionBars } = this.getConfig().options;
                this.setState('fullpage', fullPage);
                this.setState('readonly', readOnly);
                this.setState('hideactionbars', hideActionBars);
            })
            .on('ready', function(runner) {
                runner.on('destroy', () => this.destroy());
                // clone logo and footer to preview
                $('#tao-main-logo').clone().appendTo('.previewer-component header');
                $('body > footer').clone().appendTo('.previewer-component');
            });
    };
});
