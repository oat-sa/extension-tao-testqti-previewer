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
    'lodash',
    'layout/loading-bar',
    'taoTests/runner/runnerComponent',
    'tpl!taoQtiTestPreviewer/previewer/component/test/tpl/qtiTest',
    'css!taoQtiTestPreviewer/previewer/component/test/css/qtiTest',
    'css!taoQtiTestCss/new-test-runner'
], function (context, __, loadingBar, runnerComponentFactory, runnerTpl) {
    'use strict';

    /**
     * Builds a test runner to preview test
     * @param {jQuery|HTMLElement|String} container - The container in which renders the component
     * @param {Object} [config] - The testRunner options
     *
     * @returns {runner}
     */
    return function qtiTestPreviewerFactory(container, config = {}) {
        const testRunnerConfig = __.defaults(
            {
                testDefinition: 'test-container',
                serviceCallId: 'previewer',
                proxyProvider: 'qtiTestPreviewerProxy',
                loadFromBundle: !!context.bundle,
            },
            config
        );

        testRunnerConfig.providers.proxy = [{
            id: 'qtiTestPreviewerProxy',
            module: 'taoQtiTestPreviewer/previewer/proxy/test',
            bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
            category: 'proxy'
        }];

        return runnerComponentFactory(container, testRunnerConfig, runnerTpl)
            .on('render', function() {
                const { fullPage, readOnly, hideActionBars } = this.getConfig().options;
                this.setState('fullpage', fullPage);
                this.setState('readonly', readOnly);
                this.setState('hideactionbars', hideActionBars);
            })
            .on('ready', function(runner) {
                runner.on('destroy', () => {
                    // stop loading bar - started in plugin loading
                    loadingBar.stop();
                    this.destroy();
                });
            });
    };
});
