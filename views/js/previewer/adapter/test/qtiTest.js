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
    'core/request',
    'util/url',
    'core/logger',
    'taoQtiTestPreviewer/previewer/component/test/qtiTest',
    'ui/feedback',
    'taoQtiTestPreviewer/previewer/component/topBlock/topBlock',
], function (
    _,
    promiseQueue,
    request,
    urlUtil,
    loggerFactory,
    qtiTestPreviewerFactory,
    feedback,
    topBlockFactory
) {
    'use strict';

    const taoExtension = 'taoQtiTestPreviewer';

    const testPreviewerController = 'TestPreviewer';

    const logger = loggerFactory('taoQtiTestPreviewer/previewer');

    /**
     * List of required plugins that should be loaded in order to make the previewer work properly
     * @type {Object[]}
     */
    const defaultPlugins = [
        {
            module: 'taoQtiTestPreviewer/previewer/plugins/content/cloneLogoInTestPreview',
            bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
            category: 'content'
        }
    ];

    const transformConfiguration = config => {
        const plugins = Array.isArray(config.plugins) ? [...defaultPlugins, ...config.plugins] : defaultPlugins;
        const { view, readOnly, fullPage, hideActionBars, pluginsOptions } = config;
        const options = _.omit({ view, readOnly, fullPage, hideActionBars }, _.isUndefined);

        return request({
            url: urlUtil.route('configuration', testPreviewerController, taoExtension),
            noToken: true
        }).then(response => {
            const configuration = response.data;

            configuration.providers.plugins = [...configuration.providers.plugins, ...plugins];

            _.assign(configuration.options, options);

            if (pluginsOptions) {
                if (!configuration.options.plugins) {
                    configuration.options.plugins = {};
                }
                _.assign(configuration.options.plugins, pluginsOptions);
            }

            return configuration;
        });
    };

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
            return transformConfiguration(config).then(testPreviewConfig => {
                testPreviewConfig.options.testUri = testUri;
                let topBlock = null;
                const previewComponent = qtiTestPreviewerFactory(window.document.body, testPreviewConfig)
                    .on('ready', function (runner) {
                        topBlock = topBlockFactory(
                            window.document.body,
                            {
                                isTest: testPreviewConfig.options.review.scope === 'test',
                                title: runner.getTestMap().title,
                                onClose: () =>  {
                                    runner.trigger('exit');
                                }
                            });
                    })
                    .on('error', function (err) {
                        if (topBlock){
                            topBlock.destroy();
                            topBlock = null;
                        }
                        if (!_.isUndefined(err.message)) {
                            feedback().error(err.message);
                        }
                        logger.error(err);
                    })
                    .on('destroy', () => {
                        if (topBlock){
                            topBlock.destroy();
                            topBlock = null;
                        }
                    });
                return previewComponent;
            });
        },

        destroy() {
            this.queue = null;

            return Promise.resolve();
        },
    };
});
